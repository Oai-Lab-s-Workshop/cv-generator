package com.resumate.materialmcp.dto;



/**
 * Request DTOs for material creation/update operations.
 */
public class MaterialRequest {

    /**
     * Request for creating/updating a project.
     */
    public record CreateProjectRequest(
            ProjectData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating an achievement.
     */
    public record CreateAchievementRequest(
            AchievementData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a skill.
     */
    public record CreateSkillRequest(
            SkillData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a job.
     */
    public record CreateJobRequest(
            JobData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a degree.
     */
    public record CreateDegreeRequest(
            DegreeData data,
            boolean userConfirmed
    ) {}

    /**
     * Request for creating/updating a hobby.
     */
    public record CreateHobbyRequest(
            HobbyData data,
            boolean userConfirmed
    ) {}

    /**
     * Project data structure.
     */
    public record ProjectData(
            String name,
            String description,
            String url,
            String date,
            String picture,
            String type,
            String file,
            java.util.List<String> achievements,
            Integer sortOrder
    ) {}

    /**
     * Achievement data structure.
     */
    public record AchievementData(
            String title,
            String description,
            Integer sortOrder
    ) {}

    /**
     * Skill data structure.
     */
    public record SkillData(
            String name,
            String category,
            String type,
            Integer level,
            Integer sortOrder
    ) {}

    /**
     * Job data structure.
     */
    public record JobData(
            String label,
            String company,
            String position,
            String startDate,
            String endDate,
            String responsibilities,
            String location,
            Integer sortOrder,
            String type,
            java.util.List<String> skills,
            java.util.List<String> projects,
            java.util.List<String> achievements
    ) {}

    /**
     * Degree data structure.
     */
    public record DegreeData(
            String title,
            String school,
            String year,
            String level,
            Integer sortOrder
    ) {}

    /**
     * Hobby data structure.
     */
    public record HobbyData(
            String name,
            String description,
            Integer sortOrder
    ) {}
}
