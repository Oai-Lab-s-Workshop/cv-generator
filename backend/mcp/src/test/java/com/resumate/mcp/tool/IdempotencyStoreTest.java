package com.resumate.mcp.tool;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class IdempotencyStoreTest {

    @Test
    void get_returnsNull_whenKeyNotStored() {
        IdempotencyStore store = new IdempotencyStore(Duration.ofMinutes(5));

        IdempotencyStore.IdempotencyRecord result = store.get("user1", "key1");

        assertThat(result).isNull();
    }

    @Test
    void get_returnsRecord_afterPut() {
        IdempotencyStore store = new IdempotencyStore(Duration.ofMinutes(5));

        store.put("user1", "key1", "profileId1", "slug1");
        IdempotencyStore.IdempotencyRecord result = store.get("user1", "key1");

        assertThat(result).isNotNull();
        assertThat(result.profileId()).isEqualTo("profileId1");
        assertThat(result.slug()).isEqualTo("slug1");
        assertThat(result.createdAt()).isNotNull();
    }

    @Test
    void differentKeys_returnSeparateRecords() {
        IdempotencyStore store = new IdempotencyStore(Duration.ofMinutes(5));

        store.put("user1", "key1", "profileId1", "slug1");
        store.put("user1", "key2", "profileId2", "slug2");

        assertThat(store.get("user1", "key1").profileId()).isEqualTo("profileId1");
        assertThat(store.get("user1", "key2").profileId()).isEqualTo("profileId2");
    }

    @Test
    void sameKey_differentUsers_doNotCollide() {
        IdempotencyStore store = new IdempotencyStore(Duration.ofMinutes(5));

        store.put("user1", "key1", "profileId1", "slug1");
        store.put("user2", "key1", "profileId2", "slug2");

        assertThat(store.get("user1", "key1").profileId()).isEqualTo("profileId1");
        assertThat(store.get("user2", "key1").profileId()).isEqualTo("profileId2");
    }

    @Test
    void put_overwritesExistingKey() {
        IdempotencyStore store = new IdempotencyStore(Duration.ofMinutes(5));

        store.put("user1", "key1", "profileId1", "slug1");
        store.put("user1", "key1", "profileId2", "slug2");

        assertThat(store.get("user1", "key1").profileId()).isEqualTo("profileId2");
    }

    @Test
    void entryExpires_afterTtl() throws InterruptedException {
        IdempotencyStore store = new IdempotencyStore(Duration.ofMillis(1));

        store.put("user1", "key1", "profileId1", "slug1");
        Thread.sleep(2);

        IdempotencyStore.IdempotencyRecord result = store.get("user1", "key1");
        assertThat(result).isNull();
    }
}
