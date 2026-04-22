package com.wassim.stock.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockpro")
public record StockProProperties(boolean demoData, Seed seed) {

    public record Seed(User admin, User gestionnaire, User observateur) {
    }

    public record User(String nom, String email, String password) {
    }
}
