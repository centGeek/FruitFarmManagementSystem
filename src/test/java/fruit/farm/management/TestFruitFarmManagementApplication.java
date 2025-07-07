package fruit.farm.management;

import org.springframework.boot.SpringApplication;

public class TestFruitFarmManagementApplication {

	public static void main(String[] args) {
		SpringApplication.from(FruitFarmManagementApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
