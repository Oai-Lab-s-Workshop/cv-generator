package com.resumate.materialmcp.service;

import com.resumate.materialmcp.config.PocketBaseProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * PocketBase client for material operations.
 */
@Service
public class MaterialPocketBaseClient {

    private final RestClient restClient;
    private final PocketBaseProperties pocketBaseProperties;
    private volatile String cachedServiceUserToken;
    private volatile Instant cachedServiceUserTokenExpiresAt;

    public MaterialPocketBaseClient(RestClient.Builder restClientBuilder, PocketBaseProperties pocketBaseProperties) {
        this.restClient = restClientBuilder.baseUrl(pocketBaseProperties.baseUrl()).build();
        this.pocketBaseProperties = pocketBaseProperties;
    }

    public Optional<AiTokenRecord> findAiTokenByRawToken(String rawToken) {
        String filter = String.format("token_hash=\"%s\"", sha256Hex(rawToken));
        RecordListResponse<AiTokenRecord> response = restClient.get()
                .uri((uriBuilder) -> uriBuilder
                        .path("/api/collections/ai_tokens/records")
                        .queryParam("filter", filter)
                        .queryParam("perPage", 1)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, bearer(serviceUserToken()))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        return response == null ? Optional.empty() : response.items().stream().findFirst();
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
     * Authenticates the Material MCP service user with PocketBase.
     * @return The service-user token
     */
    private String authenticate() {
        return serviceUserToken();
    }

    private String serviceUserToken() {
        if (!StringUtils.hasText(pocketBaseProperties.serviceUserEmail())
                || !StringUtils.hasText(pocketBaseProperties.serviceUserPassword())) {
            throw new IllegalStateException("PocketBase Material MCP service-user credentials are not configured.");
        }

        String token = cachedServiceUserToken;
        Instant expiresAt = cachedServiceUserTokenExpiresAt;
        if (StringUtils.hasText(token) && expiresAt != null && expiresAt.isAfter(Instant.now().plusSeconds(30))) {
            return token;
        }

        synchronized (this) {
            token = cachedServiceUserToken;
            expiresAt = cachedServiceUserTokenExpiresAt;
            if (StringUtils.hasText(token) && expiresAt != null && expiresAt.isAfter(Instant.now().plusSeconds(30))) {
                return token;
            }

            Map<String, Object> response = restClient.post()
                .uri("/api/collections/users/auth-with-password")
                .body(Map.of(
                        "identity", pocketBaseProperties.serviceUserEmail(),
                        "password", pocketBaseProperties.serviceUserPassword()
                ))
                .retrieve()
                .body(Map.class);

            String authenticatedToken = response == null ? null : (String) response.get("token");
            if (!StringUtils.hasText(authenticatedToken)) {
                throw new IllegalStateException("PocketBase Material MCP service-user authentication failed.");
            }

            cachedServiceUserToken = authenticatedToken;
            cachedServiceUserTokenExpiresAt = Instant.now().plusSeconds(300);
            return authenticatedToken;
        }
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String sha256Hex(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available.", ex);
        }
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

    private record RecordListResponse<T>(java.util.List<T> items) {
    }

    public record AiTokenRecord(String id, String user, String label, String status, String expiresAt, String tokenPrefix) {
    }
}
