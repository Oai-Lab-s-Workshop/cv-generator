package com.resumate.mcp.tool;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.CreatedProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.CreateProfilePayload;
import com.resumate.mcp.service.PocketBaseClient.ProfileMaterialBundle;
import com.resumate.mcp.service.PocketBaseClient.TemplateDescriptor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CvMcpToolsTest {

    private PocketBaseClient pocketBaseClient;
    private FrontendProperties frontendProperties;
    private CvMcpTools cvMcpTools;

    @BeforeEach
    void setUp() {
        pocketBaseClient = mock(PocketBaseClient.class);
        frontendProperties = new FrontendProperties("https://resumate.app");
        cvMcpTools = new CvMcpTools(pocketBaseClient, frontendProperties);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthentication(AiTokenPrincipal principal) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void listTemplates_returnsSupportedTemplates() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        List<TemplateDescriptor> expected = List.of(
                new TemplateDescriptor("classic", "Classic", "Traditional CV layout"),
                new TemplateDescriptor("modern", "Modern", "Contemporary single-column layout"),
                new TemplateDescriptor("minimal", "Minimal", "Compact and concise CV layout")
        );
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(expected);

        CvMcpTools.ListTemplatesResponse response = cvMcpTools.listTemplates();

        assertThat(response.templates()).hasSize(3);
        assertThat(response.templates().get(0).id()).isEqualTo("classic");
    }

    @Test
    void listProfileMaterial_delegatesToPocketBaseClient() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        ProfileMaterialBundle expected = mock(ProfileMaterialBundle.class);
        when(pocketBaseClient.loadProfileMaterial("userId")).thenReturn(expected);

        ProfileMaterialBundle result = cvMcpTools.listProfileMaterial();

        assertThat(result).isSameAs(expected);
        verify(pocketBaseClient).loadProfileMaterial("userId");
    }

    @Test
    void whoAmI_returnsAuthenticatedPrincipalDetails() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label", "resm_demoPrefix"
        );
        setAuthentication(principal);

        CvMcpTools.AuthenticatedPrincipalResponse response = cvMcpTools.whoAmI();

        assertThat(response.tokenId()).isEqualTo("tokenId");
        assertThat(response.userId()).isEqualTo("userId");
        assertThat(response.label()).isEqualTo("label");
        assertThat(response.tokenPrefix()).isEqualTo("resm_demoPrefix");
    }

    @Test
    void createTailoredCvProfile_happyPath() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Traditional CV layout"),
                new TemplateDescriptor("modern", "Modern", "Contemporary single-column layout")
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("profileId", "classic--senior-dev-123");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Senior Dev CV", "Job listing text", "classic",
                "Professional summary",
                List.of("skill1"), List.of("job1"), List.of("proj1"),
                List.of("ach1"), List.of("deg1"), List.of("hob1")
        );

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(request);

        assertThat(response.profileId()).isEqualTo("profileId");
        assertThat(response.slug()).isEqualTo("classic--senior-dev-123");
        assertThat(response.frontendUrl()).isEqualTo("https://resumate.app/classic--senior-dev-123");
    }

    @Test
    void createTailoredCvProfile_throws_whenTemplateIdMissing() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Dev CV", "Job listing", null,
                "Summary", List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("templateId is required.");
    }

    @Test
    void createTailoredCvProfile_throws_whenTemplateNotSupported() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Traditional CV layout")
        ));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "modern", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Requested template is not supported.");
    }

    @Test
    void createTailoredCvProfile_throws_whenNoAuthentication() {
        SecurityContextHolder.clearContext();

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Authenticated API key principal is required.");
    }

    @Test
    void createTailoredCvProfile_validatesOwnedRecordIds() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Traditional CV layout")
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("id", "slug");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "classic", "Summary",
                List.of("skill1"), List.of("job1"), List.of(),
                List.of(), List.of(), List.of()
        );

        cvMcpTools.createTailoredCvProfile(request);

        verify(pocketBaseClient).validateOwnedRecordIds("skills", "userId", List.of("skill1"));
        verify(pocketBaseClient).validateOwnedRecordIds("jobs", "userId", List.of("job1"));
    }

    @Test
    void listTemplates_stripsTrailingSlash_fromFrontendUrl() {
        FrontendProperties trailingSlashProps = new FrontendProperties("https://resumate.app/");
        CvMcpTools toolsWithSlash = new CvMcpTools(pocketBaseClient, trailingSlashProps);

        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Traditional CV layout")
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("id", "my-slug");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        CvMcpTools.CreateTailoredCvProfileResponse response = toolsWithSlash.createTailoredCvProfile(request);

        assertThat(response.frontendUrl()).isEqualTo("https://resumate.app/my-slug");
    }

}
