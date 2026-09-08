package com.trio.room;

import java.util.*;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class GameSessionTests {
    @Test
    void recognizesEveryWinningLineAndKeepsSnapshotsImmutable() {
        int[][] lines = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};
        for (int[] line : lines) {
            var game = new GameSession();
            var before = game.view();
            var other = IntStream.range(0,9).filter(i -> Arrays.stream(line).noneMatch(cell -> cell == i)).toArray();
            game.move("X", line[0]); game.move("O", other[0]);
            game.move("X", line[1]); game.move("O", other[1]); game.move("X", line[2]);
            assertEquals("X", game.view().winner());
            assertEquals(Arrays.stream(line).boxed().toList(), game.view().line());
            assertEquals(1, game.view().scores().get("X"));
            assertTrue(before.board().stream().allMatch(Objects::isNull));
            assertThrows(UnsupportedOperationException.class, () -> game.view().board().set(0, "O"));
            assertThrows(ResponseStatusException.class, () -> game.move("O", other[2]));
            assertEquals(1, game.view().scores().get("X"));
        }
    }

    @Test
    void rejectsIllegalMovesAndEarlyRematches() {
        var game = new GameSession();
        assertThrows(ResponseStatusException.class, game::next);
        assertThrows(ResponseStatusException.class, () -> game.move("O", 0));
        for (Integer index : new Integer[]{null, -1, 9})
            assertThrows(ResponseStatusException.class, () -> game.move("X", index));
        game.move("X", 0);
        assertThrows(ResponseStatusException.class, () -> game.move("O", 0));
        assertEquals("O", game.view().turn());
        assertEquals(1, game.view().board().stream().filter(Objects::nonNull).count());
    }

    @Test
    void drawsAndAlternatesStartersWithoutResettingScores() {
        var game = new GameSession();
        for (int index : new int[]{0,1,2,4,3,5,7,6,8}) game.move(game.view().turn(), index);
        assertEquals("draw", game.view().winner());
        assertTrue(game.view().line().isEmpty());
        assertEquals(1, game.view().scores().get("draw"));
        game.next();
        assertEquals("O", game.view().turn());
        assertEquals(2, game.view().round());
        assertNull(game.view().winner());
        assertTrue(game.view().board().stream().allMatch(Objects::isNull));
        for (int index : new int[]{0,3,1,4,2}) game.move(game.view().turn(), index);
        assertEquals("O", game.view().winner());
        assertEquals(1, game.view().scores().get("O"));
        assertEquals(1, game.view().scores().get("draw"));
        game.next();
        assertEquals("X", game.view().turn());
    }

    @Test
    void retainsOnlyFiveRecentRounds() {
        var game = new GameSession();
        for (int round = 1; round <= 6; round++) {
            for (int index : new int[]{0,3,1,4,2}) game.move(game.view().turn(), index);
            if (round < 6) game.next();
        }
        assertEquals(List.of(6,5,4,3,2), game.view().history().stream().map(GameSession.Round::round).toList());
        assertEquals(Map.of("X",3,"O",3,"draw",0), game.view().scores());
    }
}
