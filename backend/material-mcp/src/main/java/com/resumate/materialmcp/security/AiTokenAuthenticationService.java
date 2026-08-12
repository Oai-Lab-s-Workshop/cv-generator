package com.resumate.materialmcp.security;

import com.resumate.materialmcp.config.PocketBaseProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Service for authenticating API keys against PocketBase.
 */
@Service
public class AiTokenAuthenticationService {

    private final RestClient restClient;
    private final PocketBaseProperties properties;

    public AiTokenAuthenticationService(RestClient.Builder restClientBuilder, PocketBaseProperties properties) {
        this.restClient = restClientBuilder.baseUrl(properties.baseUrl()).build();
        this.properties = properties;
    }

    /**
     * Authenticates an API key against PocketBase.
     * @param apiKey The API key to authenticate
     * @return Authenticated principal
     * @throws IllegalArgumentException if authentication fails
     */
    public AiTokenPrincipal authenticate(String apiKey) {
        // TODO: Implement actual PocketBase authentication
        // This is a placeholder implementation
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("API key is required.");
        }
        
        // In a real implementation, this would call PocketBase to validate the token
        // and return the user ID and token details
        return new AiTokenPrincipal("token-id", "user-id", "API Key");
    }
}