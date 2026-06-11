package fruit.farm.management;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * Singleton-container base: one PostgreSQL container is started once and shared by every
 * integration test class in the JVM (no {@code @Testcontainers}/{@code @Container}, which
 * would start/stop a container per class and time out when several integration classes run
 * together).
 *
 * <p>On Rancher Desktop the container's wait strategy reports "ready" based on the container's
 * internal state, but the userspace host port-forward (host {@code localhost:<port>} -> VM ->
 * container) can lag by a second or two. Fast-bootstrapping {@code @DataJpaTest} contexts then
 * connect before the forward exists and fail with "connection refused". We therefore actively
 * wait until the mapped port is reachable <em>from the host</em> before any context starts.
 */
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
        awaitHostPortReachable(POSTGRES.getHost(), POSTGRES.getMappedPort(PostgreSQLContainer.POSTGRESQL_PORT));
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    private static void awaitHostPortReachable(String host, int port) {
        for (int attempt = 0; attempt < 60; attempt++) {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(host, port), 1000);
                return;
            } catch (IOException notReadyYet) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        throw new IllegalStateException("PostgreSQL container port " + host + ":" + port + " not reachable from host");
    }
}
