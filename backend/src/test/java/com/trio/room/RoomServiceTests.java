package com.trio.room;

import java.time.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class RoomServiceTests {
    @Test
    void createsJoinsAndProtectsMemberships() {
        var rooms = new RoomService();
        var host = rooms.create(" Ana ");
        assertTrue(host.room().code().matches("[A-Z0-9]{6}"));
        assertEquals("X", host.mark());
        assertEquals("Ana", host.room().players().getFirst().nickname());
        assertEquals("WAITING", host.room().status());
        var guest = rooms.join(host.room().code(), "Beto");
        assertEquals("O", guest.mark());
        assertNotEquals(host.token(), guest.token());
        assertEquals("READY", rooms.view(host.token()).status());
        assertEquals(rooms.view(host.token()), rooms.view(guest.token()));
        assertEquals(2, rooms.tokens(host.token()).size());
        assertEquals("roomFull", assertThrows(ResponseStatusException.class,
                () -> rooms.join(host.room().code(), "Third")).getReason());
        assertThrows(ResponseStatusException.class, () -> rooms.view("wrong"));
        assertThrows(ResponseStatusException.class, () -> rooms.view(null));
    }

    @Test
    void validatesNamesAndCodes() {
        var rooms = new RoomService();
        for (String name : new String[]{null, "", "  ", "A", "x".repeat(21)}) {
            assertEquals("invalidName", assertThrows(ResponseStatusException.class, () -> rooms.create(name)).getReason());
        }
        assertEquals("invalidCode", assertThrows(ResponseStatusException.class, () -> rooms.join("bad", "Ana")).getReason());
        assertEquals("roomNotFound", assertThrows(ResponseStatusException.class, () -> rooms.join("AAAAAA", "Ana")).getReason());
    }

    @Test
    void expiresRoomAndInvalidatesBothTokens() {
        var now = new AtomicReference<>(Instant.parse("2026-09-07T12:00:00Z"));
        Clock clock = new Clock() {
            public ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(ZoneId zone) { return this; }
            public Instant instant() { return now.get(); }
        };
        var rooms = new RoomService(clock);
        var host = rooms.create("Ana");
        var guest = rooms.join(host.room().code(), "Beto");
        now.set(now.get().plusSeconds(1800));
        assertThrows(ResponseStatusException.class, () -> rooms.view(host.token()));
        assertThrows(ResponseStatusException.class, () -> rooms.view(guest.token()));
        assertThrows(ResponseStatusException.class, () -> rooms.join(host.room().code(), "Other"));
    }

    @Test
    void concurrentJoinsCannotOverfillRoom() throws Exception {
        var rooms = new RoomService();
        var host = rooms.create("Ana");
        var gate = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(8)) {
            var futures = new java.util.ArrayList<Future<Boolean>>();
            for (int i = 0; i < 8; i++) futures.add(executor.submit(() -> {
                gate.await();
                try { rooms.join(host.room().code(), "Guest"); return true; }
                catch (ResponseStatusException e) { assertEquals("roomFull", e.getReason()); return false; }
            }));
            gate.countDown();
            int joined = 0;
            for (var future : futures) if (future.get(5, TimeUnit.SECONDS)) joined++;
            assertEquals(1, joined);
        }
    }
}
