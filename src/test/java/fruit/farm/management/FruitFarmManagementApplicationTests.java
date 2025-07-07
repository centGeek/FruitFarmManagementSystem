package fruit.farm.management;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class FruitFarmManagementApplicationTests {

	@Test
	void contextLoads() {
	}

}
