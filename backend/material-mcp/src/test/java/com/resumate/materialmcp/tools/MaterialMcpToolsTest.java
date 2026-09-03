package com.resumate.materialmcp.tools;

import com.resumate.materialmcp.config.FrontendProperties;
import com.resumate.materialmcp.dto.MaterialRequest;
import com.resumate.materialmcp.security.AiTokenPrincipal;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterialMcpToolsTest {
    private static final String USER_ID = "user123";

    @Mock MaterialPocketBaseClient pocketBaseClient;
    @Mock FrontendProperties frontendProperties;
    @InjectMocks MaterialMcpTools materialMcpTools;

    @BeforeEach
    void setUp() {
        lenient().when(frontendProperties.baseUrl()).thenReturn("https://resumate.test");
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AiTokenPrincipal("token", USER_ID, "test"), null));
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    @Test
    void toolsAreSpringAiToolsNotRestEndpoints() throws NoSuchMethodException {
        assertTrue(MaterialMcpTools.class.isAnnotationPresent(org.springframework.stereotype.Component.class));
        assertFalse(MaterialMcpTools.class.isAnnotationPresent(org.springframework.web.bind.annotation.RestController.class));
        assertTrue(MaterialMcpTools.class.getMethod("createProject", MaterialRequest.CreateProjectRequest.class)
                .isAnnotationPresent(Tool.class));
    }

    @Test
    void createProjectUsesPrincipalOwnerAndValidatesFileAndAchievementsBeforeWrite() {
        MaterialRequest.ProjectData data = new MaterialRequest.ProjectData("Portfolio", "Built", null, null, null, null, "file-id", List.of("achievement-id"), 1);
        when(pocketBaseClient.createProject(eq(USER_ID), anyMap())).thenReturn(response("project"));

        assertEquals("project-id", materialMcpTools.createProject(new MaterialRequest.CreateProjectRequest(data, true)).id());
        var order = inOrder(pocketBaseClient);
        order.verify(pocketBaseClient).validateOwnedRecordId("files", USER_ID, "file-id");
        order.verify(pocketBaseClient).validateOwnedRecordIds("achievements", USER_ID, List.of("achievement-id"));
        order.verify(pocketBaseClient).createProject(eq(USER_ID), anyMap());
    }

    @Test
    void updateJobValidatesJobAndEveryRelationBeforeWrite() {
        MaterialRequest.JobData data = new MaterialRequest.JobData("Engineer", "Company", "Engineer", null, null, "Built", null, null, null, List.of("skill"), List.of("project"), List.of("achievement"));
        when(pocketBaseClient.updateJob(eq("job-id"), anyMap())).thenReturn(response("job"));

        assertEquals("job-id", materialMcpTools.updateJob("job-id", new MaterialRequest.CreateJobRequest(data, true)).id());
        var order = inOrder(pocketBaseClient);
        order.verify(pocketBaseClient).validateOwnedRecordId("jobs", USER_ID, "job-id");
        order.verify(pocketBaseClient).validateOwnedRecordIds("skills", USER_ID, List.of("skill"));
        order.verify(pocketBaseClient).validateOwnedRecordIds("projects", USER_ID, List.of("project"));
        order.verify(pocketBaseClient).validateOwnedRecordIds("achievements", USER_ID, List.of("achievement"));
        order.verify(pocketBaseClient).updateJob(eq("job-id"), anyMap());
    }

    @Test
    void createProjectRejectsMissingConfirmationBeforeValidationOrWrite() {
        var request = new MaterialRequest.CreateProjectRequest(new MaterialRequest.ProjectData("Portfolio", null, null, null, null, null, null, null, null), false);
        assertEquals("User confirmation is required to create project. Set userConfirmed=true.",
                assertThrows(IllegalArgumentException.class, () -> materialMcpTools.createProject(request)).getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void createProjectRequiresAuthenticatedPrincipal() {
        SecurityContextHolder.clearContext();
        var request = new MaterialRequest.CreateProjectRequest(new MaterialRequest.ProjectData("Portfolio", null, null, null, null, null, null, null, null), true);
        assertEquals("Authenticated API token user is required.",
                assertThrows(IllegalStateException.class, () -> materialMcpTools.createProject(request)).getMessage());
        verifyNoInteractions(pocketBaseClient);
    }

    @Test
    void createProjectRejectsJobListingReferences() {
        var request = new MaterialRequest.CreateProjectRequest(new MaterialRequest.ProjectData("Portfolio", "Tailored to a job listing", null, null, null, null, null, null, null), true);
        assertTrue(assertThrows(IllegalArgumentException.class, () -> materialMcpTools.createProject(request)).getMessage().contains("not allowed"));
        verifyNoInteractions(pocketBaseClient);
    }

    private Map<String, Object> response(String slug) { return Map.of("id", slug + "-id", "slug", slug); }
}
