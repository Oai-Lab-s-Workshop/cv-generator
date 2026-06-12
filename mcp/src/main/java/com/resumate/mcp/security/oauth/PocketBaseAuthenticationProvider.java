package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
public class PocketBaseAuthenticationProvider implements AuthenticationProvider {

    static final String GENERIC_LOGIN_FAILURE = "Invalid email or password.";

    private final PocketBaseClient pocketBaseClient;

    public PocketBaseAuthenticationProvider(PocketBaseClient pocketBaseClient) {
        this.pocketBaseClient = pocketBaseClient;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String identity = authentication.getName();
        String password = authentication.getCredentials() == null ? null : authentication.getCredentials().toString();
        if (!StringUtils.hasText(identity) || !StringUtils.hasText(password)) {
            throw genericFailure();
        }

        return pocketBaseClient.authenticateUser(identity, password)
                .map((user) -> {
                    PocketBaseOAuthPrincipal principal = new PocketBaseOAuthPrincipal(
                            user.id(),
                            user.email(),
                            displayName(user)
                    );
                    return new UsernamePasswordAuthenticationToken(principal, null, List.of());
                })
                .orElseThrow(PocketBaseAuthenticationProvider::genericFailure);
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    private static BadCredentialsException genericFailure() {
        return new BadCredentialsException(GENERIC_LOGIN_FAILURE);
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
