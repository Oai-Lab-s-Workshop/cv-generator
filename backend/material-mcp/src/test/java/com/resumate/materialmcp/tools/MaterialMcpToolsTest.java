package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.dto.MaterialResponse;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaterialMcpToolsTest {

    // Mock MCP tool annotation to bypass Spring AI dependency
    @Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.METHOD)
    private @interface MockMcpTool {
        String name();
        String description() default "";
    }

    @Mock
    private MaterialPocketBaseClient pocketBaseClient;

    @Mock
    private FrontendProperties frontendProperties;

    @InjectMocks
    private MaterialMcpTools materialMcpTools;

    private static final String TEST_USER_ID = "user123";
    private static final String TEST_SLUG = "test-job";
    private static final String TEST_BASE_URL = "https://cv-generator.example.com";

    @BeforeEach
    void setUp() {
        when(frontendProperties.baseUrl()).thenReturn(TEST_BASE_URL);
    }

    // --- Job Tests ---

    @Test
    void createJob_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.JobData(
                        "Software Engineer",
                        "Developed web applications",
                        "Tech Corp",
                        "2020-01-01",
                        "2023-12-31",
                        "San Francisco",
                        "Backend development",
                        "Java, Spring"
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "job123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.createJob(anyString(), any(Map.class))).thenReturn(mockResponse);
        
        // Act
        MaterialResponse.JobResponse response = materialMcpTools.createJob(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("job123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/jobs/" + TEST_SLUG, response.url());
    }

    @Test
    void createJob_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.JobData(
                        "Software Engineer",
                        "Developed web applications",
                        "Tech Corp",
                        "2020-01-01",
                        "2023-12-31",
                        "San Francisco",
                        "Backend development",
                        "Java, Spring"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createJob(request));
        
        assertEquals("User confirmation is required to create job. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void createJob_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.JobData(
                        "Job tailored to job listing", // Contains job-listing reference
                        "Developed web applications",
                        "Tech Corp",
                        "2020-01-01",
                        "2023-12-31",
                        "San Francisco",
                        "Backend development",
                        "Java, Spring"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createJob(request));
        
        assertEquals("Creating material tailored to job listings is not allowed. Create authentic job based on your actual experience.", 
                exception.getMessage());
    }

    @Test
    void updateJob_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.JobData(
                        "Senior Software Engineer",
                        "Developed web applications and led teams",
                        "Tech Corp",
                        "2020-01-01",
                        "2023-12-31",
                        "San Francisco",
                        "Backend development, team leadership",
                        "Java, Spring, Leadership"
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "job123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.updateJob(anyString(), any(Map.class))).thenReturn(mockResponse);
        
        // Act
        MaterialResponse.JobResponse response = materialMcpTools.updateJob("job123", request);
        
        // Assert
        assertNotNull(response);
        assertEquals("job123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/jobs/" + TEST_SLUG, response.url());
    }

    @Test
    void updateJob_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.JobData(
                        "Software Engineer",
                        "Developed web applications",
                        "Tech Corp",
                        "2020-01-01",
                        "2023-12-31",
                        "San Francisco",
                        "Backend development",
                        "Java, Spring"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateJob("job123", request));
        
        assertEquals("User confirmation is required to update job. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void updateJob_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateJobRequest request = new MaterialRequest.CreateJobRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.JobData(
                        "Job tailored to job posting", // Contains job-listing reference
                        "Developed web applications",
                        "Tech Corp",
                        "2020-01-01",
                        "2023-12-31",
                        "San Francisco",
                        "Backend development",
                        "Java, Spring"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateJob("job123", request));
        
        assertEquals("Updating material tailored to job listings is not allowed. Update authentic job based on your actual experience.", 
                exception.getMessage());
    }

    // --- Project Tests ---

    @Test
    void createProject_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.ProjectData(
                        "CV Generator",
                        "Web application for generating resumes",
                        "2023-01-01",
                        "2023-12-31",
                        "Developer",
                        "Java, Spring, React",
                        "Backend development",
                        "Completed MVP"
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "project123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.createProject(anyString(), any(Map.class))).thenReturn(mockResponse);
        
        // Act
        MaterialResponse.ProjectResponse response = materialMcpTools.createProject(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("project123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/projects/" + TEST_SLUG, response.url());
    }

    @Test
    void createProject_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.ProjectData(
                        "CV Generator",
                        "Web application for generating resumes",
                        "2023-01-01",
                        "2023-12-31",
                        "Developer",
                        "Java, Spring, React",
                        "Backend development",
                        "Completed MVP"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createProject(request));
        
        assertEquals("User confirmation is required to create project. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void createProject_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.ProjectData(
                        "Project for job application", // Contains job-listing reference
                        "Web application for generating resumes",
                        "2023-01-01",
                        "2023-12-31",
                        "Developer",
                        "Java, Spring, React",
                        "Backend development",
                        "Completed MVP"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createProject(request));
        
        assertEquals("Creating material tailored to job listings is not allowed. Create authentic project based on your actual experience.", 
                exception.getMessage());
    }

    @Test
    void updateProject_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.ProjectData(
                        "CV Generator",
                        "Web application for generating resumes and cover letters",
                        "2023-01-01",
                        "2023-12-31",
                        "Developer",
                        "Java, Spring, React",
                        "Backend development, frontend development",
                        "Completed MVP with cover letter feature"
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "project123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.updateProject(anyString(), any(Map.class))).thenReturn(mockResponse);
        doNothing().when(pocketBaseClient).validateOwnedRecordId(anyString(), anyString(), anyString());
        
        // Act
        MaterialResponse.ProjectResponse response = materialMcpTools.updateProject("project123", request);
        
        // Assert
        assertNotNull(response);
        assertEquals("project123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/projects/" + TEST_SLUG, response.url());
    }

    @Test
    void updateProject_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.ProjectData(
                        "CV Generator",
                        "Web application for generating resumes",
                        "2023-01-01",
                        "2023-12-31",
                        "Developer",
                        "Java, Spring, React",
                        "Backend development",
                        "Completed MVP"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateProject("project123", request));
        
        assertEquals("User confirmation is required to update project. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void updateProject_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.ProjectData(
                        "Project for job application", // Contains job-listing reference
                        "Web application for generating resumes",
                        "2023-01-01",
                        "2023-12-31",
                        "Developer",
                        "Java, Spring, React",
                        "Backend development",
                        "Completed MVP"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateProject("project123", request));
        
        assertEquals("Updating material tailored to job listings is not allowed. Update authentic project based on your actual experience.", 
                exception.getMessage());
    }

    // --- Achievement Tests ---

    @Test
    void createAchievement_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateAchievementRequest request = new MaterialRequest.CreateAchievementRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.AchievementData(
                        "Best Developer Award",
                        "Awarded for outstanding contributions",
                        "2023-06-15",
                        "Award",
                        "Tech Corp"
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "achievement123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.createAchievement(anyString(), any(Map.class))).thenReturn(mockResponse);
        
        // Act
        MaterialResponse.AchievementResponse response = materialMcpTools.createAchievement(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("achievement123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/achievements/" + TEST_SLUG, response.url());
    }

    @Test
    void createAchievement_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateAchievementRequest request = new MaterialRequest.CreateAchievementRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.AchievementData(
                        "Best Developer Award",
                        "Awarded for outstanding contributions",
                        "2023-06-15",
                        "Award",
                        "Tech Corp"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createAchievement(request));
        
        assertEquals("User confirmation is required to create achievement. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void createAchievement_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateAchievementRequest request = new MaterialRequest.CreateAchievementRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.AchievementData(
                        "Achievement for job application", // Contains job-listing reference
                        "Awarded for outstanding contributions",
                        "2023-06-15",
                        "Award",
                        "Tech Corp"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createAchievement(request));
        
        assertEquals("Creating material tailored to job listings is not allowed. Create authentic achievement based on your actual experience.", 
                exception.getMessage());
    }

    @Test
    void updateAchievement_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateAchievementRequest request = new MaterialRequest.CreateAchievementRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.AchievementData(
                        "Best Developer Award 2023",
                        "Awarded for outstanding contributions and leadership",
                        "2023-06-15",
                        "Award",
                        "Tech Corp"
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "achievement123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.updateAchievement(anyString(), any(Map.class))).thenReturn(mockResponse);
        doNothing().when(pocketBaseClient).validateOwnedRecordId(anyString(), anyString(), anyString());
        
        // Act
        MaterialResponse.AchievementResponse response = materialMcpTools.updateAchievement("achievement123", request);
        
        // Assert
        assertNotNull(response);
        assertEquals("achievement123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/achievements/" + TEST_SLUG, response.url());
    }

    @Test
    void updateAchievement_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateAchievementRequest request = new MaterialRequest.CreateAchievementRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.AchievementData(
                        "Best Developer Award",
                        "Awarded for outstanding contributions",
                        "2023-06-15",
                        "Award",
                        "Tech Corp"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateAchievement("achievement123", request));
        
        assertEquals("User confirmation is required to update achievement. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void updateAchievement_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateAchievementRequest request = new MaterialRequest.CreateAchievementRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.AchievementData(
                        "Achievement for job application", // Contains job-listing reference
                        "Awarded for outstanding contributions",
                        "2023-06-15",
                        "Award",
                        "Tech Corp"
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateAchievement("achievement123", request));
        
        assertEquals("Updating material tailored to job listings is not allowed. Update authentic achievement based on your actual experience.", 
                exception.getMessage());
    }

    // --- Skill Tests ---

    @Test
    void createSkill_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateSkillRequest request = new MaterialRequest.CreateSkillRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.SkillData(
                        "Java",
                        "Expert",
                        "Programming",
                        5
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "skill123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.createSkill(anyString(), any(Map.class))).thenReturn(mockResponse);
        
        // Act
        MaterialResponse.SkillResponse response = materialMcpTools.createSkill(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("skill123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/skills/" + TEST_SLUG, response.url());
    }

    @Test
    void createSkill_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateSkillRequest request = new MaterialRequest.CreateSkillRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.SkillData(
                        "Java",
                        "Expert",
                        "Programming",
                        5
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createSkill(request));
        
        assertEquals("User confirmation is required to create skill. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void createSkill_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateSkillRequest request = new MaterialRequest.CreateSkillRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.SkillData(
                        "Skill for job application", // Contains job-listing reference
                        "Expert",
                        "Programming",
                        5
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.createSkill(request));
        
        assertEquals("Creating material tailored to job listings is not allowed. Create authentic skill based on your actual experience.", 
                exception.getMessage());
    }

    @Test
    void updateSkill_shouldSucceedWithValidInput() {
        // Arrange
        MaterialRequest.CreateSkillRequest request = new MaterialRequest.CreateSkillRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.SkillData(
                        "Java",
                        "Expert",
                        "Programming",
                        6
                )
        );
        
        Map<String, Object> mockResponse = Map.of(
                "id", "skill123",
                "slug", TEST_SLUG
        );
        
        when(pocketBaseClient.updateSkill(anyString(), any(Map.class))).thenReturn(mockResponse);
        doNothing().when(pocketBaseClient).validateOwnedRecordId(anyString(), anyString(), anyString());
        
        // Act
        MaterialResponse.SkillResponse response = materialMcpTools.updateSkill("skill123", request);
        
        // Assert
        assertNotNull(response);
        assertEquals("skill123", response.id());
        assertEquals(TEST_SLUG, response.slug());
        assertEquals(TEST_BASE_URL + "/skills/" + TEST_SLUG, response.url());
    }

    @Test
    void updateSkill_shouldRejectMissingUserConfirmation() {
        // Arrange
        MaterialRequest.CreateSkillRequest request = new MaterialRequest.CreateSkillRequest(
                TEST_USER_ID,
                false, // Missing confirmation
                new MaterialRequest.SkillData(
                        "Java",
                        "Expert",
                        "Programming",
                        5
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateSkill("skill123", request));
        
        assertEquals("User confirmation is required to update skill. Set userConfirmed=true.", 
                exception.getMessage());
    }

    @Test
    void updateSkill_shouldRejectJobListingReferences() {
        // Arrange
        MaterialRequest.CreateSkillRequest request = new MaterialRequest.CreateSkillRequest(
                TEST_USER_ID,
                true,
                new MaterialRequest.SkillData(
                        "Skill for job application", // Contains job-listing reference
                        "Expert",
                        "Programming",
                        5
                )
        );
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> materialMcpTools.updateSkill("skill123", request));
        
        assertEquals("Updating material tailored to job listings is not allowed. Update authentic skill based on your actual experience.", 
                exception.getMessage());
    }
}