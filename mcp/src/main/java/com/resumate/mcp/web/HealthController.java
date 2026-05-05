package com.resumate.mcp.web;

import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @CrossOrigin(origins = "*")
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
