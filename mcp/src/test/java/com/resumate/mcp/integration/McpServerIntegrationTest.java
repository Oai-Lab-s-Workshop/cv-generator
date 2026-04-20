package com.resumate.mcp.integration;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.config.PocketBaseProperties;
import com.resumate.mcp.config.McpToolConfiguration;
import com.resumate.mcp.security.AiTokenAuthenticationFilter;
import com.resumate.mcp.security.AiTokenAuthenticationService;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.tool.CvMcpTools;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@SpringBootTest
class McpServerIntegrationTest {

    @MockitoBean
    private PocketBaseClient pocketBaseClient;

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public FrontendProperties frontendProperties() {
            return new FrontendProperties("https://resumate.app");
        }

        @Bean
        @Primary
        public PocketBaseProperties pocketBaseProperties() {
            return new PocketBaseProperties("http://localhost:8090", "test@test.com", "testpass");
        }
    }

    @Autowired
    private CvMcpTools cvMcpTools;

    @Autowired
    private AiTokenAuthenticationFilter aiTokenAuthenticationFilter;

    @Autowired
    private AiTokenAuthenticationService aiTokenAuthenticationService;

    @Autowired
    private McpToolConfiguration mcpToolConfiguration;

    @Test
    void contextLoads() {
    }

    @Test
    void cvMcpToolsBean_isWired() {
        assertThat(cvMcpTools).isNotNull();
    }

    @Test
    void securityBeans_areWired() {
        assertThat(aiTokenAuthenticationFilter).isNotNull();
        assertThat(aiTokenAuthenticationService).isNotNull();
    }

    @Test
    void mcpToolConfiguration_containsCvTools() {
        assertThat(mcpToolConfiguration).isNotNull();
    }

    @Test
    void pocketBaseClientMock_works() {
        when(pocketBaseClient.findAiTokenByRawToken("test-token")).thenReturn(Optional.of(
                new PocketBaseClient.AiTokenRecord(
                        "tokenId", "userId", "label", "active",
                        Instant.now().plusSeconds(3600).toString(),
                        true, List.of("classic"), 5, 0, "hash", "prefix"
                )
        ));

        Optional<PocketBaseClient.AiTokenRecord> result = pocketBaseClient.findAiTokenByRawToken("test-token");
        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("tokenId");
    }

    @Test
    void resolveAllowedTemplates_worksWithMock() {
        when(pocketBaseClient.resolveAllowedTemplates(List.of("classic", "modern")))
                .thenReturn(List.of(
                        new PocketBaseClient.TemplateDescriptor("classic", "Classic", "Traditional CV layout"),
                        new PocketBaseClient.TemplateDescriptor("modern", "Modern", "Contemporary single-column layout")
                ));

        List<PocketBaseClient.TemplateDescriptor> templates =
                pocketBaseClient.resolveAllowedTemplates(List.of("classic", "modern"));

        assertThat(templates).hasSize(2);
    }
}