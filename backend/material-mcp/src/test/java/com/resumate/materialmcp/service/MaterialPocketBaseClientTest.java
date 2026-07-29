package com.resumate.materialmcp.service;

import com.resumate.materialmcp.config.PocketBaseProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

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
    private PocketBaseProperties pocketBaseProperties;

    @InjectMocks
    private MaterialPocketBaseClient client;

    @BeforeEach
    void setUp() {
        when(restClientBuilder.baseUrl(anyString())).thenReturn(restClientBuilder);
        when(restClientBuilder.build()).thenReturn(restClient);
        when(pocketBaseProperties.baseUrl()).thenReturn("http://localhost:8090");
        
        client = new MaterialPocketBaseClient(restClientBuilder, pocketBaseProperties);
    }

    @Test
    void testCreateProject() {
        Map<String, Object> mockResponse = Map.of(
                "id", "proj123",
                "user", "user123",
                "data", Map.of("title", "Test Project")
        );
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.createProject("user123", Map.of("title", "Test Project"));
        
        assertNotNull(result);
        assertEquals("proj123", result.get("id"));
        verify(restClient).post();
        verify(requestBodyUriSpec).uri("/api/collections/projects/records");
    }

    @Test
    void testCreateAchievement() {
        Map<String, Object> mockResponse = Map.of(
                "id", "ach123",
                "user", "user123",
                "data", Map.of("title", "Test Achievement")
        );
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.createAchievement("user123", Map.of("title", "Test Achievement"));
        
        assertNotNull(result);
        assertEquals("ach123", result.get("id"));
        verify(restClient).post();
        verify(requestBodyUriSpec).uri("/api/collections/achievements/records");
    }

    @Test
    void testCreateSkill() {
        Map<String, Object> mockResponse = Map.of(
                "id", "skill123",
                "user", "user123",
                "data", Map.of("name", "Test Skill")
        );
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.createSkill("user123", Map.of("name", "Test Skill"));
        
        assertNotNull(result);
        assertEquals("skill123", result.get("id"));
        verify(restClient).post();
        verify(requestBodyUriSpec).uri("/api/collections/skills/records");
    }

    @Test
    void testCreateJob() {
        Map<String, Object> mockResponse = Map.of(
                "id", "job123",
                "user", "user123",
                "data", Map.of("title", "Test Job")
        );
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.createJob("user123", Map.of("title", "Test Job"));
        
        assertNotNull(result);
        assertEquals("job123", result.get("id"));
        verify(restClient).post();
        verify(requestBodyUriSpec).uri("/api/collections/jobs/records");
    }

    @Test
    void testCreateDegree() {
        Map<String, Object> mockResponse = Map.of(
                "id", "deg123",
                "user", "user123",
                "data", Map.of("title", "Test Degree")
        );
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.createDegree("user123", Map.of("title", "Test Degree"));
        
        assertNotNull(result);
        assertEquals("deg123", result.get("id"));
        verify(restClient).post();
        verify(requestBodyUriSpec).uri("/api/collections/degrees/records");
    }

    @Test
    void testCreateHobby() {
        Map<String, Object> mockResponse = Map.of(
                "id", "hobby123",
                "user", "user123",
                "data", Map.of("name", "Test Hobby")
        );
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.createHobby("user123", Map.of("name", "Test Hobby"));
        
        assertNotNull(result);
        assertEquals("hobby123", result.get("id"));
        verify(restClient).post();
        verify(requestBodyUriSpec).uri("/api/collections/hobbies/records");
    }

    @Test
    void testUpdateProject() {
        Map<String, Object> mockResponse = Map.of(
                "id", "proj123",
                "user", "user123",
                "data", Map.of("title", "Updated Project")
        );
        
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.updateProject("proj123", Map.of("title", "Updated Project"));
        
        assertNotNull(result);
        assertEquals("proj123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/projects/records/{id}", "proj123");
    }

    @Test
    void testUpdateAchievement() {
        Map<String, Object> mockResponse = Map.of(
                "id", "ach123",
                "user", "user123",
                "data", Map.of("title", "Updated Achievement")
        );
        
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.updateAchievement("ach123", Map.of("title", "Updated Achievement"));
        
        assertNotNull(result);
        assertEquals("ach123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/achievements/records/{id}", "ach123");
    }

    @Test
    void testUpdateSkill() {
        Map<String, Object> mockResponse = Map.of(
                "id", "skill123",
                "user", "user123",
                "data", Map.of("name", "Updated Skill")
        );
        
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.updateSkill("skill123", Map.of("name", "Updated Skill"));
        
        assertNotNull(result);
        assertEquals("skill123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/skills/records/{id}", "skill123");
    }

    @Test
    void testUpdateJob() {
        Map<String, Object> mockResponse = Map.of(
                "id", "job123",
                "user", "user123",
                "data", Map.of("title", "Updated Job")
        );
        
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.updateJob("job123", Map.of("title", "Updated Job"));
        
        assertNotNull(result);
        assertEquals("job123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/jobs/records/{id}", "job123");
    }

    @Test
    void testUpdateDegree() {
        Map<String, Object> mockResponse = Map.of(
                "id", "deg123",
                "user", "user123",
                "data", Map.of("title", "Updated Degree")
        );
        
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.updateDegree("deg123", Map.of("title", "Updated Degree"));
        
        assertNotNull(result);
        assertEquals("deg123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/degrees/records/{id}", "deg123");
    }

    @Test
    void testUpdateHobby() {
        Map<String, Object> mockResponse = Map.of(
                "id", "hobby123",
                "user", "user123",
                "data", Map.of("name", "Updated Hobby")
        );
        
        when(restClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(Map.class)).thenReturn(mockResponse);
        
        Map<String, Object> result = client.updateHobby("hobby123", Map.of("name", "Updated Hobby"));
        
        assertNotNull(result);
        assertEquals("hobby123", result.get("id"));
        verify(restClient).patch();
        verify(requestBodyUriSpec).uri("/api/collections/hobbies/records/{id}", "hobby123");
    }
}