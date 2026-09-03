package com.resumate.materialmcp;

import com.resumate.materialmcp.config.McpToolConfiguration;
import com.resumate.materialmcp.service.MaterialPocketBaseClient;
import com.resumate.materialmcp.tools.MaterialMcpTools;
import org.junit.jupiter.api.Test;
import org.springframework.ai.mcp.server.common.autoconfigure.properties.McpServerProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MaterialMcpApplicationTest {

    @MockitoBean
    MaterialPocketBaseClient pocketBaseClient;

    @Test
    void configuresTheMaterialWebMvcMcpServer(@org.springframework.beans.factory.annotation.Autowired McpToolConfiguration configuration,
                                               @org.springframework.beans.factory.annotation.Autowired MaterialMcpTools tools,
                                               @org.springframework.beans.factory.annotation.Autowired McpServerProperties properties) {
        assertThat(configuration).isNotNull();
        assertThat(tools).isNotNull();
        assertThat(properties.getInstructions()).contains("creating standalone resume materials");
    }
}
