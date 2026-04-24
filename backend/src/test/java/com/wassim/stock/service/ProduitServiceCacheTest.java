package com.wassim.stock.service;

import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.lang.reflect.Method;

import static com.wassim.stock.config.CacheConfig.PRODUITS_CACHE;
import static org.assertj.core.api.Assertions.assertThat;

class ProduitServiceCacheTest {

    @Test
    void findAllIsCacheableOnProduitsCache() throws NoSuchMethodException {
        Method method = ProduitService.class.getMethod("findAll");

        Cacheable cacheable = method.getAnnotation(Cacheable.class);

        assertThat(cacheable).isNotNull();
        assertThat(cacheable.value()).containsExactly(PRODUITS_CACHE);
    }

    @Test
    void createEvictsAllProduitsCacheEntries() throws NoSuchMethodException {
        Method method = ProduitService.class.getMethod(
                "create",
                com.wassim.stock.dto.request.ProduitRequest.class
        );

        CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

        assertThat(cacheEvict).isNotNull();
        assertThat(cacheEvict.value()).containsExactly(PRODUITS_CACHE);
        assertThat(cacheEvict.allEntries()).isTrue();
    }

    @Test
    void deleteEvictsAllProduitsCacheEntries() throws NoSuchMethodException {
        Method method = ProduitService.class.getMethod("delete", Long.class);

        CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

        assertThat(cacheEvict).isNotNull();
        assertThat(cacheEvict.value()).containsExactly(PRODUITS_CACHE);
        assertThat(cacheEvict.allEntries()).isTrue();
    }
}
