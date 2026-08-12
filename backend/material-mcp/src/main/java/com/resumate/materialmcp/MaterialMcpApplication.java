package com.resumate.materialmcp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Resumate Material MCP Server
 *
 * This MCP server provides tools for creating and managing resume materials
 * (projects, achievements, skills, jobs, degrees, hobbies).
 *
 * CRITICAL SAFETY NOTE: This server CANNOT and SHOULD NOT be used for
 * tailoring CV profiles to specific job listings. It is strictly for
 * creating standalone resume materials that the user owns.
 *
 * Users must explicitly activate this MCP server separately from the
 * main Resumate MCP server.
 */
@SpringBootApplication
@ConfigurationPropertiesScan(basePackages = {"com.resumate.materialmcp.config"})
public class MaterialMcpApplication {

    public static void main(String[] args) {
        SpringApplication.run(MaterialMcpApplication.class, args);
    }
}
