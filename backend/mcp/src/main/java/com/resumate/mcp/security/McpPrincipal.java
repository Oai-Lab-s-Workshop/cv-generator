package com.resumate.mcp.security;

import java.security.Principal;

public interface McpPrincipal extends Principal {

    String userId();

    String label();

    String authSource();
}
