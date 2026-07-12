package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
public class PocketBaseAuthenticationProvider implements AuthenticationProvider {

    static final String GENERIC_LOGIN_FAILURE = "Invalid email or password.";

    private final PocketBaseClient pocketBaseClient;
    private final OAuthLoginAbuseProtectionService abuseProtection;

    public PocketBaseAuthenticationProvider(PocketBaseClient pocketBaseClient, OAuthLoginAbuseProtectionService abuseProtection) {
        this.pocketBaseClient = pocketBaseClient;
        this.abuseProtection = abuseProtection;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String identity = authentication.getName();
        String password = authentication.getCredentials() == null ? null : authentication.getCredentials().toString();
        String remoteAddress = remoteAddress(authentication);
        if (!StringUtils.hasText(identity) || !StringUtils.hasText(password)) {
            abuseProtection.recordLoginFailure(remoteAddress, identity, "missing_credentials");
            throw genericFailure();
        }
        String loginIdentity = identity.trim();
        if (!abuseProtection.isLoginAllowed(remoteAddress, loginIdentity)) {
            abuseProtection.recordLoginThrottled(remoteAddress, loginIdentity);
            throw genericFailure();
        }

        return pocketBaseClient.authenticateUser(loginIdentity, password)
                .map((user) -> {
                    abuseProtection.recordLoginSuccess(remoteAddress, loginIdentity, user.id());
                    PocketBaseOAuthPrincipal principal = new PocketBaseOAuthPrincipal(
                            user.id(),
                            user.email(),
                            displayName(user)
                    );
                    return new UsernamePasswordAuthenticationToken(principal, null, List.of());
                })
                .orElseThrow(() -> {
                    abuseProtection.recordLoginFailure(remoteAddress, loginIdentity, "invalid_credentials");
                    return genericFailure();
                });
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    private static BadCredentialsException genericFailure() {
        return new BadCredentialsException(GENERIC_LOGIN_FAILURE);
    }

    private static String remoteAddress(Authentication authentication) {
        if (authentication.getDetails() instanceof WebAuthenticationDetails details) {
            return details.getRemoteAddress();
        }
        return "unknown";
    }

    private static String displayName(PocketBaseClient.UserRecord user) {
        String name = String.join(" ", nonNull(user.firstName()), nonNull(user.lastName())).trim();
        if (StringUtils.hasText(name)) {
            return name;
        }
        return StringUtils.hasText(user.email()) ? user.email() : user.id();
    }

    private static String nonNull(String value) {
        return value == null ? "" : value;
    }
}
