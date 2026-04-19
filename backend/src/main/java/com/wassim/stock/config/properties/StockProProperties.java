package com.wassim.stock.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "stockpro")
public record StockProProperties(
        Cors cors,
        Jwt jwt,
        Auth auth,
        Seed seed
) {
    public record Cors(List<String> allowedOrigins) {
    }

    public record Jwt(String secret, long expirationMs) {
    }

    public record Auth(Cookie cookie) {
    }

    public record Cookie(
            String name,
            String path,
            String sameSite,
            boolean secure,
            int maxAgeSeconds
    ) {
    }

    public record Seed(
            SeedUser admin,
            SeedUser gestionnaire,
            SeedUser observateur
    ) {
    }

    public record SeedUser(String nom, String email, String password) {
    }
}
