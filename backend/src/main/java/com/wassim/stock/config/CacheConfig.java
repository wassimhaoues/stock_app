package com.wassim.stock.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
// Configuration de la cache avec Caffeine pour les produits et les entrepôts
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PRODUITS_CACHE = "produits";
    public static final String ENTREPOTS_CACHE = "entrepots";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.registerCustomCache(
                PRODUITS_CACHE,
                Caffeine.newBuilder()
                        .recordStats()
                        .expireAfterWrite(Duration.ofMinutes(5))
                        .maximumSize(500)
                        .build()
        );
        cacheManager.registerCustomCache(
                ENTREPOTS_CACHE,
                Caffeine.newBuilder()
                        .recordStats()
                        .expireAfterWrite(Duration.ofMinutes(5))
                        .maximumSize(200)
                        .build()
        );
        return cacheManager;
    }
}
