package com.resumate.mcp.integration;

import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
class OAuthMetadataIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @MockitoBean
    private PocketBaseClient pocketBaseClient;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    void authorizationServerMetadata_isPublicAndUsesConfiguredIssuer() throws Exception {
        mockMvc.perform(get("/.well-known/oauth-authorization-server"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issuer").value("https://mcp.example.test"))
                .andExpect(jsonPath("$.authorization_endpoint").value("https://mcp.example.test/oauth/authorize"))
                .andExpect(jsonPath("$.token_endpoint").value("https://mcp.example.test/oauth/token"))
                .andExpect(jsonPath("$.registration_endpoint").value("https://mcp.example.test/oauth/register"))
                .andExpect(jsonPath("$.jwks_uri").value("https://mcp.example.test/oauth/jwks"))
                .andExpect(jsonPath("$.code_challenge_methods_supported[0]").value("S256"));
    }

    @Test
    void protectedResourceMetadata_isPublicAndAdvertisesAuthorizationServer() throws Exception {
        mockMvc.perform(get("/.well-known/oauth-protected-resource"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resource").value("https://mcp.example.test/mcp"))
                .andExpect(jsonPath("$.authorization_servers[0]").value("https://mcp.example.test"))
                .andExpect(jsonPath("$.bearer_methods_supported[0]").value("header"))
                .andExpect(jsonPath("$.scopes_supported[0]").value("mcp"));
    }

    @Test
    void dynamicClientRegistration_isPublicForAllowedClaudeRedirectUri() throws Exception {
        when(pocketBaseClient.findOAuthClientByClientNameAndRedirectUris(
                eq("claude.ai"),
                eq(List.of("https://claude.ai/api/mcp/auth_callback"))
        )).thenReturn(Optional.empty());
        when(pocketBaseClient.findOAuthClientByClientId(any())).thenReturn(Optional.empty());
        when(pocketBaseClient.createOAuthClient(any())).thenReturn(new PocketBaseClient.OAuthClientRecord(
                "pb-client-record",
                "generated-client-id",
                null,
                "claude.ai",
                List.of("https://claude.ai/api/mcp/auth_callback"),
                List.of("authorization_code", "refresh_token"),
                List.of("mcp"),
                Map.of(),
                null
        ));

        mockMvc.perform(post("/oauth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "client_name": "claude.ai",
                                  "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
                                  "grant_types": ["authorization_code", "refresh_token"],
                                  "response_types": ["code"],
                                  "scope": "mcp",
                                  "token_endpoint_auth_method": "none"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.client_name").value("claude.ai"))
                .andExpect(jsonPath("$.redirect_uris[0]").value("https://claude.ai/api/mcp/auth_callback"));
    }
}
