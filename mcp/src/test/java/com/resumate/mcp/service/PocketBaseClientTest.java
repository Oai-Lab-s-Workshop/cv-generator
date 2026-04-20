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
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.time.Instant;
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
    void resolveAllowedTemplates_returnsAllTemplates_whenAllowedListIsEmpty() {
        List<TemplateDescriptor> result = client.resolveAllowedTemplates(List.of());

        assertThat(result).hasSize(3);
        assertThat(result.stream().map(TemplateDescriptor::id).toList())
                .containsExactly("classic", "modern", "minimal");
    }

    @Test
    void resolveAllowedTemplates_filtersByAllowedIds() {
        List<TemplateDescriptor> result = client.resolveAllowedTemplates(List.of("classic", "modern"));

        assertThat(result).hasSize(2);
        assertThat(result.stream().map(TemplateDescriptor::id).toList())
                .containsExactly("classic", "modern");
    }

    @Test
    void resolveAllowedTemplates_returnsEmpty_whenNoMatchingIds() {
        List<TemplateDescriptor> result = client.resolveAllowedTemplates(List.of("nonexistent"));

        assertThat(result).isEmpty();
    }

    @Test
    void resolveAllowedTemplates_withAiTokenRecord_returnsAllWhenNull() {
        AiTokenRecord record = new AiTokenRecord(
                "id", "user", "label", "active", null,
                true, null, 5, 0, "hash", "prefix"
        );

        List<TemplateDescriptor> result = client.resolveAllowedTemplates(record);

        assertThat(result).hasSize(3);
    }

    @Test
    void resolveAllowedTemplates_withAiTokenRecord_filtersByTemplateIds() {
        AiTokenRecord record = new AiTokenRecord(
                "id", "user", "label", "active", null,
                true, List.of("classic"), 5, 0, "hash", "prefix"
        );

        List<TemplateDescriptor> result = client.resolveAllowedTemplates(record);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo("classic");
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
                        "canChooseTemplate": true,
                        "allowedTemplates": ["classic"],
                        "maxProfileCreates": 5,
                        "profileCreatesCount": 0,
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
        enqueueJsonResponse("{\"items\": [{\"id\": \"skill1\"}, {\"id\": \"skill2\"}]}");

        client.validateOwnedRecordIds("skills", "userId", List.of("skill1", "skill2"));
    }

    @Test
    void validateOwnedRecordIds_throws_whenIdsDontMatch() {
        enqueueAuthResponse();
        enqueueJsonResponse("{\"items\": [{\"id\": \"skill1\"}]}");

        assertThatThrownBy(() -> client.validateOwnedRecordIds("skills", "userId", List.of("skill1", "skill2")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("One or more selected records do not belong to the token owner.");
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
    void markTokenUsed_sendsPatchRequest() throws InterruptedException {
        enqueueAuthResponse();
        mockWebServer.enqueue(new MockResponse().setResponseCode(200));

        client.markTokenUsed("tokenId", 2);

        RecordedRequest authRequest = mockWebServer.takeRequest();
        assertThat(authRequest.getMethod()).isEqualTo("POST");
        assertThat(authRequest.getPath()).isEqualTo("/api/collections/users/auth-with-password");

        RecordedRequest patchRequest = mockWebServer.takeRequest();
        assertThat(patchRequest.getMethod()).isEqualTo("PATCH");
        assertThat(patchRequest.getPath()).contains("/api/collections/ai_tokens/records/tokenId");
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