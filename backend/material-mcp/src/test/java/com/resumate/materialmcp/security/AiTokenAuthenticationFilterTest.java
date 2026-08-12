package com.resumate.materialmcp.security;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class AiTokenAuthenticationFilterTest {

    private final TestableAiTokenAuthenticationFilter filter = new TestableAiTokenAuthenticationFilter();

    @ParameterizedTest
    @ValueSource(strings = {"/mcp", "/mcp/tools", "/api/materials", "/api/materials/projects"})
    void filtersProtectedMcpAndMaterialApiPaths(String path) {
        assertFalse(filter.shouldSkip(path));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/", "/api/material", "/api/materials-extra", "/actuator/health"})
    void skipsPathsOutsideProtectedMcpAndMaterialApiPaths(String path) {
        assertTrue(filter.shouldSkip(path));
    }

    private static class TestableAiTokenAuthenticationFilter extends AiTokenAuthenticationFilter {

        TestableAiTokenAuthenticationFilter() {
            super(mock(AiTokenAuthenticationService.class));
        }

        boolean shouldSkip(String path) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI(path);
            return shouldNotFilter(request);
        }
    }
}
