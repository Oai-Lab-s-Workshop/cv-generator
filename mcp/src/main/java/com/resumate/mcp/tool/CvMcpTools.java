package com.resumate.mcp.tool;

import com.resumate.mcp.config.FrontendProperties;
import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.security.McpPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.service.PocketBaseClient.CreateProfilePayload;
import com.resumate.mcp.service.PocketBaseClient.CreatedProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.ProfileMaterialBundle;
import com.resumate.mcp.service.PocketBaseClient.TemplateDescriptor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class CvMcpTools {

    private static final String RESUMATE_MCP_PURPOSE = "Resumate MCP creates tailored public CV/resume profiles from the authenticated user's existing data and returns a shareable frontend URL. Do not invent template ids or record ids.";

    private static final String CREATE_PROFILE_WORKFLOW = "Workflow for tailoring requests: call listTemplates, choose one returned template id, call listProfileMaterial, select only returned user-owned record ids, then call createTailoredCvProfile with label, templateId, professionalSummary, selected id arrays, and supported templateExtra fields.";

    private final PocketBaseClient pocketBaseClient;
    private final FrontendProperties frontendProperties;

    public CvMcpTools(PocketBaseClient pocketBaseClient, FrontendProperties frontendProperties) {
        this.pocketBaseClient = pocketBaseClient;
        this.frontendProperties = frontendProperties;
    }

    @Tool(description = RESUMATE_MCP_PURPOSE + " Call this before creating a tailored profile. Use one returned template.id exactly as createTailoredCvProfile.templateId, and inspect extraSchema before sending templateExtra.")
    public ListTemplatesResponse listTemplates() {
        currentPrincipal();
        return new ListTemplatesResponse(pocketBaseClient.resolveAvailableTemplates());
    }

    @Tool(description = "Return the MCP API key identity currently authenticated for this session, including the resolved PocketBase user id. Use this only when you need to verify which user/API key context is active before using the Resumate resume tools.")
    public AuthenticatedPrincipalResponse whoAmI() {
        McpPrincipal principal = currentPrincipal();
        AiTokenPrincipal aiTokenPrincipal = principal instanceof AiTokenPrincipal apiKeyPrincipal ? apiKeyPrincipal : null;
        return new AuthenticatedPrincipalResponse(
                aiTokenPrincipal == null ? null : aiTokenPrincipal.tokenId(),
                principal.userId(),
                principal.label(),
                aiTokenPrincipal == null ? null : aiTokenPrincipal.tokenPrefix(),
                principal.authSource()
        );
    }

    @Tool(description = RESUMATE_MCP_PURPOSE + " Call this before creating a tailored profile. Only pass ids returned by this tool in skillIds, jobIds, projectIds, achievementIds, degreeIds, and hobbyIds.")
    public ProfileMaterialBundle listProfileMaterial() {
        return pocketBaseClient.loadProfileMaterial(currentPrincipal().userId());
    }

    @Tool(description = RESUMATE_MCP_PURPOSE + " Use this final step when the user asks to create, craft, tailor, adapt, optimize, or customize a resume for a role. " + CREATE_PROFILE_WORKFLOW + " Always include a non-empty label; the server does not generate it. Choose a concise saved-resume label such as 'Acme - Senior Backend Engineer'. If validation fails, fix the missing or invalid field and retry instead of repeating the same invalid call.")
    public CreateTailoredCvProfileResponse createTailoredCvProfile(CreateTailoredCvProfileRequest request) {
        McpPrincipal principal = currentPrincipal();
        if (request == null) {
            throw new IllegalArgumentException("createTailoredCvProfile request is required. Retry createTailoredCvProfile with label, templateId, professionalSummary, selected record id arrays, and any supported templateExtra fields.");
        }

        String label = validateLabel(request.label());
        String profileName = StringUtils.hasText(request.profileName()) ? request.profileName() : label;
        TemplateDescriptor template = resolveTemplate(request.templateId());
        String templateId = template.id();
        validateOwnedSelections(principal.userId(), request);
        Map<String, Object> templateExtra = validateTemplateExtra(principal.userId(), template, request.templateExtra());

        CreatedProfileRecord created = pocketBaseClient.createTailoredProfile(
                principal.userId(),
                new CreateProfilePayload(
                        label,
                        profileName,
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
            throw new IllegalArgumentException("label is required. Retry createTailoredCvProfile with a non-empty label, usually '<company> - <role>'.");
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
            throw new IllegalArgumentException("templateId is required. Call listTemplates, choose one returned template id, then retry createTailoredCvProfile with that value as templateId.");
        }

        return pocketBaseClient.resolveAvailableTemplates().stream()
                .filter(template -> template.id().equals(requestedTemplateId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Requested template is not supported. Call listTemplates and retry createTailoredCvProfile with one of the returned template ids."));
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
                throw new IllegalArgumentException("Unsupported templateExtra field: " + entry.getKey() + ". Call listTemplates and only include fields listed in the selected template's extraSchema.");
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
            default -> throw new IllegalArgumentException("Unsupported templateExtra field type: " + field.type() + ". Call listTemplates and retry createTailoredCvProfile using only supported extraSchema field types.");
        };
    }

    private String validateStringValue(PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        if (value instanceof String stringValue) {
            return stringValue;
        }

        throw new IllegalArgumentException("templateExtra." + field.id() + " must be a string. Retry createTailoredCvProfile with templateExtra." + field.id() + " as a string value.");
    }

    private Boolean validateBooleanValue(PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        throw new IllegalArgumentException("templateExtra." + field.id() + " must be a boolean. Retry createTailoredCvProfile with templateExtra." + field.id() + " as true or false.");
    }

    private String validateSelectValue(PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        String stringValue = validateStringValue(field, value);
        if (field.options() == null || field.options().isEmpty() || field.options().contains(stringValue)) {
            return stringValue;
        }

        throw new IllegalArgumentException("templateExtra." + field.id() + " must be one of the supported options: " + field.options() + ". Retry createTailoredCvProfile with a supported option from the selected template's extraSchema.");
    }

    private List<String> validateMultiSelectValue(String userId, PocketBaseClient.ExtraFieldDescriptor field, Object value) {
        if (!(value instanceof List<?> rawValues)) {
            throw new IllegalArgumentException("templateExtra." + field.id() + " must be a string array. Retry createTailoredCvProfile with templateExtra." + field.id() + " as an array of string ids from listProfileMaterial.");
        }

        List<String> ids = rawValues.stream()
                .map(item -> {
                    if (item instanceof String stringValue) {
                        return stringValue;
                    }
                    throw new IllegalArgumentException("templateExtra." + field.id() + " must be a string array. Retry createTailoredCvProfile with templateExtra." + field.id() + " as an array of string ids from listProfileMaterial.");
                })
                .toList();

        if (StringUtils.hasText(field.source())) {
            pocketBaseClient.validateOwnedRecordIds(field.source(), userId, ids);
        }

        return ids;
    }

    private McpPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof McpPrincipal principal)) {
            throw new IllegalStateException("Authenticated MCP principal is required.");
        }

        return principal;
    }

    private String frontendBaseUrl() {
        String baseUrl = frontendProperties.baseUrl();
        String normalizedBaseUrl = Objects.requireNonNullElse(baseUrl, "");
        if (!normalizedBaseUrl.isBlank() && !normalizedBaseUrl.contains("://")) {
            normalizedBaseUrl = "https://" + normalizedBaseUrl;
        }
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
            String tokenPrefix,
            String authSource
    ) {
    }

    public record CreateTailoredCvProfileRequest(
            @ToolParam(description = "Required non-empty saved resume label chosen by the agent, usually '<company> - <role>'.")
            String label,
            @ToolParam(required = false, description = "Optional display name for the tailored CV profile. Defaults to label when omitted or blank.")
            String profileName,
            @ToolParam(required = false, description = "Optional source job listing or role description used to tailor the resume.")
            String jobListing,
            @ToolParam(description = "Required template id. Must exactly match one template.id returned by listTemplates.")
            String templateId,
            @ToolParam(required = false, description = "Role-focused professional summary for this tailored profile.")
            String professionalSummary,
            @ToolParam(required = false, description = "Skill record ids selected from listProfileMaterial. Do not invent ids.")
            List<String> skillIds,
            @ToolParam(required = false, description = "Job record ids selected from listProfileMaterial. Do not invent ids.")
            List<String> jobIds,
            @ToolParam(required = false, description = "Project record ids selected from listProfileMaterial. Do not invent ids.")
            List<String> projectIds,
            @ToolParam(required = false, description = "Achievement record ids selected from listProfileMaterial. Do not invent ids.")
            List<String> achievementIds,
            @ToolParam(required = false, description = "Degree record ids selected from listProfileMaterial. Do not invent ids.")
            List<String> degreeIds,
            @ToolParam(required = false, description = "Hobby record ids selected from listProfileMaterial. Do not invent ids.")
            List<String> hobbyIds,
            @ToolParam(required = false, description = "Template-specific values. Only include fields listed in the selected template's extraSchema from listTemplates.")
            Map<String, Object> templateExtra
    ) {
    }

    public record CreateTailoredCvProfileResponse(String profileId, String slug, String frontendUrl) {
    }
}
