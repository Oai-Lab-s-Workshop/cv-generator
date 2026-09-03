package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.dto.MaterialResponse;
import com.resumate.materialmcp.security.McpPrincipal;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** MCP tools for creating and updating the authenticated user's CV materials. */
@Component
public class MaterialMcpTools {
    private final MaterialPocketBaseClient pocketBaseClient;
    private final FrontendProperties frontendProperties;

    public MaterialMcpTools(MaterialPocketBaseClient pocketBaseClient, FrontendProperties frontendProperties) {
        this.pocketBaseClient = pocketBaseClient;
        this.frontendProperties = frontendProperties;
    }

    @Tool(description = "Create an authentic project for the authenticated user. Requires explicit user confirmation. Never create material tailored to a job listing.")
    public MaterialResponse.ProjectResponse createProject(MaterialRequest.CreateProjectRequest request) {
        String userId = currentUserId();
        var data = requireData(request, "project").data();
        Map<String, Object> payload = projectPayload(data);
        safety(request.userConfirmed(), payload, "project", "create");
        validateProjectRelations(userId, data);
        return projectResponse(pocketBaseClient.createProject(userId, payload));
    }

    @Tool(description = "Update an authentic project owned by the authenticated user. Requires explicit user confirmation. Never tailor material to a job listing.")
    public MaterialResponse.ProjectResponse updateProject(
            @ToolParam(description = "Project record id owned by the authenticated user.") String id,
            MaterialRequest.CreateProjectRequest request) {
        String userId = currentUserId();
        var data = requireData(request, "project").data();
        Map<String, Object> payload = projectPayload(data);
        safety(request.userConfirmed(), payload, "project", "update");
        pocketBaseClient.validateOwnedRecordId("projects", userId, id);
        validateProjectRelations(userId, data);
        return projectResponse(pocketBaseClient.updateProject(id, payload));
    }

    @Tool(description = "Create an authentic achievement for the authenticated user after explicit user confirmation.")
    public MaterialResponse.AchievementResponse createAchievement(MaterialRequest.CreateAchievementRequest request) {
        String userId = currentUserId(); var data = requireData(request, "achievement").data();
        Map<String, Object> payload = data("title", data.title(), "description", data.description(), "sortOrder", data.sortOrder());
        safety(request.userConfirmed(), payload, "achievement", "create");
        return achievementResponse(pocketBaseClient.createAchievement(userId, payload));
    }

    @Tool(description = "Update an achievement owned by the authenticated user after explicit user confirmation.")
    public MaterialResponse.AchievementResponse updateAchievement(@ToolParam(description = "Achievement record id owned by the authenticated user.") String id, MaterialRequest.CreateAchievementRequest request) {
        String userId = currentUserId(); var data = requireData(request, "achievement").data();
        Map<String, Object> payload = data("title", data.title(), "description", data.description(), "sortOrder", data.sortOrder());
        safety(request.userConfirmed(), payload, "achievement", "update"); pocketBaseClient.validateOwnedRecordId("achievements", userId, id);
        return achievementResponse(pocketBaseClient.updateAchievement(id, payload));
    }

    @Tool(description = "Create an authentic skill for the authenticated user after explicit user confirmation.")
    public MaterialResponse.SkillResponse createSkill(MaterialRequest.CreateSkillRequest request) {
        String userId = currentUserId(); var data = requireData(request, "skill").data();
        Map<String, Object> payload = data("name", data.name(), "category", data.category(), "type", data.type(), "level", data.level(), "sortOrder", data.sortOrder());
        safety(request.userConfirmed(), payload, "skill", "create"); return skillResponse(pocketBaseClient.createSkill(userId, payload));
    }

