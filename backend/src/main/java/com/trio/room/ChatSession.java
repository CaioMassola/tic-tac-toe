package com.trio.room;

import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class ChatSession {
    record Message(String id, String mark, String text, Instant sentAt) {}
    record View(long revision, List<Message> messages, Map<String, Instant> typing) {}
    record Command(String id, String text, Boolean typing) {}
    private final List<Message> messages = new ArrayList<>();
    private final Map<String, Instant> typing = new HashMap<>();
    private final Map<String, Instant> lastMessage = new HashMap<>();
    private long revision;

    View view(Instant now) {
        var active = new HashMap<String, Instant>();
        typing.forEach((mark, until) -> { if (until.isAfter(now)) active.put(mark, until); });
        return new View(revision, List.copyOf(messages), Map.copyOf(active));
    }

    View command(String mark, Command command, Instant now) {
        if (command.typing() != null) {
            if (command.typing()) typing.put(mark, now.plusSeconds(4));
            else typing.remove(mark);
        } else {
            if (command.id() == null || !command.id().matches("[a-zA-Z0-9-]{1,64}")
                    || command.text() == null || command.text().isBlank() || command.text().length() > 500)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalidMessage");
            if (messages.stream().anyMatch(message -> message.id().equals(command.id()) && message.mark().equals(mark)))
                return view(now);
            if (lastMessage.containsKey(mark) && lastMessage.get(mark).plusMillis(300).isAfter(now))
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "chatTooFast");
            messages.add(new Message(command.id(), mark, command.text().strip(), now));
            if (messages.size() > 100) messages.removeFirst();
            lastMessage.put(mark, now);
            typing.remove(mark);
        }
        revision++;
        return view(now);
    }
}
