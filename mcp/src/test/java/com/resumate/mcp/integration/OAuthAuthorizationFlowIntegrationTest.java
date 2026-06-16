package com.resumate.mcp.integration;

import com.jayway.jsonpath.JsonPath;
import com.resumate.mcp.security.oauth.PocketBaseOAuthPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
class OAuthAuthorizationFlowIntegrationTest {

    private static final String CLIENT_RECORD_ID = "pb-client-record";
    private static final String CLIENT_ID = "claude-client-id";
    private static final String USER_ID = "pb-user-id";
    private static final String REDIRECT_URI = "https://claude.ai/api/mcp/auth_callback";

    @Autowired
    private WebApplicationContext webApplicationContext;

    @MockitoBean
    private PocketBaseClient pocketBaseClient;

    @Autowired
    private RegisteredClientRepository registeredClientRepository;

    private MockMvc mockMvc;
    private final Map<String, StoredAuthorization> authorizations = new LinkedHashMap<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
        authorizations.clear();

        when(pocketBaseClient.authenticateUser("user@example.com", "secret-password"))
                .thenReturn(Optional.of(new PocketBaseClient.UserRecord(
                        USER_ID,
                        "Alex",
                        "Morgan",
                        null,
                        null,
                        null,
                        "user@example.com",
                        null
                )));
        when(pocketBaseClient.findOAuthClientByClientId(CLIENT_ID)).thenReturn(Optional.of(oauthClientRecord()));
        when(pocketBaseClient.findOAuthClientByRecordId(CLIENT_RECORD_ID)).thenReturn(Optional.of(oauthClientRecord()));
        when(pocketBaseClient.findOAuthAuthorizationByClientAndUser(eq(CLIENT_ID), eq(USER_ID)))
                .thenAnswer((invocation) -> authorizations.values().stream()
                        .filter((stored) -> CLIENT_ID.equals(stored.payload.clientId()))
                        .filter((stored) -> USER_ID.equals(stored.payload.user()))
                        .findFirst()
                        .map(StoredAuthorization::toRecord));
        when(pocketBaseClient.findOAuthAuthorizationByStateId(anyString()))
                .thenAnswer((invocation) -> {
                    String stateId = invocation.getArgument(0);
                    return authorizations.values().stream()
                            .filter((stored) -> stateId.equals(stored.payload.state().get("id")))
                            .findFirst()
                            .map(StoredAuthorization::toRecord);
                });
        when(pocketBaseClient.findOAuthAuthorizationByConsentState(anyString()))
                .thenAnswer((invocation) -> {
                    String consentState = invocation.getArgument(0);
                    return authorizations.values().stream()
                            .filter((stored) -> consentState.equals(attributes(stored).get("state")))
                            .findFirst()
                            .map(StoredAuthorization::toRecord);
                });
        when(pocketBaseClient.findOAuthAuthorizationByAuthCode(anyString()))
                .thenAnswer((invocation) -> {
                    String rawAuthCode = invocation.getArgument(0);
                    return authorizations.values().stream()
                            .filter((stored) -> rawAuthCode.equals(stored.payload.rawAuthCode()))
                            .findFirst()
                            .map(StoredAuthorization::toRecord);
                });
        when(pocketBaseClient.findOAuthAuthorizationByRefreshToken(anyString()))
                .thenAnswer((invocation) -> {
                    String rawRefreshToken = invocation.getArgument(0);
                    return authorizations.values().stream()
                            .filter((stored) -> rawRefreshToken.equals(stored.payload.rawRefreshToken()))
                            .findFirst()
                            .map(StoredAuthorization::toRecord);
                });
        when(pocketBaseClient.createOAuthAuthorization(any()))
                .thenAnswer((invocation) -> saveAuthorization("pb-auth-record-" + (authorizations.size() + 1), invocation.getArgument(0)));
        when(pocketBaseClient.updateOAuthAuthorization(anyString(), any()))
                .thenAnswer((invocation) -> saveAuthorization(invocation.getArgument(0), invocation.getArgument(1)));
    }

    @Test
    void formLogin_authenticatesAgainstPocketBase() throws Exception {
        mockMvc.perform(formLogin("/login")
                        .user("user@example.com")
                        .password("secret-password"))
                .andExpect(authenticated().withUsername(USER_ID));
    }

    @Test
    void authorizationCodePkceFlow_refreshGrantAndRevokedRefreshGrant() throws Exception {
        String verifier = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
        String challenge = s256(verifier);
        Authentication user = new UsernamePasswordAuthenticationToken(
                new PocketBaseOAuthPrincipal(USER_ID, "user@example.com", "Alex Morgan"),
                null,
                List.of()
        );
        assertThat(registeredClientRepository.findByClientId(CLIENT_ID).getAuthorizationGrantTypes())
                .contains(AuthorizationGrantType.AUTHORIZATION_CODE);

        MvcResult consentRedirect = mockMvc.perform(get(authorizationUri(challenge))
                        .with(authentication(user)))
                .andExpect(status().is3xxRedirection())
                .andReturn();
        String consentLocation = consentRedirect.getResponse().getHeader("Location");
        assertThat(consentLocation).contains("/oauth/consent");
        MockHttpSession session = (MockHttpSession) consentRedirect.getRequest().getSession(false);
        String consentState = queryParam(consentLocation, "state");

        mockMvc.perform(get("/oauth/consent")
                        .session(session)
                        .param("client_id", CLIENT_ID)
                        .param("scope", "mcp")
                        .param("state", consentState)
                        .with(authentication(user)))
                .andExpect(status().isOk());

        MvcResult authorizationRedirect = mockMvc.perform(post("/oauth/authorize")
                        .session(session)
                        .param("client_id", CLIENT_ID)
                        .param("state", consentState)
                        .param("scope", "mcp")
                        .with(authentication(user))
                        .with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andReturn();
        String authorizationLocation = authorizationRedirect.getResponse().getHeader("Location");
        assertThat(authorizationLocation).startsWith(REDIRECT_URI);
        String code = queryParam(authorizationLocation, "code");
        assertThat(queryParam(authorizationLocation, "state")).isEqualTo("client-state");

        MvcResult tokenResult = mockMvc.perform(post("/oauth/token")
                        .param("grant_type", "authorization_code")
                        .param("client_id", CLIENT_ID)
                        .param("redirect_uri", REDIRECT_URI)
                        .param("code", code)
                        .param("code_verifier", verifier))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").exists())
                .andExpect(jsonPath("$.refresh_token").exists())
                .andReturn();
        String refreshToken = JsonPath.read(tokenResult.getResponse().getContentAsString(), "$.refresh_token");

        MvcResult refreshResult = mockMvc.perform(post("/oauth/token")
                        .param("grant_type", "refresh_token")
                        .param("client_id", CLIENT_ID)
                        .param("refresh_token", refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").exists())
                .andExpect(jsonPath("$.refresh_token").exists())
                .andReturn();
        String rotatedRefreshToken = JsonPath.read(refreshResult.getResponse().getContentAsString(), "$.refresh_token");

        revokeRefreshToken(rotatedRefreshToken);

        mockMvc.perform(post("/oauth/token")
                        .param("grant_type", "refresh_token")
                        .param("client_id", CLIENT_ID)
                        .param("refresh_token", rotatedRefreshToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_grant"));
    }

    private PocketBaseClient.OAuthAuthorizationRecord saveAuthorization(
            String recordId,
            PocketBaseClient.OAuthAuthorizationPayload payload
    ) {
        StoredAuthorization stored = new StoredAuthorization(recordId, payload);
        authorizations.put(recordId, stored);
        return stored.toRecord();
    }

    private void revokeRefreshToken(String refreshToken) {
        authorizations.replaceAll((recordId, stored) -> refreshToken.equals(stored.payload.rawRefreshToken())
                ? new StoredAuthorization(recordId, new PocketBaseClient.OAuthAuthorizationPayload(
                stored.payload.user(),
                stored.payload.clientId(),
                stored.payload.scopes(),
                stored.payload.rawAuthCode(),
                stored.payload.rawRefreshToken(),
                stored.payload.accessTokenJti(),
                stored.payload.expiresAt(),
                "revoked",
                stored.payload.state(),
                stored.payload.consent()
        ))
                : stored);
    }

    private static PocketBaseClient.OAuthClientRecord oauthClientRecord() {
        return new PocketBaseClient.OAuthClientRecord(
                CLIENT_RECORD_ID,
                CLIENT_ID,
                null,
                "claude.ai",
                List.of(REDIRECT_URI),
                List.of("authorization_code", "refresh_token"),
                List.of("mcp"),
                Map.of(
                        "settings.token.access-token-time-to-live", "PT1H",
                        "settings.token.refresh-token-time-to-live", "P90D"
                ),
                null
        );
    }

    private static String s256(String verifier) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available.", ex);
        }
    }

    private static String authorizationUri(String challenge) {
        return "/oauth/authorize"
                + "?response_type=code"
                + "&client_id=" + CLIENT_ID
                + "&redirect_uri=" + REDIRECT_URI
                + "&scope=mcp"
                + "&state=client-state"
                + "&code_challenge=" + challenge
                + "&code_challenge_method=S256";
    }

    private static String queryParam(String location, String name) {
        String query = URI.create(location).getRawQuery();
        assertThat(query).isNotBlank();
        return Arrays.stream(query.split("&"))
                .map((pair) -> pair.split("=", 2))
                .filter((parts) -> parts.length == 2 && name.equals(decode(parts[0])))
                .map((parts) -> decode(parts[1]))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Missing query parameter: " + name));
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> attributes(StoredAuthorization stored) {
        Object attributes = stored.payload.state().get("attributes");
        return attributes instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private record StoredAuthorization(String recordId, PocketBaseClient.OAuthAuthorizationPayload payload) {
        private PocketBaseClient.OAuthAuthorizationRecord toRecord() {
            return new PocketBaseClient.OAuthAuthorizationRecord(
                    recordId,
                    payload.user(),
                    payload.clientId(),
                    payload.scopes(),
                    payload.rawAuthCode() == null ? null : "hashed-auth-code",
                    payload.rawRefreshToken() == null ? null : "hashed-refresh-token",
                    payload.accessTokenJti(),
                    payload.expiresAt(),
                    payload.status(),
                    payload.state(),
                    payload.consent()
            );
        }
    }
}
