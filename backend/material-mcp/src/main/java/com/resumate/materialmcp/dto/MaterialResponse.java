package com.resumate.materialmcp.dto;

/**
 * Response DTOs for material operations.
 */
public class MaterialResponse {



    /**
     * Response for project operations.
     */
    public record ProjectResponse(
            String id,
            String slug,
            String frontendUrl
    ) {}

    /**
     * Response for achievement operations.
     */
    public record AchievementResponse(
            String id,
            String slug,
            String frontendUrl
    ) {}

    /**
     * Response for skill operations.
     */
    public record SkillResponse(
            String id,
            String slug,
            String frontendUrl
    ) {}

    /**
     * Response for job operations.
     */
    public record JobResponse(
            String id,
            String slug,
            String frontendUrl
    ) {}

    /**
     * Response for degree operations.
     */
    public record DegreeResponse(
            String id,
            String slug,
            String frontendUrl
    ) {}

    /**
     * Response for hobby operations.
     */
    public record HobbyResponse(
            String id,
            String slug,
            String frontendUrl
    ) {}
}