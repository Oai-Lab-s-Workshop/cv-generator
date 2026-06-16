package com.resumate.mcp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.resumate.mcp.config.OAuthProperties;
import com.resumate.mcp.security.oauth.OAuthEndpointUrls;
import com.resumate.mcp.security.oauth.OAuthPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AiTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "API_KEY";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final AiTokenAuthenticationService authenticationService;
    private final JwtDecoder jwtDecoder;
    private final OAuthProperties oauthProperties;

    public AiTokenAuthenticationFilter(
            AiTokenAuthenticationService authenticationService,
            JwtDecoder jwtDecoder,
            OAuthProperties oauthProperties
    ) {
        this.authenticationService = authenticationService;
        this.jwtDecoder = jwtDecoder;
        this.oauthProperties = oauthProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.equals("/mcp") && !path.startsWith("/mcp/");
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
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    AuthorityUtils.NO_AUTHORITIES
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
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
        try {
            Jwt jwt = jwtDecoder.decode(bearerToken);
            String audience = OAuthEndpointUrls.mcpAudience(oauthProperties.publicBaseUrl());
            if (!jwt.getAudience().contains(audience)) {
                throw new JwtException("OAuth access token audience is not valid for MCP.");
            }

            OAuthPrincipal principal = new OAuthPrincipal(
                    jwt.getSubject(),
                    clientLabel(jwt),
                    jwt.getClaimAsString("client_id")
            );
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    AuthorityUtils.NO_AUTHORITIES
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (JwtException ex) {
            response.setHeader("WWW-Authenticate", "Bearer error=\"invalid_token\", resource_metadata=\"" + protectedResourceMetadataUrl() + "\"");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid bearer token.");
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private String bearerToken(HttpServletRequest request) {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (!StringUtils.hasText(authorization) || !authorization.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        return StringUtils.hasText(token) ? token : null;
    }

    private void unauthorizedWithDiscovery(HttpServletResponse response) throws IOException {
        response.setHeader("WWW-Authenticate", "Bearer resource_metadata=\"" + protectedResourceMetadataUrl() + "\"");
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing authentication.");
    }

    private String protectedResourceMetadataUrl() {
        return OAuthEndpointUrls.protectedResourceMetadataUrl(oauthProperties.publicBaseUrl());
    }

    private static String clientLabel(Jwt jwt) {
        String clientName = jwt.getClaimAsString("client_name");
        if (StringUtils.hasText(clientName)) {
            return clientName;
        }
        String clientId = jwt.getClaimAsString("client_id");
        return StringUtils.hasText(clientId) ? clientId : "OAuth";
    }
}
