package com.resumate.materialmcp.dto;



/**
 * Request DTOs for material creation/update operations.
 */
public class MaterialRequest {

    /**
     * Request for creating/updating a project.
     */
    public record CreateProjectRequest(
            String userId,
            ProjectData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating an achievement.
     */
    public record CreateAchievementRequest(
            String userId,
            AchievementData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a skill.
     */
    public record CreateSkillRequest(
            String userId,
            SkillData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a job.
     */
    public record CreateJobRequest(
            String userId,
            JobData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a degree.
     */
    public record CreateDegreeRequest(
            String userId,
            DegreeData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a hobby.
     */
    public record CreateHobbyRequest(
            String userId,
            HobbyData data,
            boolean userConfirmed
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
            String location,
            String requirements
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