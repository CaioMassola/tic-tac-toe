package com.trio.room;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RoomApiTests {
    @Autowired MockMvc mvc;
    @Autowired RoomService rooms;

    @Test
    void authenticatesChatValidatesMessagesAndKeepsTheSenderAuthoritative() throws Exception {
        var host = rooms.create("Ana");
        mvc.perform(post("/api/rooms/chat").contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":\"one\",\"text\":\"Hi\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/rooms/chat").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"one\",\"text\":\"Hi\"}"))
                .andExpect(status().isConflict());
        rooms.join(host.room().code(), "Beto");
        mvc.perform(post("/api/rooms/chat").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"one\",\"text\":\"Hi\",\"mark\":\"O\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("messages[0].mark").value("X"))
                .andExpect(jsonPath("messages[0].text").value("Hi"))
                .andExpect(jsonPath("messages[0].sentAt").isString());
        mvc.perform(post("/api/rooms/chat").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"two\",\"text\":\" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/rooms/chat").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"typing\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("typing.X").isString());
    }

    @Test
    void createsAndJoinsWithStableErrors() throws Exception {
        mvc.perform(post("/api/rooms").contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"Ana\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("mark").value("X"))
                .andExpect(jsonPath("room.status").value("WAITING")).andExpect(jsonPath("token").isString());
        var host = rooms.create("Host");
        String path = "/api/rooms/" + host.room().code() + "/join";
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"Beto\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("mark").value("O"))
                .andExpect(jsonPath("room.players.length()").value(2))
                .andExpect(jsonPath("room.players[0].token").doesNotExist());
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"Third\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("code").value("roomFull"));
        mvc.perform(post("/api/rooms").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("code").value("invalidName"));
        mvc.perform(post("/api/rooms/AAAAAA/join").contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"Ana\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/rooms").contentType(MediaType.APPLICATION_JSON).content("bad json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void allowsOnlyConfiguredBrowserOrigins() throws Exception {
        mvc.perform(options("/api/rooms").header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        mvc.perform(options("/api/rooms").header("Origin", "https://unknown.example")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authenticatesCommandsAndRejectsMalformedMoves() throws Exception {
        var host = rooms.create("Ana");
        var guest = rooms.join(host.room().code(), "Beto");
        mvc.perform(post("/api/rooms/actions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"start\",\"revision\":2}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/rooms/actions").header("Authorization", "Bearer " + guest.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"start\",\"revision\":2}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/rooms/actions").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"start\",\"revision\":2}"))
                .andExpect(status().isOk()).andExpect(jsonPath("game.turn").value("X"))
                .andExpect(jsonPath("game.board.length()").value(9)).andExpect(jsonPath("revision").value(3));
        mvc.perform(post("/api/rooms/actions").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"move\",\"revision\":3,\"index\":0.5}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/rooms/actions").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"move\",\"revision\":3,\"index\":0}"))
                .andExpect(status().isOk()).andExpect(jsonPath("game.board[0]").value("X"));
        mvc.perform(post("/api/rooms/actions").header("Authorization", "Bearer " + host.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"move\",\"revision\":3,\"index\":1}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("code").value("staleState"));
    }
}
