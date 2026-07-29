package com.resumate.materialmcp.dto;

import org.springframework.ai.mcp.tool.ToolParam;

/**
 * Request DTOs for material creation/update operations.
 */
public class MaterialRequest {

    /**
     * Request for creating/updating a project.
     */
    public record CreateProjectRequest(
            @ToolParam(description = "The user ID who owns the project") String userId,
            @ToolParam(description = "The project data to create") ProjectData data,
            @ToolParam(description = "User confirmation flag (must be true)") boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating an achievement.
     */
    public record CreateAchievementRequest(
            @ToolParam(description = "The user ID who owns the achievement") String userId,
            @ToolParam(description = "The achievement data to create") AchievementData data,
            @ToolParam(description = "User confirmation flag (must be true)") boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a skill.
     */
    public record CreateSkillRequest(
            @ToolParam(description = "The user ID who owns the skill") String userId,
            @ToolParam(description = "The skill data to create") SkillData data,
            @ToolParam(description = "User confirmation flag (must be true)") boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a job.
     */
    public record CreateJobRequest(
            @ToolParam(description = "The user ID who owns the job") String userId,
            @ToolParam(description = "The job data to create") JobData data,
            @ToolParam(description = "User confirmation flag (must be true)") boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a degree.
     */
    public record CreateDegreeRequest(
            @ToolParam(description = "The user ID who owns the degree") String userId,
            @ToolParam(description = "The degree data to create") DegreeData data,
            @ToolParam(description = "User confirmation flag (must be true)") boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a hobby.
     */
    public record CreateHobbyRequest(
            @ToolParam(description = "The user ID who owns the hobby") String userId,
            @ToolParam(description = "The hobby data to create") HobbyData data,
            @ToolParam(description = "User confirmation flag (must be true)") boolean userConfirmed
    ) {}

    /**
     * Project data structure.
     */
    public record ProjectData(
            String title,
            String description,
            String startDate,
            String endDate,
            String role,
            String technologies,
            String responsibilities,
            String outcomes
    ) {}

    /**
     * Achievement data structure.
     */
    public record AchievementData(
            String title,
            String description,
            String date,
            String type,
            String issuer
    ) {}

    /**
     * Skill data structure.
     */
    public record SkillData(
            String name,
            String level,
            String category,
            String yearsOfExperience
    ) {}

    /**
     * Job data structure.
     */
    public record JobData(
            String title,
            String company,
            String startDate,
            String endDate,
            String description,
            String responsibilities,
            String location
    ) {}

    /**
     * Degree data structure.
     */
    public record DegreeData(
            String title,
            String institution,
            String fieldOfStudy,
            String startDate,
            String endDate,
            String grade,
            String description
    ) {}

    /**
     * Hobby data structure.
     */
    public record HobbyData(
            String name,
            String description,
            String category
    ) {}
}