package com.resumate.mcp.tool;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.security.McpPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.CreatedProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.CreateProfilePayload;
import com.resumate.mcp.service.PocketBaseClient.CvProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.ProfileMaterialBundle;
import com.resumate.mcp.service.PocketBaseClient.TemplateDescriptor;
import com.resumate.mcp.service.PocketBaseClient.UpdatedProfileRecord;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

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
    private IdempotencyStore idempotencyStore;
    private CvMcpTools cvMcpTools;

    @BeforeEach
    void setUp() {
        pocketBaseClient = mock(PocketBaseClient.class);
        frontendProperties = new FrontendProperties("https://resumate.app");
        idempotencyStore = mock(IdempotencyStore.class);
        cvMcpTools = new CvMcpTools(pocketBaseClient, frontendProperties, idempotencyStore);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthentication(McpPrincipal principal) {
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
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of()),
                new TemplateDescriptor("modern", "Modern", "Split-sidebar resume with timeline-style experience and card-based project highlights.", List.of(
                        new PocketBaseClient.ExtraFieldDescriptor("headline", "Headline", "text", false, "Short role-focused line displayed near the candidate name.", null, List.of())
                ))
        );
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(expected);

        CvMcpTools.ListTemplatesResponse response = cvMcpTools.listTemplates();

        assertThat(response.templates()).hasSize(2);
        assertThat(response.templates().get(0).id()).isEqualTo("classic");
        assertThat(response.templates().get(1).extraSchema()).hasSize(1);
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
        assertThat(response.authSource()).isEqualTo("API_KEY");
    }

    @Test
    void listProfileMaterial_acceptsAnyMcpPrincipal() {
        setAuthentication(new TestMcpPrincipal("oauth-user", "claude.ai", "OAUTH"));
        ProfileMaterialBundle expected = mock(ProfileMaterialBundle.class);
        when(pocketBaseClient.loadProfileMaterial("oauth-user")).thenReturn(expected);

        ProfileMaterialBundle result = cvMcpTools.listProfileMaterial();

        assertThat(result).isSameAs(expected);
        verify(pocketBaseClient).loadProfileMaterial("oauth-user");
    }

    @Test
    void whoAmI_returnsSharedPrincipalDetailsForNonApiKeyPrincipal() {
        setAuthentication(new TestMcpPrincipal("oauth-user", "claude.ai", "OAUTH"));

        CvMcpTools.AuthenticatedPrincipalResponse response = cvMcpTools.whoAmI();

        assertThat(response.tokenId()).isNull();
        assertThat(response.userId()).isEqualTo("oauth-user");
        assertThat(response.label()).isEqualTo("claude.ai");
        assertThat(response.tokenPrefix()).isNull();
        assertThat(response.authSource()).isEqualTo("OAUTH");
    }

    @Test
    void createTailoredCvProfile_happyPath() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of()),
                new TemplateDescriptor("modern", "Modern", "Split-sidebar resume with timeline-style experience and card-based project highlights.", List.of())
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("profileId", "classic--senior-dev-123");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - Senior Dev", "Senior Dev CV", "Job listing text", "classic",
                "Professional summary",
                List.of("skill1"), List.of("job1"), List.of("proj1"),
                List.of("ach1"), List.of("deg1"), List.of("hob1"), Map.of()
        , null);

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(request);

        assertThat(response.profileId()).isEqualTo("profileId");
        assertThat(response.slug()).isEqualTo("classic--senior-dev-123");
        assertThat(response.frontendUrl()).isEqualTo("https://resumate.app/classic--senior-dev-123");
        verify(pocketBaseClient).createTailoredProfile(eq("userId"), org.mockito.ArgumentMatchers.argThat(payload ->
                payload.label().equals("Acme - Senior Dev")
                        && payload.profileName().equals("Senior Dev CV")
        ));
    }

    @Test
    void createTailoredCvProfile_defaultsBlankProfileNameToLabel() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("profileId", "classic--acme-dev-123"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - Dev", " ", "Job listing text", "classic",
                "Professional summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        cvMcpTools.createTailoredCvProfile(request);

        verify(pocketBaseClient).createTailoredProfile(eq("userId"), org.mockito.ArgumentMatchers.argThat(payload ->
                payload.profileName().equals("Acme - Dev")
        ));
    }

    @Test
    void createTailoredCvProfile_defaultsNullProfileNameToLabel() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("profileId", "classic--acme-dev-123"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - Dev", null, "Job listing text", "classic",
                "Professional summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        cvMcpTools.createTailoredCvProfile(request);

        verify(pocketBaseClient).createTailoredProfile(eq("userId"), org.mockito.ArgumentMatchers.argThat(payload ->
                payload.profileName().equals("Acme - Dev")
        ));
    }

    @Test
    void createTailoredCvProfile_throws_whenLabelMissing() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                " ", "Dev CV", "Job listing", "classic",
                "Summary", List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("label is required")
                .hasMessageContaining("Retry createTailoredCvProfile")
                .hasMessageContaining("'<company> - <role>'");
    }

    @Test
    void createTailoredCvProfile_throws_whenTemplateIdMissing() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - Dev", "Dev CV", "Job listing", null,
                "Summary", List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("templateId is required")
                .hasMessageContaining("Call listTemplates")
                .hasMessageContaining("retry createTailoredCvProfile");
    }

    @Test
    void createTailoredCvProfile_throws_whenTemplateNotSupported() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of())
        ));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "modern", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Requested template is not supported")
                .hasMessageContaining("Call listTemplates")
                .hasMessageContaining("returned template ids");
    }

    @Test
    void createTailoredCvProfile_throws_whenNoAuthentication() {
        SecurityContextHolder.clearContext();

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Authenticated MCP principal is required.");
    }

    @Test
    void createTailoredCvProfile_validatesOwnedRecordIds() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of())
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("id", "slug");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "classic", "Summary",
                List.of("skill1"), List.of("job1"), List.of(),
                List.of(), List.of(), List.of(), Map.of()
        , null);

        cvMcpTools.createTailoredCvProfile(request);

        verify(pocketBaseClient).validateOwnedRecordIds("skills", "userId", List.of("skill1"));
        verify(pocketBaseClient).validateOwnedRecordIds("jobs", "userId", List.of("job1"));
    }

    @Test
    void listTemplates_stripsTrailingSlash_fromFrontendUrl() {
        FrontendProperties trailingSlashProps = new FrontendProperties("https://resumate.app/");
        CvMcpTools toolsWithSlash = new CvMcpTools(pocketBaseClient, trailingSlashProps, idempotencyStore);

        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of())
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("id", "my-slug");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        CvMcpTools.CreateTailoredCvProfileResponse response = toolsWithSlash.createTailoredCvProfile(request);

        assertThat(response.frontendUrl()).isEqualTo("https://resumate.app/my-slug");
    }

    @Test
    void frontendUrl_prependsHttps_whenNoProtocol() {
        FrontendProperties hostOnlyProps = new FrontendProperties("resumate.app");
        CvMcpTools tools = new CvMcpTools(pocketBaseClient, hostOnlyProps, idempotencyStore);

        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.", List.of())
        ));

        CreatedProfileRecord createdRecord = new CreatedProfileRecord("id", "my-slug");
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(createdRecord);

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "classic", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        CvMcpTools.CreateTailoredCvProfileResponse response = tools.createTailoredCvProfile(request);

        assertThat(response.frontendUrl()).isEqualTo("https://resumate.app/my-slug");
    }

    @Test
    void createTailoredCvProfile_storesTemplateExtraUnderTemplateId() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("modern", "Modern", "Modern layout", List.of(
                        new PocketBaseClient.ExtraFieldDescriptor("headline", "Headline", "text", false, "Short headline.", null, List.of()),
                        new PocketBaseClient.ExtraFieldDescriptor("accentColor", "Accent color", "color", false, "Accent color.", null, List.of())
                ))
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("id", "slug"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "modern", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                Map.of("headline", "Senior developer", "accentColor", "#2563eb")
        , null);

        cvMcpTools.createTailoredCvProfile(request);

        verify(pocketBaseClient).createTailoredProfile(eq("userId"), org.mockito.ArgumentMatchers.argThat(payload ->
                payload.extra().equals(Map.of("modern", Map.of("headline", "Senior developer", "accentColor", "#2563eb")))
        ));
    }

    @Test
    void createTailoredCvProfile_rejectsUnsupportedTemplateExtraField() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("modern", "Modern", "Modern layout", List.of())
        ));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "modern", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                Map.of("unknown", "value")
        , null);

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported templateExtra field: unknown")
                .hasMessageContaining("listTemplates")
                .hasMessageContaining("extraSchema");
    }

    @Test
    void createTailoredCvProfile_validatesExtraSourceIds() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("supa", "Supa", "Supa layout", List.of(
                        new PocketBaseClient.ExtraFieldDescriptor("linkedProjectIds", "Linked projects", "multi_select", false, "Linked projects.", "projects", List.of())
                ))
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("id", "slug"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "supa", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                Map.of("linkedProjectIds", List.of("proj1"))
        , null);

        cvMcpTools.createTailoredCvProfile(request);

        verify(pocketBaseClient).validateOwnedRecordIds("projects", "userId", List.of("proj1"));
    }

    
    @Test
    void createTailoredCvProfile_rejectsWhenEmpty() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Empty Profile", "Empty", null, "classic",
                null,
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        assertThatThrownBy(() -> cvMcpTools.createTailoredCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot create an empty CV profile")
                .hasMessageContaining("skillIds")
                .hasMessageContaining("jobIds")
                .hasMessageContaining("professionalSummary");
    }

    @Test
    void createTailoredCvProfile_allowsWhenOnlySummaryProvided() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("id", "slug"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Label", "Name", null, "classic",
                "A professional summary",
                null, null, null, null, null, null, Map.of()
        , null);

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(request);
        assertThat(response.profileId()).isEqualTo("id");
    }

    @Test
    void createTailoredCvProfile_allowsWhenOnlySkillsProvided() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("id", "slug"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Label", "Name", null, "classic",
                null,
                List.of("skill1"), List.of(), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(request);
        assertThat(response.profileId()).isEqualTo("id");
    }

    @Test
    void createTailoredCvProfile_allowsWhenOnlyJobsProvided() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("id", "slug"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Label", "Name", null, "classic",
                null,
                List.of(), List.of("job1"), List.of(), List.of(), List.of(), List.of(), Map.of()
        , null);

        CvMcpTools.CreateTailoredCvProfileResponse response = cvMcpTools.createTailoredCvProfile(request);
        assertThat(response.profileId()).isEqualTo("id");
    }

    @Test
    void updateCvProfile_doesNotRejectWhenEmpty_guardOnlyAppliesToCreate() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("my-slug"))
                .thenReturn(new PocketBaseClient.CvProfileRecord("profileId", "my-slug", "userId", "classic", Map.of()));
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.updateCvProfile(eq("profileId"), any()))
                .thenReturn(new PocketBaseClient.UpdatedProfileRecord("profileId", "my-slug"));

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "my-slug",
                null, null, null, null,
                null,
                null, null, null, null, null, null,
                null, null
        );

        CvMcpTools.UpdateCvProfileResponse response = cvMcpTools.updateCvProfile(request);
        assertThat(response.profileId()).isEqualTo("profileId");
        assertThat(response.slug()).isEqualTo("my-slug");
        verify(pocketBaseClient, never()).createTailoredProfile(any(), any(CreateProfilePayload.class));
    }

    @Test
    void updateCvProfile_callsUpdateNeverCreate() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("my-slug"))
                .thenReturn(new CvProfileRecord("profileId", "my-slug", "userId", "classic", Map.of()));
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.updateCvProfile(eq("profileId"), any()))
                .thenReturn(new UpdatedProfileRecord("profileId", "my-slug"));

        CvMcpTools.UpdateCvProfileResponse response = cvMcpTools.updateCvProfile(
                new CvMcpTools.UpdateCvProfileRequest(
                        "my-slug",
                        "New Label", null, null, null,
                        "Updated summary",
                        null, null, null, null, null, null,
                        null, null
                )
        );

        assertThat(response.profileId()).isEqualTo("profileId");
        assertThat(response.slug()).isEqualTo("my-slug");
        verify(pocketBaseClient).updateCvProfile(eq("profileId"), any());
        verify(pocketBaseClient, never()).createTailoredProfile(any(), any(CreateProfilePayload.class));
    }

    @Test
    void updateCvProfile_missingProfile_throwsAndInvokesNeither() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("nonexistent-slug"))
                .thenReturn(null);

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "nonexistent-slug",
                "New Label", null, null, null, null,
                null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> cvMcpTools.updateCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Profile not found");

        verify(pocketBaseClient, never()).updateCvProfile(any(), any());
        verify(pocketBaseClient, never()).createTailoredProfile(any(), any(CreateProfilePayload.class));
    }

    @Test
    void updateCvProfile_rejectsWrongOwnerNeverCreates() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("foreign-slug"))
                .thenReturn(new CvProfileRecord("foreign-id", "foreign-slug", "other-user", "classic", Map.of()));

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "foreign-slug",
                "New Label", null, null, null, null,
                null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> cvMcpTools.updateCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong");

        verify(pocketBaseClient, never()).updateCvProfile(any(), any());
        verify(pocketBaseClient, never()).createTailoredProfile(any(), any(CreateProfilePayload.class));
    }

    @Test
    void updateCvProfile_nullRequest_throwsIdentifierRequiredNeverCreates() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        assertThatThrownBy(() -> cvMcpTools.updateCvProfile(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("profileSlug is required");

        verify(pocketBaseClient, never()).findProfileBySlugOrId(any());
        verify(pocketBaseClient, never()).updateCvProfile(any(), any());
        verify(pocketBaseClient, never()).createTailoredProfile(any(), any(CreateProfilePayload.class));
    }

    @Test
    void updateCvProfile_blankSlug_throwsIdentifierRequiredNeverCreates() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );
        setAuthentication(principal);

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "   ",
                "New Label", null, null, null, null,
                null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> cvMcpTools.updateCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("profileSlug is required");

        verify(pocketBaseClient, never()).findProfileBySlugOrId(any());
        verify(pocketBaseClient, never()).updateCvProfile(any(), any());
        verify(pocketBaseClient, never()).createTailoredProfile(any(), any(CreateProfilePayload.class));
    }
    private record TestMcpPrincipal(String userId, String label, String authSource) implements McpPrincipal {
        @Override
        public String getName() {
            return label;
        }
    }

    // ==================== doUpdateCvProfile error handling tests ====================

    @Test
    void doUpdateCvProfile_throwsWhenProfileNotFound() {
        AiTokenPrincipal principal = new AiTokenPrincipal("tokenId", "userId", "label");
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("non-existent-slug"))
                .thenReturn(null);

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "non-existent-slug",
                null, null, null, null,
                null, null, null, null, null, null,
                null, null, null
        );

        assertThatThrownBy(() -> cvMcpTools.updateCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Profile not found")
                .hasMessageContaining("non-existent-slug")
                .hasMessageContaining("permission");
    }

    @Test
    void doUpdateCvProfile_throwsWhenProfileOwnershipMismatch() {
        AiTokenPrincipal principal = new AiTokenPrincipal("tokenId", "userId", "label");
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("existing-slug"))
                .thenReturn(new PocketBaseClient.CvProfileRecord("profileId", "existing-slug", "differentUserId", "classic", Map.of()));

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "existing-slug",
                null, null, null, null,
                null, null, null, null, null, null,
                null, null, null
        );

        assertThatThrownBy(() -> cvMcpTools.updateCvProfile(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong to the authenticated user");
    }

    @Test
    void doUpdateCvProfile_succeedsWhenProfileFoundAndOwned() {
        AiTokenPrincipal principal = new AiTokenPrincipal("tokenId", "userId", "label");
        setAuthentication(principal);

        when(pocketBaseClient.findProfileBySlugOrId("valid-slug"))
                .thenReturn(new PocketBaseClient.CvProfileRecord("profileId", "valid-slug", "userId", "classic", Map.of()));
        when(pocketBaseClient.resolveAvailableTemplates()).thenReturn(List.of(
                new TemplateDescriptor("classic", "Classic", "desc", List.of())
        ));
        when(pocketBaseClient.updateCvProfile(eq("profileId"), any()))
                .thenReturn(new PocketBaseClient.UpdatedProfileRecord("profileId", "valid-slug"));

        CvMcpTools.UpdateCvProfileRequest request = new CvMcpTools.UpdateCvProfileRequest(
                "valid-slug",
                "New Label", null, null, null,
                null, null, null, null, null, null,
                null, null, null
        );

        CvMcpTools.UpdateCvProfileResponse response = cvMcpTools.updateCvProfile(request);

        assertThat(response.profileId()).isEqualTo("profileId");
        assertThat(response.slug()).isEqualTo("valid-slug");
    }

}
