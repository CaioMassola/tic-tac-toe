package com.trio.room;

import java.security.Principal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    public record Request(String nickname) {}
    private final RoomService rooms;
    private final SimpMessagingTemplate messaging;

    public RoomController(RoomService rooms, SimpMessagingTemplate messaging) {
        this.rooms = rooms;
        this.messaging = messaging;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomService.Membership create(@RequestBody Request request) {
        return rooms.create(request.nickname());
    }

    @PostMapping("/{code}/join")
    public RoomService.Membership join(@PathVariable String code, @RequestBody Request request) {
        var membership = rooms.join(code, request.nickname());
        send(membership.token());
        return membership;
    }

    @MessageMapping("/room")
    public void snapshot(Principal principal) { send(principal.getName()); }

    @PostMapping("/actions")
    public RoomService.View command(@RequestHeader(value = "Authorization", defaultValue = "") String authorization,
                                    @RequestBody RoomService.Command command) {
        String token = authorization.startsWith("Bearer ") ? authorization.substring(7) : "";
        synchronized (rooms) {
            try {
                var view = rooms.command(token, command);
                send(token);
                return view;
            } catch (ResponseStatusException exception) {
                // Resynchronize valid members after rejecting a stale or illegal action.
                if (exception.getStatusCode().value() != 401) send(token);
                throw exception;
            }
        }
    }

    private void send(String token) {
        synchronized (rooms) {
            var view = rooms.view(token);
            for (String recipient : rooms.tokens(token))
                messaging.convertAndSendToUser(recipient, "/queue/room", view);
        }
    }

    @ExceptionHandler(ResponseStatusException.class)
    public org.springframework.http.ResponseEntity<Map<String, String>> error(ResponseStatusException exception) {
        return org.springframework.http.ResponseEntity.status(exception.getStatusCode())
                .body(Map.of("code", exception.getReason()));
    }
}
