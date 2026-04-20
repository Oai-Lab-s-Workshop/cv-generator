package com.resumate.mcp.security;

import java.security.Principal;
import java.util.List;
import java.util.Set;

public record AiTokenPrincipal(
        String tokenId,
        String userId,
        boolean canChooseTemplate,
        Set<String> allowedTemplates,
        Integer maxProfileCreates,
        int profileCreatesCount,
        String label
) implements Principal {

    @Override
    public String getName() {
        return label == null || label.isBlank() ? tokenId : label;
    }

    public List<String> allowedTemplatesList() {
        return allowedTemplates.stream().sorted().toList();
    }
}
