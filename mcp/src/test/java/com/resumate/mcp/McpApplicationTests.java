package com.resumate.mcp;

import com.resumate.mcp.support.OAuthTestPropertiesInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;

@SpringBootTest
@ContextConfiguration(initializers = OAuthTestPropertiesInitializer.class)
class McpApplicationTests {

	@Test
	void contextLoads() {
	}

}
