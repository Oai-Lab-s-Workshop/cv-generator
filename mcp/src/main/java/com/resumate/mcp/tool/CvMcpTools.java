package com.resumate.mcp.tool;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.CreateProfilePayload;
import com.resumate.mcp.service.PocketBaseClient.CreatedProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.ProfileMaterialBundle;
import com.resumate.mcp.service.PocketBaseClient.TemplateDescriptor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;

@Component
public class CvMcpTools {

    private final PocketBaseClient pocketBaseClient;
    private final FrontendProperties frontendProperties;

    public CvMcpTools(PocketBaseClient pocketBaseClient, FrontendProperties frontendProperties) {
        this.pocketBaseClient = pocketBaseClient;
        this.frontendProperties = frontendProperties;
    }

    @Tool(description = "List the CV/resume templates available to the authenticated user. Call this before creating a tailored profile to find out which templates the user is allowed to choose from.")
    public ListTemplatesResponse listTemplates() {
        currentPrincipal();
        return new ListTemplatesResponse(pocketBaseClient.resolveAvailableTemplates());
    }

    @Tool(description = "Return the MCP API key identity currently authenticated for this session, including the resolved PocketBase user id. Call this to verify which user the current API key maps to before listing profile material.")
    public AuthenticatedPrincipalResponse whoAmI() {
        AiTokenPrincipal principal = currentPrincipal();
        return new AuthenticatedPrincipalResponse(
                principal.tokenId(),
                principal.userId(),
                principal.label(),
                principal.tokenPrefix()
        );
    }

    @Tool(description = "Load the authenticated user's reusable CV/resume material including identity, skills, jobs, projects, achievements, degrees, and hobbies. Call this before creating a tailored profile to gather the user's existing records.")
    public ProfileMaterialBundle listProfileMaterial() {
        return pocketBaseClient.loadProfileMaterial(currentPrincipal().userId());
    }

    @Tool(description = "Create a tailored public CV/resume profile for a specific job listing when the user asks to craft, tailor, adapt, or customize their resume for that role. Selects from the user's existing records and an allowed template to produce a shareable profile URL.")
    public CreateTailoredCvProfileResponse createTailoredCvProfile(CreateTailoredCvProfileRequest request) {
        AiTokenPrincipal principal = currentPrincipal();
        String templateId = resolveTemplateId(request.templateId());
        validateOwnedSelections(principal.userId(), request);

        CreatedProfileRecord created = pocketBaseClient.createTailoredProfile(
                principal.userId(),
                new CreateProfilePayload(
                        request.profileName(),
                        templateId,
                        request.professionalSummary(),
                        request.skillIds(),
                        request.jobIds(),
                        request.projectIds(),
                        request.achievementIds(),
                        request.degreeIds(),
                        request.hobbyIds()
                )
        );

        return new CreateTailoredCvProfileResponse(
                created.id(),
                created.slug(),
                frontendBaseUrl() + "/" + created.slug()
        );
    }

    private void validateOwnedSelections(String userId, CreateTailoredCvProfileRequest request) {
        pocketBaseClient.validateOwnedRecordIds("skills", userId, request.skillIds());
        pocketBaseClient.validateOwnedRecordIds("jobs", userId, request.jobIds());
        pocketBaseClient.validateOwnedRecordIds("projects", userId, request.projectIds());
        pocketBaseClient.validateOwnedRecordIds("achievements", userId, request.achievementIds());
        pocketBaseClient.validateOwnedRecordIds("degrees", userId, request.degreeIds());
        pocketBaseClient.validateOwnedRecordIds("hobbies", userId, request.hobbyIds());
    }

    private String resolveTemplateId(String requestedTemplateId) {
        if (!StringUtils.hasText(requestedTemplateId)) {
            throw new IllegalArgumentException("templateId is required.");
        }

        List<String> supportedTemplateIds = pocketBaseClient.resolveAvailableTemplates().stream()
                .map(TemplateDescriptor::id)
                .toList();
        if (!supportedTemplateIds.contains(requestedTemplateId)) {
            throw new IllegalArgumentException("Requested template is not supported.");
        }

        return requestedTemplateId;
    }

    private AiTokenPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AiTokenPrincipal principal)) {
            throw new IllegalStateException("Authenticated API key principal is required.");
        }

        return principal;
    }

    private String frontendBaseUrl() {
        String baseUrl = frontendProperties.baseUrl();
        String normalizedBaseUrl = Objects.requireNonNullElse(baseUrl, "");
        return normalizedBaseUrl.endsWith("/")
                ? normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1)
                : normalizedBaseUrl;
    }

    public record ListTemplatesResponse(List<TemplateDescriptor> templates) {
    }

    public record AuthenticatedPrincipalResponse(
            String tokenId,
            String userId,
            String label,
            String tokenPrefix
    ) {
    }

    public record CreateTailoredCvProfileRequest(
            String profileName,
            String jobListing,
            String templateId,
            String professionalSummary,
            List<String> skillIds,
            List<String> jobIds,
            List<String> projectIds,
            List<String> achievementIds,
            List<String> degreeIds,
            List<String> hobbyIds
    ) {
    }

    public record CreateTailoredCvProfileResponse(String profileId, String slug, String frontendUrl) {
    }
}
