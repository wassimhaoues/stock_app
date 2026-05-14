package com.wassim.stock.logging;

import org.springframework.util.StringUtils;

public final class LogSanitizer {

    private LogSanitizer() {
    }

    public static String sanitize(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value
                .replace('\r', '_')
                .replace('\n', '_');
    }

    public static String maskedHash(String value) {
        return Integer.toHexString(sanitize(value).hashCode());
    }
}
