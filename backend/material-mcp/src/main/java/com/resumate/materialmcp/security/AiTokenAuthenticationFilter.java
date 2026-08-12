package com.resumate.materialmcp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authentication filter for Material MCP.
 * Handles API_KEY header and Bearer token authentication.
 */
public class AiTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "API_KEY";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final AiTokenAuthenticationService authenticationService;

    public AiTokenAuthenticationFilter(AiTokenAuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.equals("/mcp") || path.startsWith("/mcp/")
                || path.equals("/api/materials") || path.startsWith("/api/materials/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String apiKey = request.getHeader(API_KEY_HEADER);
        if (apiKey != null) {
            authenticateApiKey(apiKey, request, response, filterChain);
            return;
        }

        String bearerToken = bearerToken(request);
        if (bearerToken != null) {
            authenticateBearerToken(bearerToken, request, response, filterChain);
            return;
        }

        unauthorizedWithDiscovery(response);
    }

    private void authenticateApiKey(
            String apiKey,
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws IOException, ServletException {
        if (apiKey.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing API key.");
            return;
        }

        try {
            AiTokenPrincipal principal = authenticationService.authenticate(apiKey.trim());
            setAiTokenAuthentication(principal);
            filterChain.doFilter(request, response);
        } catch (IllegalArgumentException ex) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, ex.getMessage());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void authenticateBearerToken(
            String bearerToken,
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws IOException, ServletException {
        if (bearerToken.startsWith("resm_")) {
            authenticateApiKeyFromBearer(bearerToken, request, response, filterChain);
            return;
        }

        // TODO: Implement OAuth token validation
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token.");
    }

    private void authenticateApiKeyFromBearer(
            String bearerToken,
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws IOException, ServletException {
        try {
            AiTokenPrincipal principal = authenticationService.authenticate(bearerToken.trim());
            setAiTokenAuthentication(principal);
            filterChain.doFilter(request, response);
        } catch (IllegalArgumentException ex) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, ex.getMessage());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void setAiTokenAuthentication(AiTokenPrincipal principal) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                null
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String bearerToken(HttpServletRequest request) {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        return !token.isEmpty() ? token : null;
    }

    private void unauthorizedWithDiscovery(HttpServletResponse response) throws IOException {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing authentication.");
    }
}
