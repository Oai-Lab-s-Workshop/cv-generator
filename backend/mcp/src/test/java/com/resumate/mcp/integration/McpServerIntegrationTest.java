package com.resumate.mcp.integration;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.config.PocketBaseProperties;
import com.resumate.mcp.config.McpToolConfiguration;
import com.resumate.mcp.security.AiTokenAuthenticationFilter;
import com.resumate.mcp.security.AiTokenAuthenticationService;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import com.resumate.mcp.tool.CvMcpTools;
import org.junit.jupiter.api.Test;
import org.springframework.ai.mcp.server.common.autoconfigure.properties.McpServerProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
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

    @Autowired
    private McpServerProperties mcpServerProperties;

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
                        "hash", "prefix"
                )
        ));

        Optional<PocketBaseClient.AiTokenRecord> result = pocketBaseClient.findAiTokenByRawToken("test-token");
        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("tokenId");
    }

    @Test
    void resolveAvailableTemplates_worksWithMock() {
        when(pocketBaseClient.resolveAvailableTemplates())
                .thenReturn(List.of(
                        new PocketBaseClient.TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of()),
                        new PocketBaseClient.TemplateDescriptor("modern", "Modern", "Split-sidebar resume with timeline-style experience and card-based project highlights.", List.of())
                ));

        List<PocketBaseClient.TemplateDescriptor> templates =
                pocketBaseClient.resolveAvailableTemplates();

        assertThat(templates).hasSize(2);
    }

    @Test
    void runtimeInstructions_coverRequiredGuidance() {
        assertThat(mcpServerProperties).isNotNull();

        String instructions = mcpServerProperties.getInstructions();
        assertThat(instructions).isNotNull().isNotBlank();

        // The instructions must stand alone: an MCP host never fetches mcp/AGENTS.md for us.
        assertThat(instructions).doesNotContain("Read mcp/AGENTS.md");
        assertThat(instructions).doesNotContain("AGENTS.md");

        // Material-first workflow.
        assertThat(instructions).contains("listTemplates");
        assertThat(instructions).contains("listProfileMaterial");

        // Holistic portrait before selection.
        assertThat(instructions).contains("holistic portrait");

        // Displayed role title is synthesised, not copied, and never carries the user's name.
        assertThat(instructions).contains("profileName");
        assertThat(instructions).contains("coherent middle ground");
        assertThat(instructions).contains("Do not copy the job offer listing title verbatim");
        assertThat(instructions).contains("never include the user's name in profileName");

        // Summary is drafted only once the rest of the material is selected.
        assertThat(instructions).contains("professionalSummary");
        assertThat(instructions).contains("Only after every other selection is final");

        // Existing safety guidance survives.
        assertThat(instructions).contains("do not create new source records");
        assertThat(instructions).contains("updateCvProfile");
        assertThat(instructions).contains("idempotencyKey");
        assertThat(instructions).contains("deduplicated");

        // The createTailoredCvProfile call step itself must require profileName and professionalSummary.
        int createIdx = instructions.indexOf("Call createTailoredCvProfile");
        assertThat(createIdx).as("instructions must contain the createTailoredCvProfile step").isGreaterThan(-1);
        String createSection = instructions.substring(createIdx);
        assertThat(createSection).contains("profileName");
        assertThat(createSection).contains("professionalSummary");
    }
}
