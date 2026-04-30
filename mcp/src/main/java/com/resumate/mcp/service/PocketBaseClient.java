package com.resumate.mcp.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.resumate.mcp.config.PocketBaseProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class PocketBaseClient {

    private static final Logger logger = LoggerFactory.getLogger(PocketBaseClient.class);

    private static final List<TemplateDescriptor> TEMPLATE_DESCRIPTORS = List.of(
            new TemplateDescriptor("classic", "Classic", "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills."),
            new TemplateDescriptor("modern", "Modern", "Split-sidebar resume with timeline-style . Most commmon CV layout."),
            new TemplateDescriptor("minimal", "Minimal", "Single-column minimalist resume with inline contact details and compact sections."),
            new TemplateDescriptor("supa", "Supa", "Clean, compact, print-first CV designed to fit into a single A4 page. Dynamic sizing, great for showcasing lots of Projects")
    );

    private final PocketBaseProperties properties;
    private final RestClient restClient;

    public PocketBaseClient(PocketBaseProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(trimTrailingSlash(properties.baseUrl()))
                .build();
    }

    public Optional<AiTokenRecord> findAiTokenByRawToken(String rawToken) {
        String tokenHash = sha256Hex(rawToken);
        String filter = String.format("token_hash=\"%s\"", tokenHash);

        RecordListResponse<AiTokenRecord> response = getCollectionRecords(
                "ai_tokens",
                filter,
                1,
                new ParameterizedTypeReference<>() {
                }
        );

        return response.items().stream().findFirst();
    }

    public ProfileMaterialBundle loadProfileMaterial(String userId) {
        UserRecord user = restClient.get()
                .uri("/api/collections/users/records/{userId}", userId)
                .header(HttpHeaders.AUTHORIZATION, bearer(serviceUserToken()))
                .retrieve()
                .body(UserRecord.class);

        return new ProfileMaterialBundle(
                Objects.requireNonNull(user, "PocketBase user payload is required."),
                getOwnedRecords("skills", userId, "+sortOrder,+name"),
                getOwnedRecords("jobs", userId, "+sortOrder,-startDate"),
                getOwnedRecords("projects", userId, "+sortOrder,-date"),
                getOwnedRecords("achievements", userId, "+sortOrder,+title"),
                getOwnedRecords("degrees", userId, "+sortOrder,-year"),
                getOwnedRecords("hobbies", userId, "+sortOrder,+name")
        );
    }

    public List<TemplateDescriptor> resolveAvailableTemplates() {
        return TEMPLATE_DESCRIPTORS;
    }

    public void validateOwnedRecordIds(String collectionName, String userId, List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }

        List<String> uniqueIds = ids.stream()
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (uniqueIds.size() != ids.size()) {
            throw new IllegalArgumentException("One or more selected records do not belong to the API key owner.");
        }

        for (String id : uniqueIds) {
            OwnedRecord record;
            try {
                record = getRecordById(collectionName, id);
            } catch (RuntimeException ex) {
                throw new IllegalArgumentException("One or more selected records do not belong to the API key owner.", ex);
            }
            if (record == null || !userId.equals(record.user())) {
                throw new IllegalArgumentException("One or more selected records do not belong to the API key owner.");
            }
        }
    }

    public CreatedProfileRecord createTailoredProfile(String userId, CreateProfilePayload payload) {
        String slug = payload.templateId() + "--" + slugify(payload.profileName()) + "-" + Instant.now().toEpochMilli();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("slug", slug);
        body.put("profileName", payload.profileName());
        body.put("template", payload.templateId());
        body.put("public", true);
        body.put("user", userId);
        body.put("professionalSummary", payload.professionalSummary());
        body.put("skills", defaultList(payload.skillIds()));
        body.put("jobs", defaultList(payload.jobIds()));
        body.put("projects", defaultList(payload.projectIds()));
        body.put("achievements", defaultList(payload.achievementIds()));
        body.put("degrees", defaultList(payload.degreeIds()));
        body.put("hobbies", defaultList(payload.hobbyIds()));

        CreatedProfileRecord created;
        try {
            created = restClient.post()
                    .uri("/api/collections/cv_profiles/records")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, bearer(serviceUserToken()))
                    .body(body)
                    .retrieve()
                    .body(CreatedProfileRecord.class);
        } catch (RestClientResponseException ex) {
            logger.error(
                    "PocketBase cv_profiles create failed status={} userId={} templateId={} profileName={} responseBody={}",
                    ex.getStatusCode().value(),
                    userId,
                    payload.templateId(),
                    payload.profileName(),
                    ex.getResponseBodyAsString()
            );
            throw ex;
        }

        return Objects.requireNonNull(created, "PocketBase created profile payload is required.");
    }

    public void markAiTokenUsed(String tokenId) {
        try {
            restClient.patch()
                    .uri("/api/collections/ai_tokens/records/{tokenId}", tokenId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, bearer(serviceUserToken()))
                    .body(Map.of("lastUsedAt", Instant.now().toString()))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            logger.warn(
                    "PocketBase ai_tokens lastUsedAt update failed status={} tokenId={} responseBody={}",
                    ex.getStatusCode().value(),
                    tokenId,
                    ex.getResponseBodyAsString()
            );
        } catch (RuntimeException ex) {
            logger.warn("PocketBase ai_tokens lastUsedAt update failed tokenId={} message={}", tokenId, ex.getMessage());
        }
    }

    private List<Map<String, Object>> getOwnedRecords(String collectionName, String userId, String sort) {
        RecordListResponse<Map<String, Object>> response = getCollectionRecords(
                collectionName,
                String.format("user=\"%s\"", userId),
                200,
                new ParameterizedTypeReference<>() {
                },
                sort
        );
        return response.items();
    }

    private <T> RecordListResponse<T> getCollectionRecords(
            String collectionName,
            String filter,
            int perPage,
            ParameterizedTypeReference<RecordListResponse<T>> responseType
    ) {
        return getCollectionRecords(collectionName, filter, perPage, responseType, null);
    }

    private <T> RecordListResponse<T> getCollectionRecords(
            String collectionName,
            String filter,
            int perPage,
            ParameterizedTypeReference<RecordListResponse<T>> responseType,
            String sort
    ) {
        RecordListResponse<T> response = restClient.get()
                .uri((uriBuilder) -> {
                    uriBuilder = uriBuilder.path("/api/collections/{collectionName}/records")
                            .queryParam("filter", filter)
                            .queryParam("perPage", perPage);
                    if (StringUtils.hasText(sort)) {
                        uriBuilder = uriBuilder.queryParam("sort", sort);
                    }
                    return uriBuilder.build(collectionName);
                })
                .header(HttpHeaders.AUTHORIZATION, bearer(serviceUserToken()))
                .retrieve()
                .body(responseType);

        return Objects.requireNonNull(response, "PocketBase list response is required.");
    }

    private OwnedRecord getRecordById(String collectionName, String recordId) {
        return restClient.get()
                .uri("/api/collections/{collectionName}/records/{recordId}", collectionName, recordId)
                .header(HttpHeaders.AUTHORIZATION, bearer(serviceUserToken()))
                .retrieve()
                .body(OwnedRecord.class);
    }

    private String serviceUserToken() {
        if (!StringUtils.hasText(properties.serviceUserEmail()) || !StringUtils.hasText(properties.serviceUserPassword())) {
            throw new IllegalStateException("PocketBase MCP service-user credentials are not configured.");
        }

        AuthResponse response = restClient.post()
                .uri("/api/collections/users/auth-with-password")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "identity", properties.serviceUserEmail(),
                        "password", properties.serviceUserPassword()
                ))
                .retrieve()
                .body(AuthResponse.class);

        if (response == null || !StringUtils.hasText(response.token())) {
            throw new IllegalStateException("PocketBase MCP service-user authentication failed.");
        }

        return response.token();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static List<String> defaultList(List<String> values) {
        return values == null ? List.of() : values;
    }

    private static String slugify(String value) {
        StringBuilder slug = new StringBuilder();
        boolean lastWasDash = false;

        for (char character : value.toLowerCase().toCharArray()) {
            if (character >= 'a' && character <= 'z' || character >= '0' && character <= '9') {
                slug.append(character);
                lastWasDash = false;
                continue;
            }

            if (!lastWasDash) {
                slug.append('-');
                lastWasDash = true;
            }
        }

        String normalized = slug.toString().replaceAll("^-+|-+$", "");
        return normalized.isBlank() ? "profile" : normalized;
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(encoded.length * 2);

            for (byte current : encoded) {
                builder.append(String.format("%02x", current));
            }

            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available.", ex);
        }
    }

    private static String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public record TemplateDescriptor(String id, String label, String description) {
    }

    public record ProfileMaterialBundle(
            UserRecord user,
            List<Map<String, Object>> skills,
            List<Map<String, Object>> jobs,
            List<Map<String, Object>> projects,
            List<Map<String, Object>> achievements,
            List<Map<String, Object>> degrees,
            List<Map<String, Object>> hobbies
    ) {
    }

    public record CreateProfilePayload(
            String profileName,
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AuthResponse(String token) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RecordListResponse<T>(List<T> items) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AiTokenRecord(
            String id,
            String user,
            String label,
            String status,
            String expiresAt,
            @JsonProperty("token_hash") String tokenHash,
            @JsonProperty("token_prefix") String tokenPrefix
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreatedProfileRecord(String id, String slug) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OwnedRecord(
            String id,
            String user
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UserRecord(
            String id,
            String firstName,
            String lastName,
            String linkedin,
            String github,
            String website,
            String email,
            String phone
    ) {
    }
}
