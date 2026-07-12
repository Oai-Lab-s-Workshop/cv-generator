package com.resumate.mcp.security.oauth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ClientRegistrationRateLimitFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(ClientRegistrationRateLimitFilter.class);

    private final ClientRegistrationRateLimiter rateLimiter;

    public ClientRegistrationRateLimitFilter(ClientRegistrationRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"/oauth/register".equals(request.getRequestURI()) || !"POST".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String remoteAddress = request.getRemoteAddr();

        if (!rateLimiter.tryRecordRegistration(remoteAddress)) {
            LOGGER.warn("OAuth client registration rate limit exceeded for IP {}", remoteAddress);
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"too_many_requests\",\"error_description\":\"Client registration rate limit exceeded. Try again later.\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}
