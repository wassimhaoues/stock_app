package com.wassim.stock.security;

import com.wassim.stock.config.properties.StockProProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtCookieService {

    private final StockProProperties properties;

    public String cookieName() {
        return properties.auth().cookie().name();
    }

    public String createCookieHeader(String token) {
        StockProProperties.Cookie cookie = properties.auth().cookie();

        return ResponseCookie.from(cookie.name(), token)
                .httpOnly(true)
                .secure(cookie.secure())
                .sameSite(cookie.sameSite())
                .path(cookie.path())
                .maxAge(cookie.maxAgeSeconds())
                .build()
                .toString();
    }

    public String clearCookieHeader() {
        StockProProperties.Cookie cookie = properties.auth().cookie();

        return ResponseCookie.from(cookie.name(), "")
                .httpOnly(true)
                .secure(cookie.secure())
                .sameSite(cookie.sameSite())
                .path(cookie.path())
                .maxAge(0)
                .build()
                .toString();
    }

    public HttpHeaders headersWithAuthCookie(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, createCookieHeader(token));
        return headers;
    }

    public HttpHeaders headersWithClearedAuthCookie() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, clearCookieHeader());
        return headers;
    }
}
