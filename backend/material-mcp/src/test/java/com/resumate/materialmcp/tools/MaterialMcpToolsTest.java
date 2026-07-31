package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import com.resumate.materialmcp.security.AiTokenPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterialMcpToolsTest {

    private static final String USER_ID = "user123";

    @Mock private MaterialPocketBaseClient pocketBaseClient;
    @Mock private FrontendProperties frontendProperties;
    @InjectMocks private MaterialMcpTools materialMcpTools;

    @BeforeEach
    void setUp() {
        lenient().when(frontendProperties.baseUrl()).thenReturn("https://resumate.test");
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AiTokenPrincipal("token", USER_ID, "test"), null));
    }

    @Test
    void createProject_createsProjectAndAllowsNullableOptionalFields() {
        MaterialRequest.CreateProjectRequest request = new MaterialRequest.CreateProjectRequest(USER_ID,
                new MaterialRequest.ProjectData("Portfolio", null, null, null, null, null, null, null, null), true);
        when(pocketBaseClient.createProject(eq(USER_ID), anyMap())).thenReturn(response("project"));

        assertEquals("https://resumate.test/projects/project", materialMcpTools.createProject(request).getBody().frontendUrl());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).createProject(eq(USER_ID), data.capture());
        assertTrue(data.getValue().containsKey("description"));
        assertNull(data.getValue().get("description"));
    }

    @Test
    void updateProject_validatesOwnershipAndUpdatesProject() {
        var request = new MaterialRequest.CreateProjectRequest(USER_ID, projectData(), true);
        when(pocketBaseClient.updateProject(eq("project-id"), anyMap())).thenReturn(response("project"));

        assertEquals("project-id", materialMcpTools.updateProject("project-id", request).getBody().id());
        verify(pocketBaseClient).validateOwnedRecordId("projects", USER_ID, "project-id");
        verify(pocketBaseClient).updateProject(eq("project-id"), anyMap());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).updateProject(eq("project-id"), data.capture());
        assertEquals(Map.of("name", "Portfolio", "description", "Built a portfolio", "url", "https://example.test", "date", "2020", "picture", "picture.png", "type", "sideproject", "file", "file-id", "achievements", List.of(), "sortOrder", 1), data.getValue());
    }

    @Test
    void createAchievement_createsAchievement() {
        var request = new MaterialRequest.CreateAchievementRequest(USER_ID, achievementData(), true);
        when(pocketBaseClient.createAchievement(eq(USER_ID), anyMap())).thenReturn(response("achievement"));

        assertEquals("achievement-id", materialMcpTools.createAchievement(request).getBody().id());
        verify(pocketBaseClient).createAchievement(eq(USER_ID), anyMap());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).createAchievement(eq(USER_ID), data.capture());
        assertEquals(Map.of("title", "Award", "description", "Won award", "sortOrder", 1), data.getValue());
    }

    @Test
    void updateAchievement_validatesOwnershipAndUpdatesAchievement() {
        var request = new MaterialRequest.CreateAchievementRequest(USER_ID, achievementData(), true);
        when(pocketBaseClient.updateAchievement(eq("achievement-id"), anyMap())).thenReturn(response("achievement"));

        assertEquals("achievement", materialMcpTools.updateAchievement("achievement-id", request).getBody().slug());
        verify(pocketBaseClient).validateOwnedRecordId("achievements", USER_ID, "achievement-id");
        verify(pocketBaseClient).updateAchievement(eq("achievement-id"), anyMap());
    }

    @Test
    void createSkill_createsSkill() {
        var request = new MaterialRequest.CreateSkillRequest(USER_ID, skillData(), true);
        when(pocketBaseClient.createSkill(eq(USER_ID), anyMap())).thenReturn(response("skill"));

        assertEquals("skill-id", materialMcpTools.createSkill(request).getBody().id());
        verify(pocketBaseClient).createSkill(eq(USER_ID), anyMap());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).createSkill(eq(USER_ID), data.capture());
        assertEquals(Map.of("name", "Java", "category", "Backend", "type", "Technical", "level", 4, "sortOrder", 1), data.getValue());
    }

    @Test
    void updateSkill_validatesOwnershipAndUpdatesSkill() {
        var request = new MaterialRequest.CreateSkillRequest(USER_ID, skillData(), true);
        when(pocketBaseClient.updateSkill(eq("skill-id"), anyMap())).thenReturn(response("skill"));

        assertEquals("skill", materialMcpTools.updateSkill("skill-id", request).getBody().slug());
        verify(pocketBaseClient).validateOwnedRecordId("skills", USER_ID, "skill-id");
        verify(pocketBaseClient).updateSkill(eq("skill-id"), anyMap());
    }

    @Test
    void createJob_createsJob() {
        var request = new MaterialRequest.CreateJobRequest(USER_ID, jobData(), true);
        when(pocketBaseClient.createJob(eq(USER_ID), anyMap())).thenReturn(response("job"));

        assertEquals("job-id", materialMcpTools.createJob(request).getBody().id());
        verify(pocketBaseClient).createJob(eq(USER_ID), anyMap());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).createJob(eq(USER_ID), data.capture());
        assertEquals(Map.ofEntries(
                Map.entry("label", "Engineer"), Map.entry("company", "Company"), Map.entry("position", "Engineer"),
                Map.entry("startDate", "2020-01-01"), Map.entry("endDate", "2021-01-01"), Map.entry("responsibilities", "Developed"),
                Map.entry("location", "Remote"), Map.entry("sortOrder", 1), Map.entry("type", "work project"),
                Map.entry("skills", List.of()), Map.entry("projects", List.of()), Map.entry("achievements", List.of())), data.getValue());
    }

    @Test
    void updateJob_validatesOwnershipAndUpdatesJob() {
        var request = new MaterialRequest.CreateJobRequest(USER_ID, jobData(), true);
        when(pocketBaseClient.updateJob(eq("job-id"), anyMap())).thenReturn(response("job"));

        assertEquals("job", materialMcpTools.updateJob("job-id", request).getBody().slug());
        verify(pocketBaseClient).validateOwnedRecordId("jobs", USER_ID, "job-id");
        verify(pocketBaseClient).updateJob(eq("job-id"), anyMap());
    }

    @Test
    void createDegree_createsDegree() {
        var request = new MaterialRequest.CreateDegreeRequest(USER_ID, degreeData(), true);
        when(pocketBaseClient.createDegree(eq(USER_ID), anyMap())).thenReturn(response("degree"));

        assertEquals("degree-id", materialMcpTools.createDegree(request).getBody().id());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).createDegree(eq(USER_ID), data.capture());
        assertEquals(Map.of("title", "BSc", "school", "University", "year", "2019", "level", "Bachelor", "sortOrder", 1), data.getValue());
    }

    @Test
    void updateDegree_validatesOwnershipAndUpdatesDegree() {
        var request = new MaterialRequest.CreateDegreeRequest(USER_ID, degreeData(), true);
        when(pocketBaseClient.updateDegree(eq("degree-id"), anyMap())).thenReturn(response("degree"));

        assertEquals("degree", materialMcpTools.updateDegree("degree-id", request).getBody().slug());
        verify(pocketBaseClient).validateOwnedRecordId("degrees", USER_ID, "degree-id");
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).updateDegree(eq("degree-id"), data.capture());
        assertEquals(Map.of("title", "BSc", "school", "University", "year", "2019", "level", "Bachelor", "sortOrder", 1), data.getValue());
    }

    @Test
    void createHobby_createsHobby() {
        var request = new MaterialRequest.CreateHobbyRequest(USER_ID, hobbyData(), true);
        when(pocketBaseClient.createHobby(eq(USER_ID), anyMap())).thenReturn(response("hobby"));

        assertEquals("hobby-id", materialMcpTools.createHobby(request).getBody().id());
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).createHobby(eq(USER_ID), data.capture());
        assertEquals(Map.of("name", "Running", "description", "Trail running", "sortOrder", 1), data.getValue());
    }

    @Test
    void updateHobby_validatesOwnershipAndUpdatesHobby() {
        var request = new MaterialRequest.CreateHobbyRequest(USER_ID, hobbyData(), true);
        when(pocketBaseClient.updateHobby(eq("hobby-id"), anyMap())).thenReturn(response("hobby"));

        assertEquals("hobby", materialMcpTools.updateHobby("hobby-id", request).getBody().slug());
        verify(pocketBaseClient).validateOwnedRecordId("hobbies", USER_ID, "hobby-id");
        ArgumentCaptor<Map<String, Object>> data = mapCaptor();
        verify(pocketBaseClient).updateHobby(eq("hobby-id"), data.capture());
        assertEquals(Map.of("name", "Running", "description", "Trail running", "sortOrder", 1), data.getValue());
    }

    @Test
    void createProject_rejectsMissingUserConfirmation() {
        var request = new MaterialRequest.CreateProjectRequest(USER_ID, projectData(), false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> materialMcpTools.createProject(request));

        assertEquals("User confirmation is required to create project. Set userConfirmed=true.", exception.getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void createProject_rejectsARequestForAnotherUser() {
        var request = new MaterialRequest.CreateProjectRequest("other-user", projectData(), true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> materialMcpTools.createProject(request));

        assertEquals("Request userId does not match the authenticated API token user.", exception.getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void createProject_rejectsMissingAuthenticatedCaller() {
        SecurityContextHolder.clearContext();

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> materialMcpTools.createProject(new MaterialRequest.CreateProjectRequest(USER_ID, projectData(), true)));

        assertEquals("Authenticated API token user is required.", exception.getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void updateDegree_rejectsMissingUserConfirmation() {
        var request = new MaterialRequest.CreateDegreeRequest(USER_ID, degreeData(), false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> materialMcpTools.updateDegree("degree-id", request));

        assertEquals("User confirmation is required to update degree. Set userConfirmed=true.", exception.getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void createJob_rejectsJobListingReferences() {
        var request = new MaterialRequest.CreateJobRequest(USER_ID,
                new MaterialRequest.JobData("Engineer", "Company", "Engineer", null, null, "Tailored to a job listing", null, null, null, null, null, null), true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> materialMcpTools.createJob(request));

        assertEquals("Create material tailored to job listings is not allowed. Create authentic job based on your actual experience.", exception.getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void updateHobby_rejectsJobListingReferences() {
        var request = new MaterialRequest.CreateHobbyRequest(USER_ID,
                new MaterialRequest.HobbyData("Running", "For a specific opportunity", null), true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> materialMcpTools.updateHobby("hobby-id", request));

        assertEquals("Update material tailored to job listings is not allowed. Update authentic hobby based on your actual experience.", exception.getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @SuppressWarnings("unchecked")
    private ArgumentCaptor<Map<String, Object>> mapCaptor() {
        return ArgumentCaptor.forClass(Map.class);
    }

    private Map<String, Object> response(String slug) {
        return Map.of("id", slug + "-id", "slug", slug);
    }

    private MaterialRequest.ProjectData projectData() {
        return new MaterialRequest.ProjectData("Portfolio", "Built a portfolio", "https://example.test", "2020", "picture.png", "sideproject", "file-id", List.of(), 1);
    }

    private MaterialRequest.AchievementData achievementData() {
        return new MaterialRequest.AchievementData("Award", "Won award", 1);
    }

    private MaterialRequest.SkillData skillData() {
        return new MaterialRequest.SkillData("Java", "Backend", "Technical", 4, 1);
    }

    private MaterialRequest.JobData jobData() {
        return new MaterialRequest.JobData("Engineer", "Company", "Engineer", "2020-01-01", "2021-01-01", "Developed", "Remote", 1, "work project", List.of(), List.of(), List.of());
    }

    private MaterialRequest.DegreeData degreeData() {
        return new MaterialRequest.DegreeData("BSc", "University", "2019", "Bachelor", 1);
    }

    private MaterialRequest.HobbyData hobbyData() {
        return new MaterialRequest.HobbyData("Running", "Trail running", 1);
    }
}
