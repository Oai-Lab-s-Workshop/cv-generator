package com.resumate.mcp;

import com.resumate.mcp.security.AiTokenPrincipal;
import com.resumate.mcp.service.PocketBaseClient;
import com.resumate.mcp.tool.CvMcpTools;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class TestData {

    public static final String TOKEN_ID = "token_abc123";
    public static final String USER_ID = "user_xyz789";
    public static final String TEMPLATE_CLASSIC = "classic";
    public static final String TEMPLATE_MODERN = "modern";
    public static final String TEMPLATE_MINIMAL = "minimal";
    public static final String PROFILE_NAME = "Senior Developer CV";
    public static final String PROFILE_SLUG = "classic--senior-developer-cv-1700000000000";
    public static final String PROFILE_ID = "profile_qrs456";
    public static final String FRONTEND_BASE_URL = "https://resumate.app";
    public static final String JOB_LISTING = "Looking for a senior Java developer...";

    private TestData() {
    }

    public static AiTokenPrincipal principal() {
        return new AiTokenPrincipal(TOKEN_ID, USER_ID, "test-token");
    }

    public static AiTokenPrincipal principalWithoutTemplateChoice() {
        return principal();
    }

    public static AiTokenPrincipal principalWithQuotaExceeded() {
        return principal();
    }

    public static AiTokenPrincipal principalWithNoAllowedTemplates() {
        return principal();
    }

    public static PocketBaseClient.AiTokenRecord aiTokenRecord() {
        return new PocketBaseClient.AiTokenRecord(
                TOKEN_ID, USER_ID, "test-token", "active",
                Instant.now().plusSeconds(3600).toString(),
                "abc123hash", "abc"
        );
    }

    public static PocketBaseClient.AiTokenRecord expiredAiTokenRecord() {
        return new PocketBaseClient.AiTokenRecord(
                TOKEN_ID, USER_ID, "test-token", "active",
                Instant.now().minusSeconds(3600).toString(),
                "abc123hash", "abc"
        );
    }

    public static PocketBaseClient.AiTokenRecord inactiveAiTokenRecord() {
        return new PocketBaseClient.AiTokenRecord(
                TOKEN_ID, USER_ID, "test-token", "revoked",
                Instant.now().plusSeconds(3600).toString(),
                "abc123hash", "abc"
        );
    }

    public static PocketBaseClient.UserRecord userRecord() {
        return new PocketBaseClient.UserRecord(
                USER_ID, "Jane", "Doe",
                "https://linkedin.com/in/janedoe",
                "https://github.com/janedoe",
                "https://janedoe.dev",
                "jane@example.com", "+1234567890"
        );
    }

    public static PocketBaseClient.ProfileMaterialBundle profileMaterialBundle() {
        return new PocketBaseClient.ProfileMaterialBundle(
                userRecord(),
                List.of(Map.of("id", "skill1", "name", "Java")),
                List.of(Map.of("id", "job1", "title", "Senior Developer")),
                List.of(Map.of("id", "proj1", "name", "Project Alpha")),
                List.of(Map.of("id", "ach1", "title", "Award")),
                List.of(Map.of("id", "deg1", "title", "BSc Computer Science")),
                List.of(Map.of("id", "hob1", "name", "Reading"))
        );
    }

    public static PocketBaseClient.CreatedProfileRecord createdProfileRecord() {
        return new PocketBaseClient.CreatedProfileRecord(PROFILE_ID, PROFILE_SLUG);
    }

    public static CvMcpTools.CreateTailoredCvProfileRequest createCvRequest() {
        return new CvMcpTools.CreateTailoredCvProfileRequest(
                PROFILE_NAME, JOB_LISTING, TEMPLATE_CLASSIC,
                "Experienced Java developer",
                List.of("skill1"), List.of("job1"), List.of("proj1"),
                List.of("ach1"), List.of("deg1"), List.of("hob1")
        );
    }
}
