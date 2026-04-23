package com.wassim.stock.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final String CORRELATION_ID_KEY = "correlationId";
    private static final String USER_EMAIL_KEY = "userEmail";
    private static final String CORRELATION_HEADER = "X-Correlation-Id";
    private static final String ANONYMOUS_USER = "anonymous";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = UUID.randomUUID().toString().substring(0, 8);

        try {
            MDC.put(CORRELATION_ID_KEY, correlationId);
            MDC.put(USER_EMAIL_KEY, resolveUserEmail());
            response.setHeader(CORRELATION_HEADER, correlationId);
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }

    private String resolveUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ANONYMOUS_USER;
        }

        String name = authentication.getName();
        return StringUtils.hasText(name) && !"anonymousUser".equalsIgnoreCase(name)
                ? name
                : ANONYMOUS_USER;
    }
}
