package com.wassim.stock;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class StockBackendApplicationTests {

	@Test
	void contextLoads() {
		// Intentionally empty: @SpringBootTest fails if the application context cannot start.
	}

}
