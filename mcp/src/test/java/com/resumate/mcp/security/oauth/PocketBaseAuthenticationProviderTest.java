package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PocketBaseAuthenticationProviderTest {

    private final PocketBaseClient pocketBaseClient = mock(PocketBaseClient.class);
    private final PocketBaseAuthenticationProvider provider = new PocketBaseAuthenticationProvider(pocketBaseClient);

    @Test
    void authenticate_returnsPrincipalWithPocketBaseUserId() {
        when(pocketBaseClient.authenticateUser("user@example.com", "secret-password"))
                .thenReturn(Optional.of(new PocketBaseClient.UserRecord(
                        "pb-user-id",
                        "Alex",
                        "Morgan",
                        null,
                        null,
                        null,
                        "user@example.com",
                        null
                )));

        var authentication = provider.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
                "user@example.com",
                "secret-password"
        ));

        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getCredentials()).isNull();
        assertThat(authentication.getPrincipal()).isEqualTo(new PocketBaseOAuthPrincipal(
                "pb-user-id",
                "user@example.com",
                "Alex Morgan"
        ));
        assertThat(authentication.getName()).isEqualTo("pb-user-id");
    }

    @Test
    void authenticate_usesGenericFailureForUnknownUserAndWrongPassword() {
        when(pocketBaseClient.authenticateUser("user@example.com", "wrong-password"))
                .thenReturn(Optional.empty());
        when(pocketBaseClient.authenticateUser("unknown@example.com", "wrong-password"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> provider.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
                "user@example.com",
                "wrong-password"
        )))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);

        assertThatThrownBy(() -> provider.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
                "unknown@example.com",
                "wrong-password"
        )))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);
    }

    @Test
    void supportsUsernamePasswordAuthentication() {
        assertThat(provider.supports(UsernamePasswordAuthenticationToken.class)).isTrue();
    }
}
