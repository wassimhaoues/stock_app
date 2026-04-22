package com.wassim.stock.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockpro.auth.cookie")
public record AuthCookieProperties(
        String name,
        String path,
        String sameSite,
        boolean secure
) {
    public AuthCookieProperties {
        if (name == null || name.isBlank()) {
            name = "STOCKPRO_AUTH";
        }
        if (path == null || path.isBlank()) {
            path = "/api";
        }
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Lax";
        }
    }
}
