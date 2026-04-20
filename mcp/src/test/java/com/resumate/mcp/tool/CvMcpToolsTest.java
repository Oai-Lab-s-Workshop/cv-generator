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
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
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
    void listTemplates_returnsFilteredTemplates() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of("classic", "modern"), 5, 0, "label"
        );
        setAuthentication(principal);

        List<TemplateDescriptor> expected = List.of(
                new TemplateDescriptor("classic", "Classic", "Traditional CV layout"),
                new TemplateDescriptor("modern", "Modern", "Contemporary single-column layout")
        );
        when(pocketBaseClient.resolveAllowedTemplates(List.of("classic", "modern")))
                .thenReturn(expected);

        CvMcpTools.ListTemplatesResponse response = cvMcpTools.listTemplates();

        assertThat(response.templates()).hasSize(2);
        assertThat(response.templates().get(0).id()).isEqualTo("classic");
    }

    @Test
    void listProfileMaterial_delegatesToPocketBaseClient() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("classic"), 5, 0, "label"
        );
        setAuthentication(principal);

        ProfileMaterialBundle expected = mock(ProfileMaterialBundle.class);
        when(pocketBaseClient.loadProfileMaterial("userId")).thenReturn(expected);

        ProfileMaterialBundle result = cvMcpTools.listProfileMaterial();

        assertThat(result).isSameAs(expected);
        verify(pocketBaseClient).loadProfileMaterial("userId");
    }

    @Test
    void createTailoredCvProfile_happyPath_withTemplateChoice() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of("classic", "modern"), 5, 0, "label"
        );
        setAuthentication(principal);

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
        verify(pocketBaseClient).markTokenUsed("tokenId", 1);
    }

    @Test
    void createTailoredCvProfile_usesFirstTemplate_whenCanChooseTemplateIsFalse() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", false,
                Set.of("modern"), 5, 0, "label"
        );
        setAuthentication(principal);

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("profileId", "modern--dev-123");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Dev CV", "Job listing", null,
                "Summary", List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(request);

        assertThat(response.profileId()).isEqualTo("profileId");
        verify(pocketBaseClient).createTailoredProfile(eq("userId"), argThat(payload ->
                "modern".equals(payload.templateId())
        ));
    }

    @Test
    void createTailoredCvProfile_throws_whenQuotaExceeded() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of("classic"), 3, 3, "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("AI token profile creation quota exceeded.");
    }

    @Test
    void createTailoredCvProfile_throws_whenNoAllowedTemplates() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of(), 5, 0, "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("AI token has no allowed templates.");
    }

    @Test
    void createTailoredCvProfile_throws_whenTemplateChoiceRequiredButNotProvided() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of("classic"), 5, 0, "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", null, "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("templateId is required when the token allows template choice.");
    }

    @Test
    void createTailoredCvProfile_throws_whenTemplateNotAllowed() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of("classic"), 5, 0, "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "CV", "Job", "modern", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Requested template is not allowed for this token.");
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
                .hasMessage("Authenticated AI token principal is required.");
    }

    @Test
    void createTailoredCvProfile_validatesOwnedRecordIds() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true,
                Set.of("classic"), 5, 0, "label"
        );
        setAuthentication(principal);

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
                "tokenId", "userId", true,
                Set.of("classic"), 5, 0, "label"
        );
        setAuthentication(principal);

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

    private static <T> T argThat(org.mockito.ArgumentMatcher<T> matcher) {
        return org.mockito.ArgumentMatchers.argThat(matcher);
    }
}