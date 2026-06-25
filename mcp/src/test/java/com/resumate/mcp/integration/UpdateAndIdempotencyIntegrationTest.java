package com.resumate.mcp.integration;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.config.PocketBaseProperties;
import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.CreateProfilePayload;
import com.resumate.mcp.service.PocketBaseClient.CreatedProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.CvProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.UpdatedProfileRecord;
import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import com.resumate.mcp.tool.CvMcpTools;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
class UpdateAndIdempotencyIntegrationTest {

    @MockitoBean
    private PocketBaseClient pocketBaseClient;

    @Autowired
    private CvMcpTools cvMcpTools;

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

    @BeforeEach
    void setUp() {
        AiTokenPrincipal principal = new AiTokenPrincipal("tokenId", "userId", "label");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of())
        );
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createProfile_withIdempotencyKey_createsOnFirstCall() {
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new PocketBaseClient.TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("profile-1", "slug-1"));

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(
                new CvMcpTools.CreateTailoredCvProfileRequest(
                        "My Profile", "My Profile", null, "classic",
                        "A summary",
                        List.of("skill1"), List.of(), List.of(), List.of(), List.of(), List.of(),
                        Map.of(),
                        "it-key-first-call-001"
                )
        );

        assertThat(response.profileId()).isEqualTo("profile-1");
        assertThat(response.deduplicated()).isFalse();
    }

    @Test
    void createProfile_withSameIdempotencyKey_reroutesToUpdate() {
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new PocketBaseClient.TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("profile-2", "slug-2"));

        cvMcpTools.createTailoredCvProfile(
                new CvMcpTools.CreateTailoredCvProfileRequest(
                        "My Profile", "My Profile", null, "classic",
                        "A summary",
                        List.of("skill1"), List.of(), List.of(), List.of(), List.of(), List.of(),
                        Map.of(),
                        "it-key-dedup-002"
                )
        );

        when(pocketBaseClient.findProfileBySlugOrId("slug-2"))
                .thenReturn(new CvProfileRecord("profile-2", "slug-2", "userId", "classic", Map.of()));
        when(pocketBaseClient.updateCvProfile(eq("profile-2"), any()))
                .thenReturn(new UpdatedProfileRecord("profile-2", "slug-2"));

        CvMcpTools.CreateTailoredCvProfileResponse response2 = cvMcpTools.createTailoredCvProfile(
                new CvMcpTools.CreateTailoredCvProfileRequest(
                        "My Profile v2", "My Profile v2", null, "classic",
                        "Updated summary",
                        List.of(), List.of("job1"), List.of(), List.of(), List.of(), List.of(),
                        Map.of(),
                        "it-key-dedup-002"
                )
        );

        assertThat(response2.profileId()).isEqualTo("profile-2");
        assertThat(response2.slug()).isEqualTo("slug-2");
        assertThat(response2.deduplicated()).isTrue();
        verify(pocketBaseClient).updateCvProfile(eq("profile-2"), any());
    }

    @Test
    void createProfile_withDifferentIdempotencyKeys_createsSeparateProfiles() {
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new PocketBaseClient.TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("profile-a", "slug-a"))
                .thenReturn(new CreatedProfileRecord("profile-b", "slug-b"));

        CvMcpTools.CreateTailoredCvProfileResponse responseA = cvMcpTools.createTailoredCvProfile(
                new CvMcpTools.CreateTailoredCvProfileRequest(
                        "Job A", "Job A", null, "classic",
                        "Summary A",
                        List.of("skill1"), List.of(), List.of(), List.of(), List.of(), List.of(),
                        Map.of(),
                        "it-key-separate-003a"
                )
        );

        CvMcpTools.CreateTailoredCvProfileResponse responseB = cvMcpTools.createTailoredCvProfile(
                new CvMcpTools.CreateTailoredCvProfileRequest(
                        "Job B", "Job B", null, "classic",
                        "Summary B",
                        List.of("skill2"), List.of(), List.of(), List.of(), List.of(), List.of(),
                        Map.of(),
                        "it-key-separate-003b"
                )
        );

        assertThat(responseA.profileId()).isEqualTo("profile-a");
        assertThat(responseA.deduplicated()).isFalse();
        assertThat(responseB.profileId()).isEqualTo("profile-b");
        assertThat(responseB.deduplicated()).isFalse();
    }

    @Test
    void updateCvProfile_updatesProvidedFieldsOnly() {
        when(pocketBaseClient.findProfileBySlugOrId("my-slug"))
                .thenReturn(new CvProfileRecord("profile-3", "my-slug", "userId", "classic", Map.of()));
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new PocketBaseClient.TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.updateCvProfile(eq("profile-3"), any()))
                .thenReturn(new UpdatedProfileRecord("profile-3", "my-slug"));

        CvMcpTools.UpdateCvProfileResponse response = cvMcpTools.updateCvProfile(
                new CvMcpTools.UpdateCvProfileRequest(
                        "my-slug",
                        "New Label", null, null, null,
                        "New summary",
                        null, null, null, null, null, null,
                        null, null
                )
        );

        assertThat(response.profileId()).isEqualTo("profile-3");
        assertThat(response.slug()).isEqualTo("my-slug");
        assertThat(response.frontendUrl()).isEqualTo("https://resumate.app/my-slug");
    }
}
