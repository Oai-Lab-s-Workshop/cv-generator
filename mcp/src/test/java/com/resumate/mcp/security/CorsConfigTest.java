package com.resumate.mcp.security;

import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
class CorsConfigTest {

    private static final String ALLOWED_FRONTEND_ORIGIN = "http://localhost:4200";
    private static final String ALLOWED_MCP_ORIGIN = "https://mcp.example.test";
    private static final String DISALLOWED_ORIGIN = "https://evil.example.com";

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    void preflightRequestFromAllowedFrontendOriginReturnsCorsHeaders() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", ALLOWED_FRONTEND_ORIGIN)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_FRONTEND_ORIGIN))
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                .andExpect(header().exists("Access-Control-Allow-Credentials"));
    }

    @Test
    void preflightRequestFromAllowedMcpOriginReturnsCorsHeaders() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", ALLOWED_MCP_ORIGIN)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_MCP_ORIGIN));
    }

    @Test
    void preflightRequestFromDisallowedOriginRejectsCors() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", DISALLOWED_ORIGIN)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void actualRequestFromAllowedOriginReturnsCorsHeaders() throws Exception {
        mockMvc.perform(get("/health")
                        .header("Origin", ALLOWED_FRONTEND_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_FRONTEND_ORIGIN));
    }

    @Test
    void actualRequestFromDisallowedOriginMissingCorsHeaders() throws Exception {
        // Spring's DefaultCorsProcessor rejects a disallowed actual CORS request
        // with 403 ("Invalid CORS request") and emits no Access-Control-Allow-Origin.
        mockMvc.perform(get("/health")
                        .header("Origin", DISALLOWED_ORIGIN))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void corsHeadersAreReturnedForAllMethodsOnMcpEndpoint() throws Exception {
        mockMvc.perform(options("/mcp")
                        .header("Origin", ALLOWED_FRONTEND_ORIGIN)
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_FRONTEND_ORIGIN));
    }

    @Test
    void corsHeadersAreReturnedForOAuthEndpoints() throws Exception {
        mockMvc.perform(options("/oauth2/authorization/pocketbase")
                        .header("Origin", ALLOWED_FRONTEND_ORIGIN)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_FRONTEND_ORIGIN));
    }

    @Test
    void wildcardOriginNotPresent() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", ALLOWED_FRONTEND_ORIGIN)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_FRONTEND_ORIGIN));
    }
}
