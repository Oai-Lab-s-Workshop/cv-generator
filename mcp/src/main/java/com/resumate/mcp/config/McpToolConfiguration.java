package com.resumate.mcp.config;

import com.resumate.mcp.tool.CvMcpTools;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpToolConfiguration {

    @Bean
    ToolCallbackProvider resumateToolCallbacks(CvMcpTools cvMcpTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(cvMcpTools)
                .build();
    }
}
