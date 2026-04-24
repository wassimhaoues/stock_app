package com.wassim.stock.service;

import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.lang.reflect.Method;

import static com.wassim.stock.config.CacheConfig.ENTREPOTS_CACHE;
import static org.assertj.core.api.Assertions.assertThat;

class EntrepotServiceCacheTest {

    @Test
    void findAllIsCacheableWithUserScopedKey() throws NoSuchMethodException {
        Method method = EntrepotService.class.getMethod("findAll");

        Cacheable cacheable = method.getAnnotation(Cacheable.class);

        assertThat(cacheable).isNotNull();
        assertThat(cacheable.value()).containsExactly(ENTREPOTS_CACHE);
        assertThat(cacheable.key()).isEqualTo("@cacheKeyService.entrepotsKey()");
    }

    @Test
    void createEvictsAllEntrepotsCacheEntries() throws NoSuchMethodException {
        Method method = EntrepotService.class.getMethod(
                "create",
                com.wassim.stock.dto.request.EntrepotRequest.class
        );

        CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

        assertThat(cacheEvict).isNotNull();
        assertThat(cacheEvict.value()).containsExactly(ENTREPOTS_CACHE);
        assertThat(cacheEvict.allEntries()).isTrue();
    }

    @Test
    void deleteEvictsAllEntrepotsCacheEntries() throws NoSuchMethodException {
        Method method = EntrepotService.class.getMethod("delete", Long.class);

        CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

        assertThat(cacheEvict).isNotNull();
        assertThat(cacheEvict.value()).containsExactly(ENTREPOTS_CACHE);
        assertThat(cacheEvict.allEntries()).isTrue();
    }
}