    @Tool(description = "Update a skill owned by the authenticated user after explicit user confirmation.")
    public MaterialResponse.SkillResponse updateSkill(@ToolParam(description = "Skill record id owned by the authenticated user.") String id, MaterialRequest.CreateSkillRequest request) {
        String userId = currentUserId(); var data = requireData(request, "skill").data();
        Map<String, Object> payload = data("name", data.name(), "category", data.category(), "type", data.type(), "level", data.level(), "sortOrder", data.sortOrder());
        safety(request.userConfirmed(), payload, "skill", "update"); pocketBaseClient.validateOwnedRecordId("skills", userId, id);
        return skillResponse(pocketBaseClient.updateSkill(id, payload));
    }

    @Tool(description = "Create an authentic job for the authenticated user. Validate only user-owned relation ids and require explicit confirmation.")
    public MaterialResponse.JobResponse createJob(MaterialRequest.CreateJobRequest request) {
        String userId = currentUserId(); var data = requireData(request, "job").data(); Map<String, Object> payload = jobPayload(data);
        safety(request.userConfirmed(), payload, "job", "create"); validateJobRelations(userId, data);
        return jobResponse(pocketBaseClient.createJob(userId, payload));
    }

    @Tool(description = "Update a job owned by the authenticated user. Validate only user-owned relation ids and require explicit confirmation.")
    public MaterialResponse.JobResponse updateJob(@ToolParam(description = "Job record id owned by the authenticated user.") String id, MaterialRequest.CreateJobRequest request) {
        String userId = currentUserId(); var data = requireData(request, "job").data(); Map<String, Object> payload = jobPayload(data);
        safety(request.userConfirmed(), payload, "job", "update"); pocketBaseClient.validateOwnedRecordId("jobs", userId, id); validateJobRelations(userId, data);
        return jobResponse(pocketBaseClient.updateJob(id, payload));
    }

    @Tool(description = "Create an authentic degree for the authenticated user after explicit user confirmation.")
    public MaterialResponse.DegreeResponse createDegree(MaterialRequest.CreateDegreeRequest request) {
        String userId = currentUserId(); var data = requireData(request, "degree").data(); Map<String, Object> payload = degreePayload(data);
        safety(request.userConfirmed(), payload, "degree", "create"); return degreeResponse(pocketBaseClient.createDegree(userId, payload));
    }

    @Tool(description = "Update a degree owned by the authenticated user after explicit user confirmation.")
    public MaterialResponse.DegreeResponse updateDegree(@ToolParam(description = "Degree record id owned by the authenticated user.") String id, MaterialRequest.CreateDegreeRequest request) {
        String userId = currentUserId(); var data = requireData(request, "degree").data(); Map<String, Object> payload = degreePayload(data);
        safety(request.userConfirmed(), payload, "degree", "update"); pocketBaseClient.validateOwnedRecordId("degrees", userId, id); return degreeResponse(pocketBaseClient.updateDegree(id, payload));
    }

    @Tool(description = "Create an authentic hobby for the authenticated user after explicit user confirmation.")
    public MaterialResponse.HobbyResponse createHobby(MaterialRequest.CreateHobbyRequest request) {
        String userId = currentUserId(); var data = requireData(request, "hobby").data(); Map<String, Object> payload = hobbyPayload(data);
        safety(request.userConfirmed(), payload, "hobby", "create"); return hobbyResponse(pocketBaseClient.createHobby(userId, payload));
    }

    @Tool(description = "Update a hobby owned by the authenticated user after explicit user confirmation.")
    public MaterialResponse.HobbyResponse updateHobby(@ToolParam(description = "Hobby record id owned by the authenticated user.") String id, MaterialRequest.CreateHobbyRequest request) {
        String userId = currentUserId(); var data = requireData(request, "hobby").data(); Map<String, Object> payload = hobbyPayload(data);
        safety(request.userConfirmed(), payload, "hobby", "update"); pocketBaseClient.validateOwnedRecordId("hobbies", userId, id); return hobbyResponse(pocketBaseClient.updateHobby(id, payload));
    }

    private void validateProjectRelations(String userId, MaterialRequest.ProjectData data) {
        if (data.file() != null) pocketBaseClient.validateOwnedRecordId("files", userId, data.file());
        pocketBaseClient.validateOwnedRecordIds("achievements", userId, data.achievements());
    }

