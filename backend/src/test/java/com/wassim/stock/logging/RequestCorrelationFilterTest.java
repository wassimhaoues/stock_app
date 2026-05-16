package com.wassim.stock.logging;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class RequestCorrelationFilterTest {

    @Test
    void filterAddsResolvedClientIpToMdc() throws ServletException, IOException {
        RequestCorrelationFilter filter = new RequestCorrelationFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        request.setRemoteAddr("35.191.0.10");
        request.addHeader("X-Forwarded-For", "198.51.100.24, 35.191.0.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> {
            assertThat(MDC.get("clientIp")).isEqualTo("198.51.100.24");
            assertThat(MDC.get("clientIpHash")).isEqualTo(Integer.toHexString("198.51.100.24".hashCode()));
            assertThat(MDC.get("correlationId")).isNotBlank();
        });

        assertThat(MDC.get("clientIp")).isNull();
    }
}
