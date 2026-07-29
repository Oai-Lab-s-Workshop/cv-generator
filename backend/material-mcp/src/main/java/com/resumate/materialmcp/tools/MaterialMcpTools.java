package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.dto.MaterialResponse;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * MCP tools for material creation and management.
 */
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

    /**
     * Validates material safety requirements: user confirmation and job-listing reference detection.
     * @param userConfirmed Whether user confirmation was provided
     * @param fields Text fields to check for job-listing references
     * @param materialType The material type for error messages
     * @param action "create" or "update" for error messages
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateMaterialSafety(boolean userConfirmed, Map<String, String> fields, String materialType, String action) {
        if (!userConfirmed) {
            throw new IllegalArgumentException(
                    "User confirmation is required to " + action + " " + materialType + ". Set userConfirmed=true.");
        }
        
        // Check for job-listing reference patterns in all provided fields
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            String fieldValue = entry.getValue() != null ? entry.getValue().toLowerCase() : "";
            
            if (fieldValue.contains("job listing") || 
                fieldValue.contains("job description") ||
                fieldValue.contains("tailor") ||
                fieldValue.contains("specific opportunity") ||
                fieldValue.contains("job posting") ||
                fieldValue.contains("job requirement") ||
                fieldValue.contains("job ad") ||
                fieldValue.contains("hiring for")) {
                
                throw new IllegalArgumentException(
                        "" + action.substring(0, 1).toUpperCase() + action.substring(1) +
                        " material tailored to job listings is not allowed. " +
                        "" + action.substring(0, 1).toUpperCase() + action.substring(1) +
                        " authentic " + materialType + " based on your actual experience.");
            }
        }
    }

    /**
     * Validates project safety requirements.
     * @param request The project request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateProjectSafety(MaterialRequest.CreateProjectRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "description", request.data().description(),
                        "responsibilities", request.data().responsibilities(),
                        "outcomes", request.data().outcomes()
                ),
                "project",
                "create"
        );
    }

    /**
     * Validates project update safety requirements.
     * @param request The project request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateProjectUpdateSafety(MaterialRequest.CreateProjectRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "description", request.data().description(),
                        "responsibilities", request.data().responsibilities(),
                        "outcomes", request.data().outcomes()
                ),
                "project",
                "update"
        );
    }

    /**
     * Validates achievement safety requirements.
     * @param request The achievement request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateAchievementSafety(MaterialRequest.CreateAchievementRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description()
                ),
                "achievement",
                "create"
        );
    }

    /**
     * Validates achievement update safety requirements.
     * @param request The achievement request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateAchievementUpdateSafety(MaterialRequest.CreateAchievementRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description()
                ),
                "achievement",
                "update"
        );
    }

    /**
     * Validates skill safety requirements.
     * @param request The skill request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateSkillSafety(MaterialRequest.CreateSkillRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "name", request.data().name(),
                        "category", request.data().category()
                ),
                "skill",
                "create"
        );
    }

    /**
     * Validates skill update safety requirements.
     * @param request The skill request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateSkillUpdateSafety(MaterialRequest.CreateSkillRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "name", request.data().name(),
                        "category", request.data().category()
                ),
                "skill",
                "update"
        );
    }

    /**
     * Validates job safety requirements.
     * @param request The job request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateJobSafety(MaterialRequest.CreateJobRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "responsibilities", request.data().responsibilities(),
                        "requirements", request.data().requirements()
                ),
                "job",
                "create"
        );
    }

    /**
     * Validates job update safety requirements.
     * @param request The job request
     * @throws IllegalArgumentException if safety validation fails
     */
    private void validateJobUpdateSafety(MaterialRequest.CreateJobRequest request) {
        validateMaterialSafety(
                request.userConfirmed(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "responsibilities", request.data().responsibilities(),
                        "requirements", request.data().requirements()
                ),
                "job",
                "update"
        );
    }

    /**
     * Creates a new project.
     * @param request The project creation request
     * @return The created project response
     * @throws IllegalArgumentException if user confirmation is missing or job-listing references are detected
     */
    @PostMapping("/projects")
    public ResponseEntity<MaterialResponse.ProjectResponse> createProject(@RequestBody MaterialRequest.CreateProjectRequest request) {
        validateProjectSafety(request);
        
        Map<String, Object> result = pocketBaseClient.createProject(
                request.userId(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "startDate", request.data().startDate(),
                        "endDate", request.data().endDate(),
                        "role", request.data().role(),
                        "technologies", request.data().technologies(),
                        "responsibilities", request.data().responsibilities(),
                        "outcomes", request.data().outcomes()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.ProjectResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/projects/" + result.get("slug")
        ));
    }

    /**
     * Updates an existing project after validating ownership.
     * @param projectId The project ID to update
     * @param request The project update request
     * @return The updated project response
     * @throws IllegalArgumentException if user confirmation is missing, job-listing references are detected, or ownership validation fails
     */
    @PatchMapping("/projects/{projectId}")
    public ResponseEntity<MaterialResponse.ProjectResponse> updateProject(@PathVariable String projectId, @RequestBody MaterialRequest.CreateProjectRequest request) {
        validateProjectUpdateSafety(request);
        
        // TODO: Implement ownership validation
        pocketBaseClient.validateOwnedRecordId("projects", request.userId(), projectId);
        
        Map<String, Object> result = pocketBaseClient.updateProject(
                projectId,
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "startDate", request.data().startDate(),
                        "endDate", request.data().endDate(),
                        "role", request.data().role(),
                        "technologies", request.data().technologies(),
                        "responsibilities", request.data().responsibilities(),
                        "outcomes", request.data().outcomes()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.ProjectResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/projects/" + result.get("slug")
        ));
    }

    /**
     * Creates a new achievement.
     * @param request The achievement creation request
     * @return The created achievement response
     * @throws IllegalArgumentException if user confirmation is missing or job-listing references are detected
     */
    @PostMapping("/achievements")
    public ResponseEntity<MaterialResponse.AchievementResponse> createAchievement(@RequestBody MaterialRequest.CreateAchievementRequest request) {
        validateAchievementSafety(request);
        
        Map<String, Object> result = pocketBaseClient.createAchievement(
                request.userId(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "date", request.data().date(),
                        "type", request.data().type(),
                        "issuer", request.data().issuer()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.AchievementResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/achievements/" + result.get("slug")
        ));
    }

    /**
     * Updates an existing achievement after validating ownership.
     * @param achievementId The achievement ID to update
     * @param request The achievement update request
     * @return The updated achievement response
     * @throws IllegalArgumentException if user confirmation is missing, job-listing references are detected, or ownership validation fails
     */
    @PatchMapping("/achievements/{achievementId}")
    public ResponseEntity<MaterialResponse.AchievementResponse> updateAchievement(@PathVariable String achievementId, @RequestBody MaterialRequest.CreateAchievementRequest request) {
        validateAchievementUpdateSafety(request);
        
        // TODO: Implement ownership validation
        pocketBaseClient.validateOwnedRecordId("achievements", request.userId(), achievementId);
        
        Map<String, Object> result = pocketBaseClient.updateAchievement(
                achievementId,
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "date", request.data().date(),
                        "type", request.data().type(),
                        "issuer", request.data().issuer()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.AchievementResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/achievements/" + result.get("slug")
        ));
    }

    /**
     * Creates a new skill.
     * @param request The skill creation request
     * @return The created skill response
     * @throws IllegalArgumentException if user confirmation is missing or job-listing references are detected
     */
    @PostMapping("/skills")
    public ResponseEntity<MaterialResponse.SkillResponse> createSkill(@RequestBody MaterialRequest.CreateSkillRequest request) {
        validateSkillSafety(request);
        
        Map<String, Object> result = pocketBaseClient.createSkill(
                request.userId(),
                Map.of(
                        "name", request.data().name(),
                        "level", request.data().level(),
                        "category", request.data().category(),
                        "yearsOfExperience", request.data().yearsOfExperience()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.SkillResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/skills/" + result.get("slug")
        ));
    }

    /**
     * Updates an existing skill after validating ownership.
     * @param skillId The skill ID to update
     * @param request The skill update request
     * @return The updated skill response
     * @throws IllegalArgumentException if user confirmation is missing, job-listing references are detected, or ownership validation fails
     */
    @PatchMapping("/skills/{skillId}")
    public ResponseEntity<MaterialResponse.SkillResponse> updateSkill(@PathVariable String skillId, @RequestBody MaterialRequest.CreateSkillRequest request) {
        validateSkillUpdateSafety(request);
        
        // TODO: Implement ownership validation
        pocketBaseClient.validateOwnedRecordId("skills", request.userId(), skillId);
        
        Map<String, Object> result = pocketBaseClient.updateSkill(
                skillId,
                Map.of(
                        "name", request.data().name(),
                        "level", request.data().level(),
                        "category", request.data().category(),
                        "yearsOfExperience", request.data().yearsOfExperience()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.SkillResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/skills/" + result.get("slug")
        ));
    }

    /**
     * Creates a new job.
     * @param request The job creation request
     * @return The created job response
     * @throws IllegalArgumentException if user confirmation is missing or job-listing references are detected
     */
    @PostMapping("/jobs")
    public ResponseEntity<MaterialResponse.JobResponse> createJob(@RequestBody MaterialRequest.CreateJobRequest request) {
        validateJobSafety(request);
        
        Map<String, Object> result = pocketBaseClient.createJob(
                request.userId(),
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "company", request.data().company(),
                        "startDate", request.data().startDate(),
                        "endDate", request.data().endDate(),
                        "location", request.data().location(),
                        "responsibilities", request.data().responsibilities(),
                        "requirements", request.data().requirements()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.JobResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/jobs/" + result.get("slug")
        ));
    }

    /**
     * Updates an existing job after validating ownership.
     * @param jobId The job ID to update
     * @param request The job update request
     * @return The updated job response
     * @throws IllegalArgumentException if user confirmation is missing, job-listing references are detected, or ownership validation fails
     */
    @PatchMapping("/jobs/{jobId}")
    public ResponseEntity<MaterialResponse.JobResponse> updateJob(@PathVariable String jobId, @RequestBody MaterialRequest.CreateJobRequest request) {
        validateJobUpdateSafety(request);
        
        // TODO: Implement ownership validation
        pocketBaseClient.validateOwnedRecordId("jobs", request.userId(), jobId);
        
        Map<String, Object> result = pocketBaseClient.updateJob(
                jobId,
                Map.of(
                        "title", request.data().title(),
                        "description", request.data().description(),
                        "company", request.data().company(),
                        "startDate", request.data().startDate(),
                        "endDate", request.data().endDate(),
                        "location", request.data().location(),
                        "responsibilities", request.data().responsibilities(),
                        "requirements", request.data().requirements()
                )
        );
        
        return ResponseEntity.ok(new MaterialResponse.JobResponse(
                (String) result.get("id"),
                (String) result.get("slug"),
                frontendProperties.baseUrl() + "/jobs/" + result.get("slug")
        ));
    }
}