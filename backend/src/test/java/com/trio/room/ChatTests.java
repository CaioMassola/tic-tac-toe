package com.trio.room;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class ChatTests {
    @Test
    void authenticatesMembersWaitsForBothAndDoesNotChangeGameRevision() {
        var rooms = new RoomService();
        var host = rooms.create("Ana");
        assertThrows(ResponseStatusException.class, () -> rooms.chat("wrong"));
        assertThrows(ResponseStatusException.class, () -> rooms.chat(host.token()));
        var guest = rooms.join(host.room().code(), "Beto");
        var other = rooms.create("Other");
        rooms.join(other.room().code(), "Friend");
        rooms.chatCommand(host.token(), new ChatSession.Command("one", " Boa sorte! ", null));
        var view = rooms.chat(guest.token());
        assertEquals("Boa sorte!", view.messages().getFirst().text());
        assertEquals("X", view.messages().getFirst().mark());
        assertEquals(2, rooms.view(host.token()).revision());
        assertTrue(rooms.chat(other.token()).messages().isEmpty());
        rooms.command(host.token(), new RoomService.Command("start", null, 2L));
        assertEquals(view, rooms.chat(host.token()));
    }

    @Test
    void typingExpiresAndSendingClearsIt() {
        var chat = new ChatSession();
        var now = Instant.parse("2026-09-08T12:00:00Z");
        chat.command("X", new ChatSession.Command(null, null, true), now);
        assertTrue(chat.view(now).typing().containsKey("X"));
        assertTrue(chat.view(now.plusSeconds(4)).typing().isEmpty());
        chat.command("O", new ChatSession.Command(null, null, true), now);
        chat.command("O", new ChatSession.Command(null, null, false), now);
        assertFalse(chat.view(now).typing().containsKey("O"));
        chat.command("X", new ChatSession.Command("one", "Hi", null), now);
        assertTrue(chat.view(now).typing().isEmpty());
    }

    @Test
    void validatesDeduplicatesRateLimitsAndBoundsHistory() {
        var chat = new ChatSession();
        var now = Instant.now();
        for (String text : new String[]{null, " ", "x".repeat(501)})
            assertThrows(ResponseStatusException.class, () -> chat.command("X", new ChatSession.Command("id", text, null), now));
        for (String id : new String[]{null, "", "bad id", "x".repeat(65)})
            assertThrows(ResponseStatusException.class, () -> chat.command("X", new ChatSession.Command(id, "Hi", null), now));
        var command = new ChatSession.Command("one", "Hi", null);
        chat.command("X", command, now);
        chat.command("X", command, now);
        assertEquals(1, chat.view(now).messages().size());
        assertThrows(ResponseStatusException.class, () -> chat.command("X", new ChatSession.Command("two", "Again", null), now));
        chat.command("O", command, now);
        assertEquals(2, chat.view(now).messages().size());
        for (int i = 1; i <= 101; i++)
            chat.command("X", new ChatSession.Command("id-" + i, "Message " + i, null), now.plusSeconds(i));
        assertEquals(100, chat.view(now).messages().size());
        assertEquals("Message 2", chat.view(now).messages().getFirst().text());
    }
}
