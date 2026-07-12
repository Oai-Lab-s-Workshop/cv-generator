package com.resumate.mcp.support;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

public class OAuthTestPropertiesInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final String TEST_JWK = generateJwk();

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        TestPropertyValues.of(
                "resumate.oauth.public-base-url=https://mcp.example.test",
                "resumate.oauth.jwk=" + TEST_JWK
        ).applyTo(applicationContext);
    }

    public static String testJwk() {
        return TEST_JWK;
    }

    private static String generateJwk() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();

            return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                    .privateKey((RSAPrivateKey) keyPair.getPrivate())
                    .keyIDFromThumbprint()
                    .build()
                    .toJSONString();
        } catch (NoSuchAlgorithmException | JOSEException ex) {
            throw new IllegalStateException("Unable to generate test OAuth RSA JWK.", ex);
        }
    }
}
