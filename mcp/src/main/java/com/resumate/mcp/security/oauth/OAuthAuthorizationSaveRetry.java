package com.resumate.mcp.security.oauth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientResponseException;

/**
 * Retries an {@code oauth_authorizations} save when a concurrent writer wins the race and the unique
 * {@code state_id} index rejects the duplicate with HTTP 409. The contending writer falls back to an
 * update on the next attempt, after the winning record has been committed.
 */
final class OAuthAuthorizationSaveRetry {

    private static final Logger logger = LoggerFactory.getLogger(OAuthAuthorizationSaveRetry.class);

    private static final int MAX_ATTEMPTS = 3;
    private static final long BASE_BACKOFF_MILLIS = 100L;

    private OAuthAuthorizationSaveRetry() {
    }

    static void save(String description, Runnable saveOperation) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                saveOperation.run();
                return;
            } catch (RestClientResponseException ex) {
                if (!isConflict(ex) || attempt == MAX_ATTEMPTS) {
                    logger.error(
                            "PocketBase oauth_authorizations save failed after {} attempt(s) for {}: status={}",
                            attempt,
                            description,
                            ex.getStatusCode().value()
                    );
                    throw ex;
                }
                logger.warn(
                        "PocketBase oauth_authorizations save conflicted (attempt {}/{}) for {}; retrying as update.",
                        attempt,
                        MAX_ATTEMPTS,
                        description
                );
                // Exponential backoff: 100ms, 200ms, 400ms.
                sleep(BASE_BACKOFF_MILLIS << (attempt - 1));
            }
        }
    }

    private static boolean isConflict(RestClientResponseException ex) {
        return ex.getStatusCode().isSameCodeAs(HttpStatus.CONFLICT);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while retrying OAuth authorization save.", ex);
        }
    }
}
