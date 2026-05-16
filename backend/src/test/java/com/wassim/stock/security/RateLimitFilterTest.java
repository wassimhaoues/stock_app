package com.wassim.stock.security;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    @Test
    void loginAllowsFiveRequestsAndRejectsSixthFromSameIp() throws ServletException, IOException {
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        RateLimitFilter filter = new RateLimitFilter(meterRegistry);

        for (int attempt = 0; attempt < 5; attempt++) {
            MockHttpServletResponse response = perform(filter, "POST", "/api/auth/login", "10.21.0.1");
            assertThat(response.getStatus()).isNotEqualTo(429);
            assertThat(response.getHeader("X-RateLimit-Remaining"))
                    .isEqualTo(Long.toString(4 - attempt));
        }

        MockHttpServletResponse rejectedResponse = perform(filter, "POST", "/api/auth/login", "10.21.0.1");

        assertThat(rejectedResponse.getStatus()).isEqualTo(429);
        assertThat(rejectedResponse.getHeader("X-RateLimit-Remaining")).isEqualTo("0");
        assertThat(rejectedResponse.getContentAsString())
                .contains("\"status\":429")
                .contains("Trop de requêtes");
        assertThat(
                meterRegistry.counter(
                        "stockpro.rate.limit.rejections",
                        "endpoint", "/api/auth/login",
                        "ip_hash", Integer.toHexString("10.21.0.1".hashCode())
                ).count()
        ).isEqualTo(1.0d);
    }

    @Test
    void loginUsesForwardedClientIpWhenPresent() throws ServletException, IOException {
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        RateLimitFilter filter = new RateLimitFilter(meterRegistry);

        for (int attempt = 0; attempt < 5; attempt++) {
            MockHttpServletResponse response = performWithForwardedIp(
                    filter,
                    "POST",
                    "/api/auth/login",
                    "35.191.0.10",
                    "198.51.100.24, 35.191.0.10"
            );
            assertThat(response.getStatus()).isNotEqualTo(429);
        }

        MockHttpServletResponse rejectedResponse = performWithForwardedIp(
                filter,
                "POST",
                "/api/auth/login",
                "35.191.0.11",
                "198.51.100.24, 35.191.0.11"
        );

        assertThat(rejectedResponse.getStatus()).isEqualTo(429);
        assertThat(
                meterRegistry.counter(
                        "stockpro.rate.limit.rejections",
                        "endpoint", "/api/auth/login",
                        "ip_hash", Integer.toHexString("198.51.100.24".hashCode())
                ).count()
        ).isEqualTo(1.0d);
    }

    private MockHttpServletResponse perform(RateLimitFilter filter, String method, String uri, String ip)
            throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    private MockHttpServletResponse performWithForwardedIp(
            RateLimitFilter filter,
            String method,
            String uri,
            String remoteAddr,
            String forwardedFor
    ) throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(remoteAddr);
        request.addHeader("X-Forwarded-For", forwardedFor);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
