package com.trio.room;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Mutated only while the RoomService lock is held. */
final class GameSession {
    record Round(int round, String winner) {}
    record View(List<String> board, String turn, String winner, List<Integer> line,
                int round, Map<String, Integer> scores, List<Round> history) {}
    private static final int[][] LINES = {
        {0,1,2}, {3,4,5}, {6,7,8}, {0,3,6}, {1,4,7}, {2,5,8}, {0,4,8}, {2,4,6}
    };
    private final String[] board = new String[9];
    private final Map<String, Integer> scores = new HashMap<>(Map.of("X", 0, "O", 0, "draw", 0));
    private final List<Round> history = new ArrayList<>();
    private String starter = "X", turn = "X", winner;
    private List<Integer> line = List.of();
    private int round = 1;

    void move(String mark, Integer index) {
        if (winner != null) throw conflict("roundFinished");
        if (!turn.equals(mark)) throw conflict("notYourTurn");
        if (index == null || index < 0 || index > 8) throw conflict("invalidMove");
        if (board[index] != null) throw conflict("occupiedCell");
        board[index] = mark;
        for (int[] candidate : LINES) {
            if (mark.equals(board[candidate[0]]) && mark.equals(board[candidate[1]]) && mark.equals(board[candidate[2]])) {
                winner = mark;
                line = List.of(candidate[0], candidate[1], candidate[2]);
                break;
            }
        }
        if (winner == null && Arrays.stream(board).allMatch(Objects::nonNull)) winner = "draw";
        if (winner != null) {
            scores.compute(winner, (key, value) -> value + 1);
            history.addFirst(new Round(round, winner));
            if (history.size() > 5) history.removeLast();
        } else turn = mark.equals("X") ? "O" : "X";
    }

    void next() {
        if (winner == null) throw conflict("roundNotFinished");
        Arrays.fill(board, null);
        starter = starter.equals("X") ? "O" : "X";
        turn = starter;
        winner = null;
        line = List.of();
        round++;
    }

    View view() {
        return new View(Collections.unmodifiableList(new ArrayList<>(Arrays.asList(board))), turn,
                winner, line, round, Map.copyOf(scores), List.copyOf(history));
    }

    private ResponseStatusException conflict(String code) {
        return new ResponseStatusException(HttpStatus.CONFLICT, code);
    }
}
