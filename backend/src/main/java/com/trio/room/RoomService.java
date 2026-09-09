package com.trio.room;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomService {
    public record Player(String nickname, String mark) {}
    public record View(String code, String status, List<Player> players, Instant expiresAt,
                       long revision, GameSession.View game) {}
    public record Command(String type, Integer index, Long revision) {}
    public record Membership(String token, String mark, View room) {}
    private record Member(String token, Player player) {}
    private static final class Room {
        final String code;
        final List<Member> members = new ArrayList<>();
        final Instant expiresAt;
        long revision;
        GameSession game;
        final ChatSession chat = new ChatSession();

        Room(String code, Instant expiresAt) { this.code = code; this.expiresAt = expiresAt; }
    }

    private final Map<String, Room> rooms = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;

    public RoomService() { this(Clock.systemUTC()); }

    RoomService(Clock clock) { this.clock = clock; }

    public synchronized Membership create(String nickname) {
        nickname = validateName(nickname);
        purge();
        if (rooms.size() >= 1000) throw error(HttpStatus.SERVICE_UNAVAILABLE, "capacity");
        String code;
        do {
            StringBuilder value = new StringBuilder();
            for (int i = 0; i < 6; i++) value.append("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(random.nextInt(36)));
            code = value.toString();
        } while (rooms.containsKey(code));
        Room room = new Room(code, clock.instant().plus(Duration.ofMinutes(30)));
        rooms.put(code, room);
        return add(room, nickname, "X");
    }

    public synchronized Membership join(String code, String nickname) {
        nickname = validateName(nickname);
        purge();
        if (!code.matches("[A-Z0-9]{6}")) throw error(HttpStatus.BAD_REQUEST, "invalidCode");
        Room room = rooms.get(code);
        if (room == null) throw error(HttpStatus.NOT_FOUND, "roomNotFound");
        if (room.members.size() == 2) throw error(HttpStatus.CONFLICT, "roomFull");
        return add(room, nickname, "O");
    }

    public synchronized View view(String token) { return view(find(token)); }

    public synchronized ChatSession.View chat(String token) {
        return chatRoom(token).chat.view(clock.instant());
    }

    public synchronized ChatSession.View chatCommand(String token, ChatSession.Command command) {
        Room room = chatRoom(token);
        String mark = room.members.stream().filter(member -> member.token.equals(token))
                .findFirst().orElseThrow().player.mark();
        return room.chat.command(mark, command, clock.instant());
    }

    private Room chatRoom(String token) {
        Room room = find(token);
        if (room.members.size() != 2) throw error(HttpStatus.CONFLICT, "waitingPlayer");
        return room;
    }

    public synchronized View command(String token, Command command) {
        Room room = find(token);
        // Both players may confirm from the same finished-round snapshot.
        boolean concurrentRematch = "next".equals(command.type()) && room.game != null
                && room.game.awaitingRematch() && Objects.equals(command.revision(), room.revision - 1);
        if (command.revision() == null || (command.revision() != room.revision && !concurrentRematch))
            throw error(HttpStatus.CONFLICT, "staleState");
        String mark = room.members.stream().filter(member -> member.token.equals(token))
                .findFirst().orElseThrow().player.mark();
        if ("start".equals(command.type())) {
            requireHost(mark);
            if (room.members.size() != 2) throw error(HttpStatus.CONFLICT, "waitingPlayer");
            if (room.game != null) throw error(HttpStatus.CONFLICT, "alreadyStarted");
            room.game = new GameSession();
        } else if ("move".equals(command.type())) {
            if (room.game == null) throw error(HttpStatus.CONFLICT, "notStarted");
            room.game.move(mark, command.index());
        } else if ("next".equals(command.type())) {
            if (room.game == null) throw error(HttpStatus.CONFLICT, "notStarted");
            if (!room.game.confirmRematch(mark)) return view(room);
        } else throw error(HttpStatus.BAD_REQUEST, "invalidAction");
        room.revision++;
        return view(room);
    }

    private void requireHost(String mark) {
        if (!"X".equals(mark)) throw error(HttpStatus.FORBIDDEN, "hostOnly");
    }

    public synchronized List<String> tokens(String token) {
        return find(token).members.stream().map(Member::token).toList();
    }

    private Room find(String token) {
        purge();
        return rooms.values().stream()
                .filter(room -> room.members.stream().anyMatch(member -> member.token.equals(token)))
                .findFirst().orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "sessionExpired"));
    }

    private void purge() { rooms.values().removeIf(room -> !room.expiresAt.isAfter(clock.instant())); }

    private Membership add(Room room, String nickname, String mark) {
        String token = UUID.randomUUID().toString();
        room.members.add(new Member(token, new Player(nickname, mark)));
        room.revision++;
        return new Membership(token, mark, view(room));
    }

    private View view(Room room) {
        var game = room.game == null ? null : room.game.view();
        String status = game == null ? (room.members.size() == 2 ? "READY" : "WAITING")
                : game.winner() == null ? "PLAYING" : "FINISHED";
        return new View(room.code, status, room.members.stream().map(Member::player).toList(),
                room.expiresAt, room.revision, game);
    }

    private String validateName(String nickname) {
        if (nickname == null || nickname.strip().length() < 2 || nickname.strip().length() > 20)
            throw error(HttpStatus.BAD_REQUEST, "invalidName");
        return nickname.strip();
    }

    private ResponseStatusException error(HttpStatus status, String code) {
        return new ResponseStatusException(status, code);
    }
}
