package com.resumate.mcp.security;

import com.resumate.mcp.config.CorsProperties;
import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.config.OAuthProperties;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AiTokenAuthenticationFilter aiTokenAuthenticationFilter,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement((sessions) -> sessions.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests((requests) -> requests.anyRequest().authenticated())
                .addFilterBefore(aiTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .securityMatcher("/mcp", "/mcp/**")
                .build();
    }

    @Bean
    @Order(4)
    SecurityFilterChain localEndpointsSecurityFilterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests((requests) -> requests.anyRequest().permitAll())
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            FrontendProperties frontendProperties,
            OAuthProperties oAuthProperties,
            CorsProperties corsProperties) {
        var configuration = new CorsConfiguration();
        var origins = new ArrayList<String>();

        // Frontend base URL normalized to origin
        addOriginIfPresent(origins, frontendProperties.baseUrl());
        // MCP public base URL normalized to origin
        addOriginIfPresent(origins, oAuthProperties.publicBaseUrl());
        // Extra origins from AUTHORIZED_URL
        if (corsProperties.allowedOrigins() != null) {
            for (String extra : corsProperties.allowedOrigins()) {
                addOriginIfPresent(origins, extra.trim());
            }
        }

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static void addOriginIfPresent(List<String> origins, String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        try {
            var uri = URI.create(url);
            var origin = uri.getScheme() + "://" + uri.getHost();
            if (uri.getPort() > -1) {
                origin += ":" + uri.getPort();
            }
            if (!origins.contains(origin)) {
                origins.add(origin);
            }
        } catch (Exception e) {
            // Skip malformed URLs; log if needed
        }
    }
}
