package com.trio.room;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.config.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.*;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
@EnableWebSocketMessageBroker
public class ConnectionConfig implements WebSocketMessageBrokerConfigurer {
    private final RoomService rooms;
    private final String[] origins;

    public ConnectionConfig(RoomService rooms,
            @Value("${trio.allowed-origins}") String[] origins) {
        this.rooms = rooms;
        this.origins = origins;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**").allowedOrigins(origins).allowedMethods("POST");
            }
        };
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(origins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue").setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(heartbeatScheduler());
        registry.setApplicationDestinationPrefixes("/app");
        registry.setPreservePublishOrder(true);
    }

    @Bean
    public ThreadPoolTaskScheduler heartbeatScheduler() {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setThreadNamePrefix("room-heartbeat-");
        return scheduler;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Preserve subscribe/snapshot ordering without swallowing interceptor errors.
        registration.taskExecutor().corePoolSize(1).maxPoolSize(1);
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var headers = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (headers == null) throw new IllegalArgumentException("Missing STOMP headers");
                if (headers.getCommand() == StompCommand.CONNECT) {
                    String token = headers.getFirstNativeHeader("token");
                    rooms.view(token);
                    headers.setUser(() -> token);
                }
                if (headers.getCommand() == StompCommand.SUBSCRIBE || headers.getCommand() == StompCommand.SEND) {
                    if (headers.getUser() == null) throw new IllegalArgumentException("Unauthorized");
                    rooms.view(headers.getUser().getName());
                    String allowed = headers.getCommand() == StompCommand.SUBSCRIBE ? "/user/queue/room" : "/app/room";
                    if (!allowed.equals(headers.getDestination())) throw new IllegalArgumentException("Forbidden destination");
                }
                return message;
            }
        });
    }
}
