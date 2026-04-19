package com.wassim.stock;

import com.wassim.stock.config.properties.StockProProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(StockProProperties.class)
public class StockBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(StockBackendApplication.class, args);
	}

}
