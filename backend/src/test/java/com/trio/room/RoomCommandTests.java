package com.trio.room;

import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class RoomCommandTests {
    @Test
    void enforcesHostTurnAndRevisionAndRejectsInvalidActions() {
        var rooms = new RoomService();
        var host = rooms.create("Ana");
        assertThrows(ResponseStatusException.class, () -> rooms.command("wrong", new RoomService.Command("start", null, 1L)));
        assertThrows(ResponseStatusException.class, () -> rooms.command(host.token(), new RoomService.Command("start", null, null)));
        assertEquals("waitingPlayer", failure(rooms, host.token(), "start", null));
        var guest = rooms.join(host.room().code(), "Beto");
        assertEquals("hostOnly", failure(rooms, guest.token(), "start", null));
        assertEquals("notStarted", failure(rooms, host.token(), "move", 0));
        assertEquals("notStarted", failure(rooms, host.token(), "next", null));
        assertEquals("invalidAction", failure(rooms, host.token(), "unknown", null));
        assertEquals("invalidAction", failure(rooms, host.token(), null, null));
        var started = command(rooms, host.token(), "start", null);
        assertEquals("PLAYING", started.status());
        assertEquals("roundNotFinished", failure(rooms, guest.token(), "next", null));
        assertEquals("alreadyStarted", failure(rooms, host.token(), "start", null));
        assertEquals("notYourTurn", failure(rooms, guest.token(), "move", 0));
        var moved = command(rooms, host.token(), "move", 0);
        assertEquals(started.revision() + 1, moved.revision());
        assertEquals("staleState", assertThrows(ResponseStatusException.class,
                () -> rooms.command(guest.token(), new RoomService.Command("move", 1, started.revision()))).getReason());
        assertEquals(moved, rooms.view(host.token()));
        command(rooms, guest.token(), "move", 3);
        command(rooms, host.token(), "move", 1);
        command(rooms, guest.token(), "move", 4);
        var finished = command(rooms, host.token(), "move", 2);
        assertEquals("FINISHED", finished.status());
        var waiting = command(rooms, guest.token(), "next", null);
        assertEquals("FINISHED", waiting.status());
        assertEquals(java.util.List.of("O"), waiting.game().rematchReady());
        assertEquals(waiting, command(rooms, guest.token(), "next", null));
        assertEquals(waiting, rooms.command(guest.token(), new RoomService.Command("next", null, finished.revision())));
        var next = rooms.command(host.token(), new RoomService.Command("next", null, finished.revision()));
        assertEquals("O", next.game().turn());
        assertEquals(1, next.game().scores().get("X"));
        assertTrue(next.game().rematchReady().isEmpty());
        assertEquals(2, next.game().round());
        assertEquals("staleState", assertThrows(ResponseStatusException.class,
                () -> rooms.command(host.token(), new RoomService.Command("next", null, finished.revision()))).getReason());
    }

    @Test
    void simultaneousRematchConfirmationsStartExactlyOneRound() throws Exception {
        var rooms = new RoomService();
        var host = rooms.create("Ana");
        var guest = rooms.join(host.room().code(), "Beto");
        command(rooms, host.token(), "start", null);
        int[] moves = {0, 3, 1, 4, 2};
        for (int i = 0; i < moves.length; i++)
            command(rooms, i % 2 == 0 ? host.token() : guest.token(), "move", moves[i]);
        var finished = rooms.view(host.token());
        var gate = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                gate.await();
                return rooms.command(host.token(), new RoomService.Command("next", null, finished.revision()));
            });
            var second = executor.submit(() -> {
                gate.await();
                return rooms.command(guest.token(), new RoomService.Command("next", null, finished.revision()));
            });
            gate.countDown();
            first.get(5, TimeUnit.SECONDS);
            second.get(5, TimeUnit.SECONDS);
        }
        var next = rooms.view(host.token());
        assertEquals("PLAYING", next.status());
        assertEquals(2, next.game().round());
        assertEquals(finished.revision() + 2, next.revision());
        assertTrue(next.game().rematchReady().isEmpty());
    }

    @Test
    void duplicateConcurrentMovesAreAppliedOnce() throws Exception {
        var rooms = new RoomService();
        var host = rooms.create("Ana");
        rooms.join(host.room().code(), "Beto");
        var started = command(rooms, host.token(), "start", null);
        var gate = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> move = () -> {
                gate.await();
                try { rooms.command(host.token(), new RoomService.Command("move", 0, started.revision())); return true; }
                catch (ResponseStatusException exception) { assertEquals("staleState", exception.getReason()); return false; }
            };
            var first = executor.submit(move);
            var second = executor.submit(move);
            gate.countDown();
            assertNotEquals(first.get(5, TimeUnit.SECONDS), second.get(5, TimeUnit.SECONDS));
        }
        assertEquals(started.revision() + 1, rooms.view(host.token()).revision());
    }

    private RoomService.View command(RoomService rooms, String token, String type, Integer index) {
        return rooms.command(token, new RoomService.Command(type, index, rooms.view(token).revision()));
    }

    private String failure(RoomService rooms, String token, String type, Integer index) {
        return assertThrows(ResponseStatusException.class, () -> command(rooms, token, type, index)).getReason();
    }
}
