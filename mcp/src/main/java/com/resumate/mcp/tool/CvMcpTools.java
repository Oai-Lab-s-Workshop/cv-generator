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
import java.util.LinkedHashMap;
import java.util.Map;
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

    @Tool(description = "Create a tailored public CV/resume profile for a specific job listing when the user asks to craft, tailor, adapt, or customize their resume for that role. Selects from the user's existing records and an allowed template to produce a shareable profile URL. The label is required and should be chosen by the agent to identify the saved resume clearly, such as company and role; the server stores the explicit label and does not generate it.")
    public CreateTailoredCvProfileResponse createTailoredCvProfile(CreateTailoredCvProfileRequest request) {
        AiTokenPrincipal principal = currentPrincipal();
        String label = validateLabel(request.label());
        TemplateDescriptor template = resolveTemplate(request.templateId());
        String templateId = template.id();
        validateOwnedSelections(principal.userId(), request);
        Map<String, Object> templateExtra = validateTemplateExtra(principal.userId(), template, request.templateExtra());

        CreatedProfileRecord created = pocketBaseClient.createTailoredProfile(
                principal.userId(),
                new CreateProfilePayload(
                        label,
                        request.profileName(),
                        templateId,
                        request.professionalSummary(),
                        request.skillIds(),
                        request.jobIds(),
                        request.projectIds(),
                        request.achievementIds(),
                        request.degreeIds(),
                        request.hobbyIds(),
                        templateExtra.isEmpty() ? Map.of() : Map.of(templateId, templateExtra)
                )
        );

        return new CreateTailoredCvProfileResponse(
                created.id(),
                created.slug(),
                frontendBaseUrl() + "/" + created.slug()
        );
    }

    private String validateLabel(String label) {
        if (!StringUtils.hasText(label)) {
            throw new IllegalArgumentException("label is required.");
        }

        return label;
    }

    private void validateOwnedSelections(String userId, CreateTailoredCvProfileRequest request) {
        pocketBaseClient.validateOwnedRecordIds("skills", userId, request.skillIds());
        pocketBaseClient.validateOwnedRecordIds("jobs", userId, request.jobIds());
        pocketBaseClient.validateOwnedRecordIds("projects", userId, request.projectIds());
        pocketBaseClient.validateOwnedRecordIds("achievements", userId, request.achievementIds());
        pocketBaseClient.validateOwnedRecordIds("degrees", userId, request.degreeIds());
        pocketBaseClient.validateOwnedRecordIds("hobbies", userId, request.hobbyIds());
    }

    private TemplateDescriptor resolveTemplate(String requestedTemplateId) {
        if (!StringUtils.hasText(requestedTemplateId)) {
            throw new IllegalArgumentException("templateId is required.");
        }

        return pocketBaseClient.resolveAvailableTemplates().stream()
                .filter(template -> template.id().equals(requestedTemplateId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Requested template is not supported."));
    }

    private Map<String, Object> validateTemplateExtra(String userId, TemplateDescriptor template, Map<String, Object> templateExtra) {
        if (templateExtra == null || templateExtra.isEmpty()) {
            return Map.of();
        }

        Map<String, PocketBaseClient.ExtraFieldDescriptor> fieldsById = new LinkedHashMap<>();
        for (PocketBaseClient.ExtraFieldDescriptor field : template.extraSchema()) {
            fieldsById.put(field.id(), field);
        }

        Map<String, Object> validated = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : templateExtra.entrySet()) {
            PocketBaseClient.ExtraFieldDescriptor field = fieldsById.get(entry.getKey());
            if (field == null) {
                throw new IllegalArgumentException("Unsupported templateExtra field: " + entry.getKey());
            }

            validated.put(field.id(), validateTemplateExtraValue(userId, field, entry.getValue()));
        }

        return validated;
    }

    private Object validateTemplateExtraValue(String userId, PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        return switch (field.type()) {
            case "text", "textarea", "color" -> validateStringValue(field, value);
            case "boolean" -> validateBooleanValue(field, value);
            case "select" -> validateSelectValue(field, value);
            case "multi_select" -> validateMultiSelectValue(userId, field, value);
            default -> throw new IllegalArgumentException("Unsupported templateExtra field type: " + field.type());
        };
    }

    private String validateStringValue(PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        if (value instanceof String stringValue) {
            return stringValue;
        }

        throw new IllegalArgumentException("templateExtra." + field.id() + " must be a string.");
    }

    private Boolean validateBooleanValue(PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        throw new IllegalArgumentException("templateExtra." + field.id() + " must be a boolean.");
    }

    private String validateSelectValue(PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        String stringValue = validateStringValue(field, value);
        if (field.options() == null || field.options().isEmpty() || field.options().contains(stringValue)) {
            return stringValue;
        }

        throw new IllegalArgumentException("templateExtra." + field.id() + " must be one of the supported options.");
    }

    private List<String> validateMultiSelectValue(String userId, PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        if (!(value instanceof List<?> rawValues)) {
            throw new IllegalArgumentException("templateExtra." + field.id() + " must be a string array.");
        }

        List<String> ids = rawValues.stream()
                .map(item -> {
                    if (item instanceof String stringValue) {
                        return stringValue;
                    }
                    throw new IllegalArgumentException("templateExtra." + field.id() + " must be a string array.");
                })
                .toList();

        if (StringUtils.hasText(field.source())) {
            pocketBaseClient.validateOwnedRecordIds(field.source(), userId, ids);
        }

        return ids;
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
            String label,
            String profileName,
            String jobListing,
            String templateId,
            String professionalSummary,
            List<String> skillIds,
            List<String> jobIds,
            List<String> projectIds,
            List<String> achievementIds,
            List<String> degreeIds,
            List<String> hobbyIds,
            Map<String, Object> templateExtra
    ) {
    }

    public record CreateTailoredCvProfileResponse(String profileId, String slug, String frontendUrl) {
    }
}
