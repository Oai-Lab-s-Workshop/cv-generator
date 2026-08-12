package com.resumate.materialmcp.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for the Material MCP server.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AiTokenAuthenticationFilter aiTokenAuthenticationFilter;

    public SecurityConfig(AiTokenAuthenticationFilter aiTokenAuthenticationFilter) {
        this.aiTokenAuthenticationFilter = aiTokenAuthenticationFilter;
    }

    /**
     * Configures stateless security for MCP and material REST endpoints.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/mcp", "/mcp/**", "/api/materials", "/api/materials/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().authenticated()
                )
                .addFilterBefore(aiTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
