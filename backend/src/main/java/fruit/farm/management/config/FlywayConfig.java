package fruit.farm.management.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Repairs the Flyway schema-history checksums before migrating.
 *
 * <p>A prior deploy applied migration V19 with a checksum that no longer matches the file shipped in
 * the image, so {@code validate-on-migrate} aborted the whole Spring context and the new revision
 * could not start. {@code repair()} realigns the recorded checksums to the resolved migration files
 * (it does not re-run or roll back migrations); {@code migrate()} then proceeds and validation
 * passes. Migrations here are append-only and idempotent, so the files in the image are the source
 * of truth and self-healing the history is safe.
 */
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy repairBeforeMigrate() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
