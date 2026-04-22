package com.wassim.stock.config;

import com.wassim.stock.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.function.Supplier;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_GESTIONNAIRE = "GESTIONNAIRE";
    private static final String ROLE_OBSERVATEUR = "OBSERVATEUR";
    private static final String API_ENTREPOTS = "/api/entrepots";
    private static final String API_PRODUITS = "/api/produits";
    private static final String API_STOCKS = "/api/stocks";
    private static final String API_MOUVEMENTS_STOCK = "/api/mouvements-stock";
    private static final String[] ENTREPOT_ENDPOINTS = resourceEndpoints(API_ENTREPOTS);
    private static final String[] PRODUIT_ENDPOINTS = resourceEndpoints(API_PRODUITS);
    private static final String[] STOCK_ENDPOINTS = resourceEndpoints(API_STOCKS);
    private static final String[] MOUVEMENT_STOCK_ENDPOINTS = resourceEndpoints(API_MOUVEMENTS_STOCK);
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/health",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            .cors(cors -> cors.configure(http))
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository())
                .csrfTokenRequestHandler(spaCsrfTokenRequestHandler())
            )
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint())
                .accessDeniedHandler(accessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers("/api/auth/**").authenticated()
                .requestMatchers("/api/utilisateurs/**").hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.POST, ENTREPOT_ENDPOINTS).hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.PUT, ENTREPOT_ENDPOINTS).hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.DELETE, ENTREPOT_ENDPOINTS).hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.POST, PRODUIT_ENDPOINTS).hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.PUT, PRODUIT_ENDPOINTS).hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.DELETE, PRODUIT_ENDPOINTS).hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.POST, STOCK_ENDPOINTS).hasAnyRole(ROLE_ADMIN, ROLE_GESTIONNAIRE)
                .requestMatchers(HttpMethod.PUT, STOCK_ENDPOINTS).hasAnyRole(ROLE_ADMIN, ROLE_GESTIONNAIRE)
                .requestMatchers(HttpMethod.DELETE, STOCK_ENDPOINTS).hasAnyRole(ROLE_ADMIN, ROLE_GESTIONNAIRE)
                .requestMatchers(HttpMethod.POST, MOUVEMENT_STOCK_ENDPOINTS).hasAnyRole(ROLE_ADMIN, ROLE_GESTIONNAIRE)
                .requestMatchers(HttpMethod.GET, "/api/dashboard/admin/**").hasRole(ROLE_ADMIN)
                .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole(ROLE_ADMIN, ROLE_GESTIONNAIRE, ROLE_OBSERVATEUR)
                .anyRequest().hasAnyRole(ROLE_ADMIN, ROLE_GESTIONNAIRE)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return configureSecurity(http::build, "Unable to build Spring Security filter chain");
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) {
        return configureSecurity(config::getAuthenticationManager, "Unable to create authentication manager");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieName("XSRF-TOKEN");
        repository.setHeaderName("X-XSRF-TOKEN");
        repository.setCookiePath("/");
        return repository;
    }

    @Bean
    public CsrfTokenRequestHandler spaCsrfTokenRequestHandler() {
        return new SpaCsrfTokenRequestHandler();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(401);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType("application/json");
            response.getWriter().write("""
                    {"status":401,"message":"Authentification requise"}
                    """);
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(403);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType("application/json");
            response.getWriter().write("""
                    {"status":403,"message":"Acces refuse"}
                    """);
        };
    }

    private static final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

        private final CsrfTokenRequestAttributeHandler plain = new CsrfTokenRequestAttributeHandler();
        private final XorCsrfTokenRequestAttributeHandler xor = new XorCsrfTokenRequestAttributeHandler();

        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
            xor.handle(request, response, csrfToken);
            csrfToken.get();
        }

        @Override
        public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
            String headerValue = request.getHeader(csrfToken.getHeaderName());
            return StringUtils.hasText(headerValue)
                    ? plain.resolveCsrfTokenValue(request, csrfToken)
                    : xor.resolveCsrfTokenValue(request, csrfToken);
        }
    }

    private static String[] resourceEndpoints(String basePath) {
        return new String[] { basePath, basePath + "/**" };
    }

    @SuppressWarnings({"java:S112", "java:S2221"})
    private static <T> T configureSecurity(SecurityOperation<T> operation, String failureMessage) {
        try {
            return operation.execute();
        } catch (Exception exception) {
            throw new SecurityConfigurationException(failureMessage, exception);
        }
    }

    @FunctionalInterface
    @SuppressWarnings("java:S112")
    private interface SecurityOperation<T> {

        T execute() throws Exception;
    }

    private static final class SecurityConfigurationException extends IllegalStateException {

        private SecurityConfigurationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
