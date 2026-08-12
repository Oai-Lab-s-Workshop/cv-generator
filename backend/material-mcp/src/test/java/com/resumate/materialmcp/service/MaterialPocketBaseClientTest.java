package com.resumate.materialmcp.service;

import com.resumate.materialmcp.config.PocketBaseProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterialPocketBaseClientTest {

    @Mock
    private RestClient.Builder restClientBuilder;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    @Mock
    @SuppressWarnings("rawtypes")
    private RestClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    @SuppressWarnings("rawtypes")
    private RestClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private PocketBaseProperties pocketBaseProperties;

    private MaterialPocketBaseClient client;

    @BeforeEach
    void setUp() {
        when(restClientBuilder.baseUrl(anyString())).thenReturn(restClientBuilder);
        when(restClientBuilder.build()).thenReturn(restClient);
        when(pocketBaseProperties.baseUrl()).thenReturn("http://localhost:8090");
        when(pocketBaseProperties.serviceUserEmail()).thenReturn("service@example.test");
        when(pocketBaseProperties.serviceUserPassword()).thenReturn("test-password");
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), any(Object[].class))).thenReturn(requestBodySpec);
        lenient().when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        client = new MaterialPocketBaseClient(restClientBuilder, pocketBaseProperties);
    }

    @Test
    void testCreateProject() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "proj123",
                "slug", "test-project",
                "user", "user123",
                "title", "Test Project"
        );

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.createProject("user123", Map.of(
                "title", "Test Project",
                "description", "Description",
                "startDate", "2020-01-01",
                "endDate", "2021-01-01",
                "role", "Developer",
                "technologies", "Java",
                "responsibilities", "Build",
                "outcomes", "Delivered"
        ));

        assertNotNull(result);
        assertEquals("proj123", result.get("id"));
        verify(restClient, times(2)).post();
        verify(requestBodyUriSpec).uri("/api/collections/projects/records");
    }

    @Test
    void testCreateAchievement() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "ach123",
                "slug", "test-achievement",
                "user", "user123",
                "title", "Test Achievement"
        );

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.createAchievement("user123", Map.of(
                "title", "Test Achievement",
                "description", "Description",
                "date", "2021-01-01",
                "type", "Award",
                "issuer", "Issuer"
        ));

        assertNotNull(result);
        assertEquals("ach123", result.get("id"));
        verify(restClient, times(2)).post();
        verify(requestBodyUriSpec).uri("/api/collections/achievements/records");
    }

    @Test
    void testCreateSkill() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "skill123",
                "slug", "test-skill",
                "user", "user123",
                "name", "Test Skill"
        );

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.createSkill("user123", Map.of(
                "name", "Test Skill",
                "level", "Advanced",
                "category", "Technical",
                "yearsOfExperience", 5
        ));

        assertNotNull(result);
        assertEquals("skill123", result.get("id"));
        verify(restClient, times(2)).post();
        verify(requestBodyUriSpec).uri("/api/collections/skills/records");
    }

    @Test
    void testCreateJob() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "job123",
                "slug", "test-job",
                "user", "user123",
                "title", "Test Job"
        );

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.createJob("user123", Map.of(
                "title", "Test Job",
                "description", "Description",
                "company", "Company",
                "startDate", "2020-01-01",
                "endDate", "2021-01-01",
                "location", "Remote",
                "responsibilities", "Build",
                "requirements", "Java"
        ));

        assertNotNull(result);
        assertEquals("job123", result.get("id"));
        verify(restClient, times(2)).post();
        verify(requestBodyUriSpec).uri("/api/collections/jobs/records");
    }

    @Test
    void testCreateDegree() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "deg123",
                "slug", "test-degree",
                "user", "user123",
                "title", "Test Degree"
        );

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> degree = new LinkedHashMap<>();
        degree.put("title", "Test Degree");
        degree.put("school", "University");
        degree.put("year", "2019");
        degree.put("level", "Bachelor");
        degree.put("sortOrder", 1);
        Map<String, Object> result = client.createDegree("user123", degree);

        assertNotNull(result);
        assertEquals("deg123", result.get("id"));
        verify(restClient, times(2)).post();
        verify(requestBodyUriSpec).uri("/api/collections/degrees/records");
        ArgumentCaptor<Object> requestBodies = ArgumentCaptor.forClass(Object.class);
        verify(requestBodySpec, times(2)).body(requestBodies.capture());
        assertEquals("user123", ((Map<?, ?>) requestBodies.getAllValues().get(1)).get("user"));
    }

    @Test
    void testCreateHobby() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "hobby123",
                "slug", "test-hobby",
                "user", "user123",
                "name", "Test Hobby"
        );

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> hobby = new LinkedHashMap<>();
        hobby.put("name", "Test Hobby");
        hobby.put("description", "Description");
        hobby.put("sortOrder", 1);
        Map<String, Object> result = client.createHobby("user123", hobby);

        assertNotNull(result);
        assertEquals("hobby123", result.get("id"));
        verify(restClient, times(2)).post();
        verify(requestBodyUriSpec).uri("/api/collections/hobbies/records");
        ArgumentCaptor<Object> requestBodies = ArgumentCaptor.forClass(Object.class);
        verify(requestBodySpec, times(2)).body(requestBodies.capture());
        assertEquals("user123", ((Map<?, ?>) requestBodies.getAllValues().get(1)).get("user"));
    }

    @Test
    void testUpdateProject() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "proj123",
                "slug", "updated-project",
                "user", "user123",
                "title", "Updated Project"
        );

        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.updateProject("proj123", Map.of("title", "Updated Project"));

        assertNotNull(result);
        assertEquals("proj123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/projects/records/{id}", "proj123");
    }

    @Test
    void testUpdateAchievement() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "ach123",
                "slug", "updated-achievement",
                "user", "user123",
                "title", "Updated Achievement"
        );

        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.updateAchievement("ach123", Map.of("title", "Updated Achievement"));

        assertNotNull(result);
        assertEquals("ach123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/achievements/records/{id}", "ach123");
    }

    @Test
    void testUpdateSkill() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "skill123",
                "slug", "updated-skill",
                "user", "user123",
                "name", "Updated Skill"
        );

        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.updateSkill("skill123", Map.of("name", "Updated Skill"));

        assertNotNull(result);
        assertEquals("skill123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/skills/records/{id}", "skill123");
    }

    @Test
    void testUpdateJob() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "job123",
                "slug", "updated-job",
                "user", "user123",
                "title", "Updated Job"
        );

        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.updateJob("job123", Map.of("title", "Updated Job"));

        assertNotNull(result);
        assertEquals("job123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/jobs/records/{id}", "job123");
    }

    @Test
    void testUpdateDegree() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "deg123",
                "slug", "updated-degree",
                "user", "user123",
                "title", "Updated Degree"
        );

        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.updateDegree("deg123", Map.of("title", "Updated Degree"));

        assertNotNull(result);
        assertEquals("deg123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/degrees/records/{id}", "deg123");
    }

    @Test
    void testUpdateHobby() {
        Map<String, Object> authResponse = Map.of("token", "test-admin-token");
        Map<String, Object> mockResponse = Map.of(
                "id", "hobby123",
                "slug", "updated-hobby",
                "user", "user123",
                "name", "Updated Hobby"
        );

        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(responseSpec.body(Map.class)).thenReturn(authResponse, mockResponse);

        Map<String, Object> result = client.updateHobby("hobby123", Map.of("name", "Updated Hobby"));

        assertNotNull(result);
        assertEquals("hobby123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/hobbies/records/{id}", "hobby123");
    }

    @Test
    void validateOwnedRecordId_allowsTheAuthenticatedUsersRecord() {
        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.header(anyString(), anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(Map.of("token", "admin-token"), Map.of("id", "project-id", "user", "user123"));

        client.validateOwnedRecordId("projects", "user123", "project-id");

        verify(requestHeadersUriSpec).uri("/api/collections/{collection}/records/{id}", "projects", "project-id");
    }

    @Test
    void validateOwnedRecordId_rejectsAnotherUsersRecord() {
        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.header(anyString(), anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(Map.of("token", "admin-token"), Map.of("id", "project-id", "user", "other-user"));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> client.validateOwnedRecordId("projects", "user123", "project-id"));

        assertEquals("Record does not belong to the authenticated user.", error.getMessage());
    }
}
