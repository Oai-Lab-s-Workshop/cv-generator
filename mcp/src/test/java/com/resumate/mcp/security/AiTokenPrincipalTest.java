package com.resumate.mcp.security;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AiTokenPrincipalTest {

    @Test
    void getName_returnsLabel_whenLabelIsPresent() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("classic"), 5, 0, "my-label"
        );

        assertThat(principal.getName()).isEqualTo("my-label");
    }

    @Test
    void getName_returnsTokenId_whenLabelIsNull() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("classic"), 5, 0, null
        );

        assertThat(principal.getName()).isEqualTo("tokenId");
    }

    @Test
    void getName_returnsTokenId_whenLabelIsBlank() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("classic"), 5, 0, "   "
        );

        assertThat(principal.getName()).isEqualTo("tokenId");
    }

    @Test
    void getName_returnsTokenId_whenLabelIsEmpty() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("classic"), 5, 0, ""
        );

        assertThat(principal.getName()).isEqualTo("tokenId");
    }

    @Test
    void allowedTemplatesList_returnsSortedList() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("minimal", "classic", "modern"), 5, 0, "label"
        );

        List<String> templates = principal.allowedTemplatesList();

        assertThat(templates).containsExactly("classic", "minimal", "modern");
    }

    @Test
    void allowedTemplatesList_returnsEmptyList_whenSetIsEmpty() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of(), 5, 0, "label"
        );

        assertThat(principal.allowedTemplatesList()).isEmpty();
    }

    @Test
    void implementsPrincipal() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", true, Set.of("classic"), 5, 0, "label"
        );

        assertThat(principal).isInstanceOf(java.security.Principal.class);
    }
}