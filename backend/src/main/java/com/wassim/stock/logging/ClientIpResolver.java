package com.wassim.stock.logging;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

public final class ClientIpResolver {

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String X_REAL_IP = "X-Real-IP";
    private static final String FORWARDED = "Forwarded";
    private static final String UNKNOWN = "unknown";

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String forwardedFor = firstForwardedFor(request.getHeader(X_FORWARDED_FOR));
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor;
        }

        String realIp = sanitizeIp(request.getHeader(X_REAL_IP));
        if (StringUtils.hasText(realIp)) {
            return realIp;
        }

        String forwarded = parseForwardedHeader(request.getHeader(FORWARDED));
        if (StringUtils.hasText(forwarded)) {
            return forwarded;
        }

        String remoteAddr = sanitizeIp(request.getRemoteAddr());
        return StringUtils.hasText(remoteAddr) ? remoteAddr : UNKNOWN;
    }

    private static String firstForwardedFor(String headerValue) {
        if (!StringUtils.hasText(headerValue)) {
            return null;
        }

        String[] candidates = headerValue.split(",");
        for (String candidate : candidates) {
            String sanitized = sanitizeIp(candidate);
            if (StringUtils.hasText(sanitized)) {
                return sanitized;
            }
        }

        return null;
    }

    private static String parseForwardedHeader(String headerValue) {
        if (!StringUtils.hasText(headerValue)) {
            return null;
        }

        String[] directives = headerValue.split(";");
        for (String directive : directives) {
            String trimmedDirective = directive.trim();
            if (!trimmedDirective.regionMatches(true, 0, "for=", 0, 4)) {
                continue;
            }

            String candidate = trimmedDirective.substring(4).trim();
            if (candidate.startsWith("\"") && candidate.endsWith("\"") && candidate.length() > 1) {
                candidate = candidate.substring(1, candidate.length() - 1);
            }

            if (candidate.startsWith("[")) {
                int bracketEnd = candidate.indexOf(']');
                if (bracketEnd > 0) {
                    return sanitizeIp(candidate.substring(1, bracketEnd));
                }
            }

            int portSeparator = candidate.indexOf(':');
            if (portSeparator > 0 && candidate.indexOf('.') >= 0) {
                candidate = candidate.substring(0, portSeparator);
            }

            String sanitized = sanitizeIp(candidate);
            if (StringUtils.hasText(sanitized)) {
                return sanitized;
            }
        }

        return null;
    }

    private static String sanitizeIp(String value) {
        String sanitized = LogSanitizer.sanitize(value).trim();
        return StringUtils.hasText(sanitized) ? sanitized : null;
    }
}
