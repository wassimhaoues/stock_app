package com.wassim.stock.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String API_PREFIX = "/api/";
    private static final String LOGIN_ENDPOINT = "/api/auth/login";
    private static final String GENERAL_ENDPOINT = "/api/**";
    private static final String RATE_LIMIT_HEADER = "X-RateLimit-Remaining";
    private static final String RATE_LIMIT_MESSAGE = """
            {"status":429,"message":"Trop de requêtes. Réessayez dans quelques secondes."}
            """;

    private static final long LOGIN_REQUESTS_PER_MINUTE = 5L;
    private static final long API_REQUESTS_PER_MINUTE = 120L;

    private final MeterRegistry meterRegistry;
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(API_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        String uri = request.getRequestURI();
        RateLimitRule rule = resolveRule(request);
        Bucket bucket = resolveBucket(rule, ip);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        response.setHeader(RATE_LIMIT_HEADER, Long.toString(probe.getRemainingTokens()));

        if (!probe.isConsumed()) {
            log.warn("Rate limit atteint : ip={}, uri={}", ip, uri);
            meterRegistry.counter(
                    "stockpro.rate.limit.rejections",
                    "endpoint", rule.metricEndpoint(),
                    "ip_hash", Integer.toHexString(ip.hashCode())
            ).increment();
            response.setStatus(429);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(RATE_LIMIT_MESSAGE);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private RateLimitRule resolveRule(HttpServletRequest request) {
        if ("POST".equalsIgnoreCase(request.getMethod()) && LOGIN_ENDPOINT.equals(request.getRequestURI())) {
            return new RateLimitRule(LOGIN_ENDPOINT, LOGIN_REQUESTS_PER_MINUTE, loginBuckets);
        }

        return new RateLimitRule(GENERAL_ENDPOINT, API_REQUESTS_PER_MINUTE, apiBuckets);
    }

    private Bucket resolveBucket(RateLimitRule rule, String ip) {
        return rule.buckets().computeIfAbsent(ip, key -> buildBucket(rule.capacity()));
    }

    private Bucket buildBucket(long capacity) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofMinutes(1))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private record RateLimitRule(String metricEndpoint, long capacity, Map<String, Bucket> buckets) {
    }
}
