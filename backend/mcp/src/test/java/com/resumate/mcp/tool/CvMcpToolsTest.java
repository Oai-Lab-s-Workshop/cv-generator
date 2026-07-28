package com.resumate.mcp.tool;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.security.McpPrincipal;
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
import java.util.Map;

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
    void listCvProfiles_returnsOwnedProfilesWithFrontendUrls() {
        setAuthentication(new AiTokenPrincipal("tokenId", "userId", "label"));

        when(pocketBaseClient.listCvProfilesForUser("userId")).thenReturn(List.of(
                new PocketBaseClient.CvProfileSummaryRecord(
                        "profile1", "classic--acme-dev-1", "Acme - Dev", "Acme Dev CV", "classic", true, "2026-07-20 10:00:00.000Z"
                ),
                new PocketBaseClient.CvProfileSummaryRecord(
                        "profile2", "supa--globex-lead-2", "Globex - Lead", "Globex Lead CV", "supa", false, "2026-07-19 10:00:00.000Z"
                )
        ));

        CvMcpTools.ListCvProfilesResponse response = cvMcpTools.listCvProfiles();

        assertThat(response.profiles()).hasSize(2);
        CvMcpTools.CvProfileSummary first = response.profiles().get(0);
        assertThat(first.profileId()).isEqualTo("profile1");
        assertThat(first.slug()).isEqualTo("classic--acme-dev-1");
        assertThat(first.label()).isEqualTo("Acme - Dev");
        assertThat(first.profileName()).isEqualTo("Acme Dev CV");
        assertThat(first.templateId()).isEqualTo("classic");
        assertThat(first.publicProfile()).isTrue();
        assertThat(first.updatedAt()).isEqualTo("2026-07-20 10:00:00.000Z");
        assertThat(first.frontendUrl()).isEqualTo("https://resumate.app/classic--acme-dev-1");
        assertThat(response.profiles().get(1).frontendUrl()).isEqualTo("https://resumate.app/supa--globex-lead-2");
        verify(pocketBaseClient).listCvProfilesForUser("userId");
    }

    @Test
    void listCvProfiles_returnsEmptyList_whenUserHasNoProfiles() {
        setAuthentication(new AiTokenPrincipal("tokenId", "userId", "label"));
        when(pocketBaseClient.listCvProfilesForUser("userId")).thenReturn(List.of());

        CvMcpTools.ListCvProfilesResponse response = cvMcpTools.listCvProfiles();

        assertThat(response.profiles()).isEmpty();
    }

    @Test
    void listCvProfiles_scopesToAuthenticatedPrincipal() {
        setAuthentication(new TestMcpPrincipal("oauth-user", "claude.ai", "OAUTH"));
        when(pocketBaseClient.listCvProfilesForUser("oauth-user")).thenReturn(List.of(
                new PocketBaseClient.CvProfileSummaryRecord(
                        "profile1", "classic--slug", "Label", "Name", "classic", true, "2026-07-20 10:00:00.000Z"
                )
        ));

        CvMcpTools.ListCvProfilesResponse response = cvMcpTools.listCvProfiles();

        assertThat(response.profiles()).hasSize(1);
        verify(pocketBaseClient).listCvProfilesForUser("oauth-user");
    }

    @Test
    void listCvProfiles_throws_whenNoAuthentication() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> cvMcpTools.listCvProfiles())
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Authenticated MCP principal is required.");
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
                        new PocketBaseClient.ExtraFieldDescriptor("featuredProjectIds", "Featured projects", "multi_select", false, "Featured projects.", "projects", List.of())
                ))
        ));
        when(pocketBaseClient.createTailoredProfile(eq("userId"), any(CreateProfilePayload.class)))
                .thenReturn(new CreatedProfileRecord("id", "slug"));

        CvMcpTools.CreateTailoredCvProfileRequest request = new CvMcpTools.CreateTailoredCvProfileRequest(
                "Acme - CV", "CV", "Job", "supa", "Summary",
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                Map.of("featuredProjectIds", List.of("proj1"))
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
    }
    private record TestMcpPrincipal(String userId, String label, String authSource) implements McpPrincipal {
        @Override
        public String getName() {
            return label;
        }
    }

}
