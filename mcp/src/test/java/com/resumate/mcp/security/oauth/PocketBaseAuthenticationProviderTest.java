package com.resumate.mcp.security.oauth;

import com.resumate.mcp.service.PocketBaseClient;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.authentication.WebAuthenticationDetails;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class PocketBaseAuthenticationProviderTest {

    private final PocketBaseClient pocketBaseClient = mock(PocketBaseClient.class);
    private final OAuthLoginAbuseProtection abuseProtection = new OAuthLoginAbuseProtection(Clock.fixed(
            Instant.parse("2026-06-12T18:00:00Z"),
            ZoneOffset.UTC
    ));
    private final PocketBaseAuthenticationProvider provider = new PocketBaseAuthenticationProvider(pocketBaseClient, abuseProtection);

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

        var authentication = provider.authenticate(authentication(
                "user@example.com",
                "secret-password",
                "203.0.113.10"
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

        BadCredentialsException wrongPassword = (BadCredentialsException) catchThrowableOfType(
                () -> provider.authenticate(authentication(
                "user@example.com",
                "wrong-password",
                "203.0.113.10"
        )), BadCredentialsException.class);

        BadCredentialsException unknownUser = (BadCredentialsException) catchThrowableOfType(
                () -> provider.authenticate(authentication(
                "unknown@example.com",
                "wrong-password",
                "203.0.113.11"
        )), BadCredentialsException.class);

        assertThat(wrongPassword).hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);
        assertThat(unknownUser).hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);
        assertThat(wrongPassword.getClass()).isEqualTo(unknownUser.getClass());
    }

    @Test
    void authenticate_throttlesAfterRepeatedFailuresForIdentity() {
        when(pocketBaseClient.authenticateUser("USER@example.com", "wrong-password"))
                .thenReturn(Optional.empty());

        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            assertThatThrownBy(() -> provider.authenticate(authentication(
                    "USER@example.com ",
                    "wrong-password",
                    "203.0.113.10"
            )))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);
        }

        assertThatThrownBy(() -> provider.authenticate(authentication(
                "user@example.com",
                "wrong-password",
                "203.0.113.20"
        )))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);

        verify(pocketBaseClient, times(OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS))
                .authenticateUser("USER@example.com", "wrong-password");
        verifyNoMoreInteractions(pocketBaseClient);
    }

    @Test
    void authenticate_throttlesAfterRepeatedFailuresForIp() {
        when(pocketBaseClient.authenticateUser("user-0@example.com", "wrong-password")).thenReturn(Optional.empty());
        when(pocketBaseClient.authenticateUser("user-1@example.com", "wrong-password")).thenReturn(Optional.empty());
        when(pocketBaseClient.authenticateUser("user-2@example.com", "wrong-password")).thenReturn(Optional.empty());
        when(pocketBaseClient.authenticateUser("user-3@example.com", "wrong-password")).thenReturn(Optional.empty());
        when(pocketBaseClient.authenticateUser("user-4@example.com", "wrong-password")).thenReturn(Optional.empty());

        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            String identity = "user-" + i + "@example.com";
            assertThatThrownBy(() -> provider.authenticate(authentication(
                    identity,
                    "wrong-password",
                    "203.0.113.10"
            )))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);
        }

        assertThatThrownBy(() -> provider.authenticate(authentication(
                "other@example.com",
                "wrong-password",
                "203.0.113.10"
        )))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(PocketBaseAuthenticationProvider.GENERIC_LOGIN_FAILURE);

        for (int i = 0; i < OAuthLoginAbuseProtection.MAX_FAILED_ATTEMPTS; i++) {
            verify(pocketBaseClient).authenticateUser("user-" + i + "@example.com", "wrong-password");
        }
        verifyNoMoreInteractions(pocketBaseClient);
    }

    @Test
    void supportsUsernamePasswordAuthentication() {
        assertThat(provider.supports(UsernamePasswordAuthenticationToken.class)).isTrue();
    }

    private static UsernamePasswordAuthenticationToken authentication(String identity, String password, String remoteAddress) {
        UsernamePasswordAuthenticationToken authentication = UsernamePasswordAuthenticationToken.unauthenticated(identity, password);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        authentication.setDetails(new WebAuthenticationDetails(request));
        return authentication;
    }
}
