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

    @Tool(description = "List the templates allowed for the authenticated delegated AI token.")
    public ListTemplatesResponse listTemplates() {
        AiTokenPrincipal principal = currentPrincipal();
        return new ListTemplatesResponse(pocketBaseClient.resolveAllowedTemplates(principal.allowedTemplatesList()));
    }

    @Tool(description = "Load the authenticated user's reusable CV material including identity, skills, jobs, projects, achievements, degrees, and hobbies.")
    public ProfileMaterialBundle listProfileMaterial() {
        return pocketBaseClient.loadProfileMaterial(currentPrincipal().userId());
    }

    @Tool(description = "Create a tailored public CV profile for a pasted job listing and selected owner-scoped records.")
    public CreateTailoredCvProfileResponse createTailoredCvProfile(CreateTailoredCvProfileRequest request) {
        AiTokenPrincipal principal = currentPrincipal();
        requireProfileCreationQuota(principal);

        String templateId = resolveTemplateId(principal, request.templateId());
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

        pocketBaseClient.markTokenUsed(principal.tokenId(), principal.profileCreatesCount() + 1);

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

    private void requireProfileCreationQuota(AiTokenPrincipal principal) {
        if (principal.maxProfileCreates() != null && principal.profileCreatesCount() >= principal.maxProfileCreates()) {
            throw new IllegalArgumentException("AI token profile creation quota exceeded.");
        }
    }

    private String resolveTemplateId(AiTokenPrincipal principal, String requestedTemplateId) {
        List<String> allowedTemplates = principal.allowedTemplatesList();
        if (allowedTemplates.isEmpty()) {
            throw new IllegalArgumentException("AI token has no allowed templates.");
        }

        if (!principal.canChooseTemplate()) {
            return allowedTemplates.get(0);
        }

        if (!StringUtils.hasText(requestedTemplateId)) {
            throw new IllegalArgumentException("templateId is required when the token allows template choice.");
        }

        if (!allowedTemplates.contains(requestedTemplateId)) {
            throw new IllegalArgumentException("Requested template is not allowed for this token.");
        }

        return requestedTemplateId;
    }

    private AiTokenPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AiTokenPrincipal principal)) {
            throw new IllegalStateException("Authenticated AI token principal is required.");
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
