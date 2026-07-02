package com.resumate.mcp.security;

import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
@TestPropertySource(properties = {
    "resumate.cors.allowed-origins=http://localhost:3000,https://admin.example.com"
})
class CorsConfigWithExtraOriginsTest {

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
    void extraOriginFromAuthorizedUrlIsAllowed() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void anotherExtraOriginIsAllowed() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", "https://admin.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://admin.example.com"));
    }

    @Test
    void defaultOriginsStillAllowedWithExtraOrigins() throws Exception {
        // Default origin from test properties (FRONTEND_BASE_URL not explicitly overridden,
        // so it falls back to http://localhost:4200 — not asserted here)
        // But MCP public base URL from OAuthTestPropertiesInitializer should still work
        mockMvc.perform(options("/health")
                        .header("Origin", "https://mcp.example.test")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://mcp.example.test"));
    }

    @Test
    void originNotInAnyListIsRejected() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", "https://unauthorized.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
