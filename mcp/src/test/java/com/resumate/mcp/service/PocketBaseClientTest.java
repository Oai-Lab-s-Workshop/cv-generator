package com.resumate.mcp.service;

import com.resumate.mcp.config.PocketBaseProperties;
import com.resumate.mcp.service.PocketBaseClient.AiTokenRecord;
import com.resumate.mcp.service.PocketBaseClient.CreatedProfileRecord;
import com.resumate.mcp.service.PocketBaseClient.ProfileMaterialBundle;
import com.resumate.mcp.service.PocketBaseClient.TemplateDescriptor;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PocketBaseClientTest {

    private MockWebServer mockWebServer;
    private PocketBaseClient client;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        PocketBaseProperties properties = new PocketBaseProperties(
                mockWebServer.url("/").toString(),
                "service@test.com",
                "password123"
        );

        RestClient.Builder restClientBuilder = RestClient.builder();
        client = new PocketBaseClient(properties, restClientBuilder);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    private void enqueueAuthResponse() {
        mockWebServer.enqueue(new MockResponse()
                .setBody("{\"token\":\"auth-token-123\"}")
                .setHeader("Content-Type", "application/json"));
    }

    private void enqueueJsonResponse(String body) {
        mockWebServer.enqueue(new MockResponse()
                .setBody(body)
                .setHeader("Content-Type", "application/json"));
    }

    @Test
    void resolveAvailableTemplates_returnsAllTemplates() {
        List<TemplateDescriptor> result = client.resolveAvailableTemplates();

        assertThat(result).hasSize(4);
        assertThat(result.stream().map(TemplateDescriptor::id).toList())
                .containsExactly("classic", "modern", "minimal", "supa");
        assertThat(result.stream().map(TemplateDescriptor::description).toList())
                .containsExactly(
                        "Two-column CV with grouped experience, a dedicated contact panel, and categorized skills.",
                        "Split-sidebar resume with timeline-style . Most commmon CV layout.",
                        "Single-column minimalist resume with inline contact details and compact sections.",
                        "Clean, compact, print-first CV designed to fit into a sigle A4 page. Dynamic sizing, great for shocasing lots of Projects"
                );
    }

    @Test
    void findAiTokenByRawToken_returnsToken_whenFound() throws InterruptedException {
        enqueueAuthResponse();

        String tokenJson = """
                {
                    "items": [{
                    "id": "tokenId",
                    "user": "userId",
                    "label": "test",
                    "status": "active",
                    "token_hash": "abc123",
                    "token_prefix": "abc"
                }]
                }
                """;
        enqueueJsonResponse(tokenJson);

        Optional<AiTokenRecord> result = client.findAiTokenByRawToken("some-token");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo("tokenId");
        assertThat(result.get().user()).isEqualTo("userId");

        RecordedRequest authRequest = mockWebServer.takeRequest();
        assertThat(authRequest.getPath()).isEqualTo("/api/collections/users/auth-with-password");
    }

    @Test
    void findAiTokenByRawToken_returnsEmpty_whenNotFound() {
        enqueueAuthResponse();
        enqueueJsonResponse("{\"items\": []}");

        Optional<AiTokenRecord> result = client.findAiTokenByRawToken("unknown-token");

        assertThat(result).isEmpty();
    }

    @Test
    void loadProfileMaterial_returnsBundle() {
        enqueueAuthResponse();
        enqueueJsonResponse("""
                {
                    "id": "userId",
                    "firstName": "Jane",
                    "lastName": "Doe",
                    "linkedin": "https://linkedin.com/in/janedoe",
                    "github": "https://github.com/janedoe",
                    "website": "https://janedoe.dev",
                    "email": "jane@example.com",
                    "phone": "+1234567890"
                }
                """);

        String collectionResponse = "{\"items\": [{\"id\": \"test-id\", \"name\": \"test\"}]}";
        for (int i = 0; i < 6; i++) {
            enqueueAuthResponse();
            enqueueJsonResponse(collectionResponse);
        }

        ProfileMaterialBundle bundle = client.loadProfileMaterial("userId");

        assertThat(bundle.user().id()).isEqualTo("userId");
        assertThat(bundle.user().firstName()).isEqualTo("Jane");
    }

    @Test
    void validateOwnedRecordIds_passes_whenAllIdsBelongToUser() {
        enqueueAuthResponse();
        enqueueJsonResponse("{\"id\":\"skill1\",\"user\":\"userId\"}");
        enqueueAuthResponse();
        enqueueJsonResponse("{\"id\":\"skill2\",\"user\":\"userId\"}");

        client.validateOwnedRecordIds("skills", "userId", List.of("skill1", "skill2"));
    }

    @Test
    void validateOwnedRecordIds_throws_whenIdsDontMatch() {
        enqueueAuthResponse();
        enqueueJsonResponse("{\"id\":\"skill1\",\"user\":\"userId\"}");
        enqueueAuthResponse();
        enqueueJsonResponse("{\"id\":\"skill2\",\"user\":\"other-user\"}");

        assertThatThrownBy(() -> client.validateOwnedRecordIds("skills", "userId", List.of("skill1", "skill2")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("One or more selected records do not belong to the API key owner.");
    }

    @Test
    void validateOwnedRecordIds_skips_whenIdsListIsNull() {
        client.validateOwnedRecordIds("skills", "userId", null);
    }

    @Test
    void validateOwnedRecordIds_skips_whenIdsListIsEmpty() {
        client.validateOwnedRecordIds("skills", "userId", List.of());
    }

    @Test
    void createTailoredProfile_returnsCreatedRecord() {
        enqueueAuthResponse();
        enqueueJsonResponse("""
                {
                    "id": "profile123",
                    "slug": "classic--my-profile-1700000000000"
                }
                """);

        PocketBaseClient.CreateProfilePayload payload = new PocketBaseClient.CreateProfilePayload(
                "My Profile", "classic", "Summary",
                List.of("skill1"), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        CreatedProfileRecord result = client.createTailoredProfile("userId", payload);

        assertThat(result.id()).isEqualTo("profile123");
        assertThat(result.slug()).isEqualTo("classic--my-profile-1700000000000");
    }

    @Test
    void createTailoredProfile_throwsWithPocketBaseDetails_whenCreateFails() {
        enqueueAuthResponse();
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(400)
                .setBody("{\"message\":\"Failed to create record.\",\"data\":{\"details\":\"create rule failure\"}}")
                .setHeader(HttpHeaders.CONTENT_TYPE, "application/json"));

        PocketBaseClient.CreateProfilePayload payload = new PocketBaseClient.CreateProfilePayload(
                "My Profile", "classic", "Summary",
                List.of("skill1"), List.of(), List.of(), List.of(), List.of(), List.of()
        );

        assertThatThrownBy(() -> client.createTailoredProfile("userId", payload))
                .isInstanceOf(RestClientResponseException.class)
                .hasMessageContaining("400 Bad Request")
                .hasMessageContaining("Failed to create record");
    }

    @Test
    void markAiTokenUsed_sendsPatchRequest() throws InterruptedException {
        enqueueAuthResponse();
        mockWebServer.enqueue(new MockResponse().setResponseCode(200));

        client.markAiTokenUsed("token123");

        RecordedRequest authRequest = mockWebServer.takeRequest();
        assertThat(authRequest.getPath()).isEqualTo("/api/collections/users/auth-with-password");

        RecordedRequest patchRequest = mockWebServer.takeRequest();
        assertThat(patchRequest.getMethod()).isEqualTo("PATCH");
        assertThat(patchRequest.getPath()).isEqualTo("/api/collections/ai_tokens/records/token123");
        assertThat(patchRequest.getBody().readUtf8()).contains("lastUsedAt");
    }

    @Test
    void serviceUserToken_throws_whenCredentialsNotConfigured() {
        PocketBaseProperties badProperties = new PocketBaseProperties(
                "http://localhost:8090", null, null
        );
        PocketBaseClient badClient = new PocketBaseClient(badProperties, RestClient.builder());

        assertThatThrownBy(() -> badClient.findAiTokenByRawToken("token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("PocketBase MCP service-user credentials are not configured.");
    }
}
