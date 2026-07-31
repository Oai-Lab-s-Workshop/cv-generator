package com.resumate.materialmcp.service;

import com.resumate.materialmcp.config.PocketBaseProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * PocketBase client for material operations.
 */
@Service
public class MaterialPocketBaseClient {

    private final RestClient restClient;
    private final PocketBaseProperties pocketBaseProperties;

    public MaterialPocketBaseClient(RestClient.Builder restClientBuilder, PocketBaseProperties pocketBaseProperties) {
        this.restClient = restClientBuilder.baseUrl(pocketBaseProperties.baseUrl()).build();
        this.pocketBaseProperties = pocketBaseProperties;
    }

    /**
     * Creates a new project.
     * @param userId The user ID
     * @param data The project data
     * @return The created project
     */
    public Map<String, Object> createProject(String userId, Map<String, Object> data) {
        return restClient.post()
                .uri("/api/collections/projects/records")
                .header("Authorization", "Bearer " + authenticate())
                .body(withUser(userId, data))
                .retrieve()
                .body(Map.class);
    }

    /**
     * Updates an existing project.
     * @param projectId The project ID
     * @param data The project data
     * @return The updated project
     */
    public Map<String, Object> updateProject(String projectId, Map<String, Object> data) {
        return restClient.patch()
                .uri("/api/collections/projects/records/{id}", projectId)
                .header("Authorization", "Bearer " + authenticate())
                .body(data)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Creates a new achievement.
     * @param userId The user ID
     * @param data The achievement data
     * @return The created achievement
     */
    public Map<String, Object> createAchievement(String userId, Map<String, Object> data) {
        return restClient.post()
                .uri("/api/collections/achievements/records")
                .header("Authorization", "Bearer " + authenticate())
                .body(withUser(userId, data))
                .retrieve()
                .body(Map.class);
    }

    /**
     * Updates an existing achievement.
     * @param achievementId The achievement ID
     * @param data The achievement data
     * @return The updated achievement
     */
    public Map<String, Object> updateAchievement(String achievementId, Map<String, Object> data) {
        return restClient.patch()
                .uri("/api/collections/achievements/records/{id}", achievementId)
                .header("Authorization", "Bearer " + authenticate())
                .body(data)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Creates a new skill.
     * @param userId The user ID
     * @param data The skill data
     * @return The created skill
     */
    public Map<String, Object> createSkill(String userId, Map<String, Object> data) {
        return restClient.post()
                .uri("/api/collections/skills/records")
                .header("Authorization", "Bearer " + authenticate())
                .body(withUser(userId, data))
                .retrieve()
                .body(Map.class);
    }

    /**
     * Updates an existing skill.
     * @param skillId The skill ID
     * @param data The skill data
     * @return The updated skill
     */
    public Map<String, Object> updateSkill(String skillId, Map<String, Object> data) {
        return restClient.patch()
                .uri("/api/collections/skills/records/{id}", skillId)
                .header("Authorization", "Bearer " + authenticate())
                .body(data)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Creates a new job.
     * @param userId The user ID
     * @param data The job data
     * @return The created job
     */
    public Map<String, Object> createJob(String userId, Map<String, Object> data) {
        return restClient.post()
                .uri("/api/collections/jobs/records")
                .header("Authorization", "Bearer " + authenticate())
                .body(withUser(userId, data))
                .retrieve()
                .body(Map.class);
    }

    /**
     * Updates an existing job.
     * @param jobId The job ID
     * @param data The job data
     * @return The updated job
     */
    public Map<String, Object> updateJob(String jobId, Map<String, Object> data) {
        return restClient.patch()
                .uri("/api/collections/jobs/records/{id}", jobId)
                .header("Authorization", "Bearer " + authenticate())
                .body(data)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Creates a new degree.
     * @param userId The user ID
     * @param data The degree data
     * @return The created degree
     */
    public Map<String, Object> createDegree(String userId, Map<String, Object> data) {
        return restClient.post()
                .uri("/api/collections/degrees/records")
                .header("Authorization", "Bearer " + authenticate())
                .body(withUser(userId, data))
                .retrieve()
                .body(Map.class);
    }

    /**
     * Updates an existing degree.
     * @param degreeId The degree ID
     * @param data The degree data
     * @return The updated degree
     */
    public Map<String, Object> updateDegree(String degreeId, Map<String, Object> data) {
        return restClient.patch()
                .uri("/api/collections/degrees/records/{id}", degreeId)
                .header("Authorization", "Bearer " + authenticate())
                .body(data)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Creates a new hobby.
     * @param userId The user ID
     * @param data The hobby data
     * @return The created hobby
     */
    public Map<String, Object> createHobby(String userId, Map<String, Object> data) {
        return restClient.post()
                .uri("/api/collections/hobbies/records")
                .header("Authorization", "Bearer " + authenticate())
                .body(withUser(userId, data))
                .retrieve()
                .body(Map.class);
    }

    /**
     * Updates an existing hobby.
     * @param hobbyId The hobby ID
     * @param data The hobby data
     * @return The updated hobby
     */
    public Map<String, Object> updateHobby(String hobbyId, Map<String, Object> data) {
        return restClient.patch()
                .uri("/api/collections/hobbies/records/{id}", hobbyId)
                .header("Authorization", "Bearer " + authenticate())
                .body(data)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Authenticates with PocketBase and returns an admin token.
     * @return The admin token
     */
    private String authenticate() {
        Map<String, Object> response = restClient.post()
                .uri("/api/admins/auth-with-password")
                .body(Map.of(
                        "identity", pocketBaseProperties.serviceUserEmail(),
                        "password", pocketBaseProperties.serviceUserPassword()
                ))
                .retrieve()
                .body(Map.class);
        
        return (String) response.get("token");
    }

    /**
     * Validates that a record belongs to the specified user.
     * @param collectionName The collection name
     * @param userId The user ID
     * @param recordId The record ID to validate
     * @throws IllegalArgumentException if the record doesn't belong to the user
     */
    public void validateOwnedRecordId(String collectionName, String userId, String recordId) {
        if (userId == null || userId.isBlank() || recordId == null || recordId.isBlank()) {
            throw new IllegalArgumentException("A user ID and record ID are required for ownership validation.");
        }
        Map<String, Object> record = restClient.get()
                .uri("/api/collections/{collection}/records/{id}", collectionName, recordId)
                .header("Authorization", "Bearer " + authenticate())
                .retrieve()
                .body(Map.class);
        if (record == null || !userId.equals(record.get("user"))) {
            throw new IllegalArgumentException("Record does not belong to the authenticated user.");
        }
    }

    private Map<String, Object> withUser(String userId, Map<String, Object> data) {
        Map<String, Object> payload = new LinkedHashMap<>(data);
        payload.put("user", userId);
        return payload;
    }
}