    private void validateJobRelations(String userId, MaterialRequest.JobData data) {
        pocketBaseClient.validateOwnedRecordIds("skills", userId, data.skills());
        pocketBaseClient.validateOwnedRecordIds("projects", userId, data.projects());
        pocketBaseClient.validateOwnedRecordIds("achievements", userId, data.achievements());
    }

    private String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof McpPrincipal principal)
                || principal.userId() == null || principal.userId().isBlank()) {
            throw new IllegalStateException("Authenticated API token user is required.");
        }
        return principal.userId();
    }

    private <T> T requireData(T request, String type) {
        if (request == null) throw new IllegalArgumentException(type + " request is required.");
        return request;
    }

    private void safety(boolean confirmed, Map<String, Object> fields, String type, String action) {
        if (!confirmed) throw new IllegalArgumentException("User confirmation is required to " + action + " " + type + ". Set userConfirmed=true.");
        for (Object field : fields.values()) {
            String value = field instanceof String text ? text.toLowerCase() : "";
            if (value.contains("job listing") || value.contains("job description") || value.contains("tailor") || value.contains("specific opportunity") || value.contains("job posting") || value.contains("job requirement") || value.contains("job ad") || value.contains("hiring for")) {
                String verb = action.substring(0, 1).toUpperCase() + action.substring(1);
                throw new IllegalArgumentException(verb + " material tailored to job listings is not allowed. " + verb + " authentic " + type + " based on your actual experience.");
            }
        }
    }

    private Map<String, Object> projectPayload(MaterialRequest.ProjectData data) { return data("name", data.name(), "description", data.description(), "url", data.url(), "date", data.date(), "picture", data.picture(), "type", data.type(), "file", data.file(), "achievements", data.achievements(), "sortOrder", data.sortOrder()); }
    private Map<String, Object> jobPayload(MaterialRequest.JobData data) { return data("label", data.label(), "company", data.company(), "position", data.position(), "startDate", data.startDate(), "endDate", data.endDate(), "responsibilities", data.responsibilities(), "location", data.location(), "sortOrder", data.sortOrder(), "type", data.type(), "skills", data.skills(), "projects", data.projects(), "achievements", data.achievements()); }
    private Map<String, Object> degreePayload(MaterialRequest.DegreeData data) { return data("title", data.title(), "school", data.school(), "year", data.year(), "level", data.level(), "sortOrder", data.sortOrder()); }
    private Map<String, Object> hobbyPayload(MaterialRequest.HobbyData data) { return data("name", data.name(), "description", data.description(), "sortOrder", data.sortOrder()); }
    private Map<String, Object> data(Object... values) { Map<String, Object> result = new LinkedHashMap<>(); for (int i = 0; i < values.length; i += 2) result.put((String) values[i], values[i + 1]); return result; }
    private MaterialResponse.ProjectResponse projectResponse(Map<String, Object> result) { return new MaterialResponse.ProjectResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/projects/" + result.get("slug")); }
    private MaterialResponse.AchievementResponse achievementResponse(Map<String, Object> result) { return new MaterialResponse.AchievementResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/achievements/" + result.get("slug")); }
    private MaterialResponse.SkillResponse skillResponse(Map<String, Object> result) { return new MaterialResponse.SkillResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/skills/" + result.get("slug")); }
    private MaterialResponse.JobResponse jobResponse(Map<String, Object> result) { return new MaterialResponse.JobResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/jobs/" + result.get("slug")); }
    private MaterialResponse.DegreeResponse degreeResponse(Map<String, Object> result) { return new MaterialResponse.DegreeResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/degrees/" + result.get("slug")); }
    private MaterialResponse.HobbyResponse hobbyResponse(Map<String, Object> result) { return new MaterialResponse.HobbyResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/hobbies/" + result.get("slug")); }
}
