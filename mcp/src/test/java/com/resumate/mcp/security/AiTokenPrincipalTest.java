package com.resumate.mcp.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiTokenPrincipalTest {

    @Test
    void getName_returnsLabel_whenLabelIsPresent() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "my-label"
        );

        assertThat(principal.getName()).isEqualTo("my-label");
    }

    @Test
    void getName_returnsTokenId_whenLabelIsNull() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", null
        );

        assertThat(principal.getName()).isEqualTo("tokenId");
    }

    @Test
    void getName_returnsTokenId_whenLabelIsBlank() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "   "
        );

        assertThat(principal.getName()).isEqualTo("tokenId");
    }

    @Test
    void getName_returnsTokenId_whenLabelIsEmpty() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", ""
        );

        assertThat(principal.getName()).isEqualTo("tokenId");
    }

    @Test
    void implementsPrincipal() {
        AiTokenPrincipal principal = new AiTokenPrincipal(
                "tokenId", "userId", "label"
        );

        assertThat(principal).isInstanceOf(java.security.Principal.class);
    }
}
