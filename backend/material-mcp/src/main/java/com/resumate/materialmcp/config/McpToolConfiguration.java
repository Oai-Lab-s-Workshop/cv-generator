package com.resumate.materialmcp.config;

import com.resumate.materialmcp.tool.MaterialMcpTools;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * MCP Tool Configuration for Material MCP Server.
 * Registers the material creation tools with the MCP server.
 */
@Configuration
public class McpToolConfiguration {

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    ToolCallbackProvider materialToolCallbacks(MaterialMcpTools materialMcpTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(materialMcpTools)
                .build();
    }
}