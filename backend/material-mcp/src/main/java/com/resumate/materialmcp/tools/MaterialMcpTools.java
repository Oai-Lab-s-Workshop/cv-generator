package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.dto.MaterialResponse;
import com.resumate.materialmcp.security.AiTokenPrincipal;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** REST endpoints for creating and updating a caller's CV materials. */
@Service
@RestController
@RequestMapping("/api/materials")
public class MaterialMcpTools {
    private final MaterialPocketBaseClient pocketBaseClient;
    private final FrontendProperties frontendProperties;

    public MaterialMcpTools(MaterialPocketBaseClient pocketBaseClient, FrontendProperties frontendProperties) {
        this.pocketBaseClient = pocketBaseClient;
        this.frontendProperties = frontendProperties;
    }

    private String effectiveUserId(String requestedUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof AiTokenPrincipal principal)
                || principal.userId() == null || principal.userId().isBlank()) {
            throw new IllegalStateException("Authenticated API token user is required.");
        }
        if (requestedUserId != null && !requestedUserId.isBlank() && !principal.userId().equals(requestedUserId)) {
            throw new IllegalArgumentException("Request userId does not match the authenticated API token user.");
        }
        return principal.userId();
    }

    private void safety(boolean confirmed, Map<String, Object> fields, String type, String action) {
        if (!confirmed) throw new IllegalArgumentException("User confirmation is required to " + action + " " + type + ". Set userConfirmed=true.");
        for (Object field : fields.values()) {
            String value = field instanceof String text ? text.toLowerCase() : "";
            if (value.contains("job listing") || value.contains("job description") || value.contains("tailor")
                    || value.contains("specific opportunity") || value.contains("job posting") || value.contains("job requirement")
                    || value.contains("job ad") || value.contains("hiring for")) {
                String verb = action.substring(0, 1).toUpperCase() + action.substring(1);
                throw new IllegalArgumentException(verb + " material tailored to job listings is not allowed. " + verb + " authentic " + type + " based on your actual experience.");
            }
        }
    }

    private Map<String, Object> data(Object... values) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < values.length; i += 2) result.put((String) values[i], values[i + 1]);
        return result;
    }

    private MaterialResponse.ProjectResponse projectResponse(Map<String, Object> result) { return new MaterialResponse.ProjectResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/projects/" + result.get("slug")); }
    private MaterialResponse.AchievementResponse achievementResponse(Map<String, Object> result) { return new MaterialResponse.AchievementResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/achievements/" + result.get("slug")); }
    private MaterialResponse.SkillResponse skillResponse(Map<String, Object> result) { return new MaterialResponse.SkillResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/skills/" + result.get("slug")); }
    private MaterialResponse.JobResponse jobResponse(Map<String, Object> result) { return new MaterialResponse.JobResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/jobs/" + result.get("slug")); }
    private MaterialResponse.DegreeResponse degreeResponse(Map<String, Object> result) { return new MaterialResponse.DegreeResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/degrees/" + result.get("slug")); }
    private MaterialResponse.HobbyResponse hobbyResponse(Map<String, Object> result) { return new MaterialResponse.HobbyResponse((String) result.get("id"), (String) result.get("slug"), frontendProperties.baseUrl() + "/hobbies/" + result.get("slug")); }

    @PostMapping("/projects") public ResponseEntity<MaterialResponse.ProjectResponse> createProject(@RequestBody MaterialRequest.CreateProjectRequest request) { String user = effectiveUserId(request.userId()); var d = request.data(); Map<String,Object> payload=data("name",d.name(),"description",d.description(),"url",d.url(),"date",d.date(),"picture",d.picture(),"type",d.type(),"file",d.file(),"achievements",d.achievements(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(), payload,"project","create"); return ResponseEntity.ok(projectResponse(pocketBaseClient.createProject(user,payload))); }
    @PatchMapping("/projects/{id}") public ResponseEntity<MaterialResponse.ProjectResponse> updateProject(@PathVariable String id,@RequestBody MaterialRequest.CreateProjectRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("name",d.name(),"description",d.description(),"url",d.url(),"date",d.date(),"picture",d.picture(),"type",d.type(),"file",d.file(),"achievements",d.achievements(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"project","update"); pocketBaseClient.validateOwnedRecordId("projects",user,id); return ResponseEntity.ok(projectResponse(pocketBaseClient.updateProject(id,payload))); }

    @PostMapping("/achievements") public ResponseEntity<MaterialResponse.AchievementResponse> createAchievement(@RequestBody MaterialRequest.CreateAchievementRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("title",d.title(),"description",d.description(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"achievement","create"); return ResponseEntity.ok(achievementResponse(pocketBaseClient.createAchievement(user,payload))); }
    @PatchMapping("/achievements/{id}") public ResponseEntity<MaterialResponse.AchievementResponse> updateAchievement(@PathVariable String id,@RequestBody MaterialRequest.CreateAchievementRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("title",d.title(),"description",d.description(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"achievement","update"); pocketBaseClient.validateOwnedRecordId("achievements",user,id); return ResponseEntity.ok(achievementResponse(pocketBaseClient.updateAchievement(id,payload))); }

    @PostMapping("/skills") public ResponseEntity<MaterialResponse.SkillResponse> createSkill(@RequestBody MaterialRequest.CreateSkillRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("name",d.name(),"category",d.category(),"type",d.type(),"level",d.level(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"skill","create"); return ResponseEntity.ok(skillResponse(pocketBaseClient.createSkill(user,payload))); }
    @PatchMapping("/skills/{id}") public ResponseEntity<MaterialResponse.SkillResponse> updateSkill(@PathVariable String id,@RequestBody MaterialRequest.CreateSkillRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("name",d.name(),"category",d.category(),"type",d.type(),"level",d.level(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"skill","update"); pocketBaseClient.validateOwnedRecordId("skills",user,id); return ResponseEntity.ok(skillResponse(pocketBaseClient.updateSkill(id,payload))); }

    @PostMapping("/jobs") public ResponseEntity<MaterialResponse.JobResponse> createJob(@RequestBody MaterialRequest.CreateJobRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("label",d.label(),"company",d.company(),"position",d.position(),"startDate",d.startDate(),"endDate",d.endDate(),"responsibilities",d.responsibilities(),"location",d.location(),"sortOrder",d.sortOrder(),"type",d.type(),"skills",d.skills(),"projects",d.projects(),"achievements",d.achievements()); safety(request.userConfirmed(),payload,"job","create"); return ResponseEntity.ok(jobResponse(pocketBaseClient.createJob(user,payload))); }
    @PatchMapping("/jobs/{id}") public ResponseEntity<MaterialResponse.JobResponse> updateJob(@PathVariable String id,@RequestBody MaterialRequest.CreateJobRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("label",d.label(),"company",d.company(),"position",d.position(),"startDate",d.startDate(),"endDate",d.endDate(),"responsibilities",d.responsibilities(),"location",d.location(),"sortOrder",d.sortOrder(),"type",d.type(),"skills",d.skills(),"projects",d.projects(),"achievements",d.achievements()); safety(request.userConfirmed(),payload,"job","update"); pocketBaseClient.validateOwnedRecordId("jobs",user,id); return ResponseEntity.ok(jobResponse(pocketBaseClient.updateJob(id,payload))); }

    @PostMapping("/degrees") public ResponseEntity<MaterialResponse.DegreeResponse> createDegree(@RequestBody MaterialRequest.CreateDegreeRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("title",d.title(),"school",d.school(),"year",d.year(),"level",d.level(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"degree","create"); return ResponseEntity.ok(degreeResponse(pocketBaseClient.createDegree(user,payload))); }
    @PatchMapping("/degrees/{id}") public ResponseEntity<MaterialResponse.DegreeResponse> updateDegree(@PathVariable String id,@RequestBody MaterialRequest.CreateDegreeRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("title",d.title(),"school",d.school(),"year",d.year(),"level",d.level(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"degree","update"); pocketBaseClient.validateOwnedRecordId("degrees",user,id); return ResponseEntity.ok(degreeResponse(pocketBaseClient.updateDegree(id,payload))); }

    @PostMapping("/hobbies") public ResponseEntity<MaterialResponse.HobbyResponse> createHobby(@RequestBody MaterialRequest.CreateHobbyRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("name",d.name(),"description",d.description(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"hobby","create"); return ResponseEntity.ok(hobbyResponse(pocketBaseClient.createHobby(user,payload))); }
    @PatchMapping("/hobbies/{id}") public ResponseEntity<MaterialResponse.HobbyResponse> updateHobby(@PathVariable String id,@RequestBody MaterialRequest.CreateHobbyRequest request) { String user=effectiveUserId(request.userId()); var d=request.data(); Map<String,Object> payload=data("name",d.name(),"description",d.description(),"sortOrder",d.sortOrder()); safety(request.userConfirmed(),payload,"hobby","update"); pocketBaseClient.validateOwnedRecordId("hobbies",user,id); return ResponseEntity.ok(hobbyResponse(pocketBaseClient.updateHobby(id,payload))); }
}
