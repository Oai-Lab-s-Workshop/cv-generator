package com.resumate.materialmcp.security;

import java.security.Principal;

/**
 * Principal interface for Material MCP authentication.
 * This is a separate interface from the main MCP to ensure type safety
 * and prevent accidental mixing of concerns.
 */
public sealed interface McpPrincipal extends Principal permits AiTokenPrincipal {

    String userId();

    String label();

    String authSource();
}