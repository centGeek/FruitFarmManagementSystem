---
name: add-tests
description: Write AND update production-ready Spring Boot backend tests for the Fruit Farm Management System — unit (logic/mappers), service (Mockito), web (@WebMvcTest + MockMvc + Spring Security), repository (@DataJpaTest + Testcontainers PostgreSQL + Flyway) and integration (@SpringBootTest). Use when asked to write/add/update/fix/extend tests, cover a class/service/controller, raise coverage, or repair a failing/outdated test. The suite lives in backend/src/test/.
---

# add-tests — write & update backend tests

`backend/src/test/` **already exists** with a real suite (mappers, services, controllers, repositories,
integration). All deps are in `pom.xml` (JUnit 5, Mockito, AssertJ, MockMvc via `spring-boot-starter-test`,
`spring-security-test`, Testcontainers `junit-jupiter` + `postgresql`, Flyway). SB 3.5.3, Java 21.
**Nothing needs to be added to `pom.xml`.** Tests mirror the main package under
`backend/src/test/java/fruit/farm/management/`.

## Running the tests (this machine needs JDK 21 + Rancher's Docker socket)

The system JDK is 25 (Lombok won't compile under it) and Docker is Rancher Desktop, so Testcontainers
can't auto-find the socket. **Canonical command:**

```bash
DOCKER_HOST=unix:///Users/lukasz.centkowski/.rd/docker.sock \
JAVA_HOME=~/.sdkman/candidates/java/21.0.6-tem \
./mvnw test
```

- Pure unit tests (mappers, services, web-slice, `JwtService`) need **only** `JAVA_HOME` (no Docker).
- One test: add `-Dtest=DailySalaryCalculatorTest` (or `-Dtest=TicketServiceTest#updateStatus_whenClosed_setsClosedAt`).
- Compile-only sanity check (fast, no Docker): `JAVA_HOME=… ./mvnw -o test-compile`.
- Run via `./mvnw` — **not** `sh mvnw`/`bash mvnw` (breaks the wrapper's path resolution).
- `pom.xml` surefire already sets `api.version=1.41` and `TESTCONTAINERS_RYUK_DISABLED=true` for Rancher.

CI runs the same suite on every push/PR to `main` — see `.github/workflows/backend-tests.yml` (green/red status).
On GitHub's ubuntu runner Docker is preinstalled, so CI needs no `DOCKER_HOST`.

## Conventions (match the existing suite EXACTLY)

- **Test code is English** — method names, `@DisplayName`, comments. (Polish only inside domain data strings.)
- Method naming: `methodUnderTest_whenCondition_expectedOutcome()`. `@DisplayName` on the class and every method.
- **AssertJ only** (`assertThat`, `assertThatThrownBy`) — never `org.junit.Assert`. For `BigDecimal` use
  `isEqualByComparingTo("12.34")`, not `isEqualTo` (scale!).
- **Arrange / Act / Assert**. One logical scenario per test; variants via `@ParameterizedTest`.
- Cover happy paths **and** error/edge paths: exceptions from `exception/` (assert type + message substring),
  null/blank normalization, empty collections, boundary values.
- Mock **only direct collaborators** (constructor deps). Build real DTO/entity objects — don't mock types you own.

## Choosing the test type per layer (cheapest first)

| Layer / class | Test type | Tools | Spring context |
|---|---|---|---|
| Pure logic (`DailySalaryCalculator`), `mapper/*`, `JwtService` | **unit** | JUnit5 + AssertJ (+ Mockito) | no — fastest, most of these |
| `service/*` | **unit with mocks** | Mockito (`@ExtendWith(MockitoExtension.class)`) | no — mock the wrapper repositories |
| `controller/*` | **web slice** | `@WebMvcTest` + `MockMvc` + `spring-security-test` | partial (web layer only) |
| `repository.jpa/*` (custom `@Query`) | **repository** | `@DataJpaTest` + Testcontainers | yes — real DB + Flyway |
| Full flow (auth, end-to-end) | **integration** | `@SpringBootTest` + Testcontainers + MockMvc | full |

## Testcontainers: extend the existing singleton base (don't reinvent)

`fruit.farm.management.AbstractIntegrationTest` already starts **one** PostgreSQL container in a static block
(shared across all integration classes) and waits for the host port to be reachable before any Spring context
connects (Rancher's port-forward lags). **Extend it** from `@DataJpaTest` / `@SpringBootTest` tests — do **not**
add `@Testcontainers`/`@Container` (per-class start/stop → timeouts when several integration classes run together).
For `@DataJpaTest` add `@AutoConfigureTestDatabase(replace = NONE)` so Spring doesn't swap in H2 and bypass Flyway.

## Patterns (copy and adapt from the real suite)

### Unit — pure logic / mapper (start here)
Call static mappers directly (`UserMapper.mapFromEntity(...)`); build real entities/DTOs, assert each mapped
field. Mirror `mapper/UserMapperTest.java`, `mapper/ExpenseMapperTest.java`, `service/DailySalaryCalculatorTest.java`.

### Service with Mockito
`@ExtendWith(MockitoExtension.class)`, `@Mock` the wrapper `@Repository` classes + collaborator services,
`@InjectMocks` the service, `@Captor` for entities built before `save`. Stub `save` with
`thenAnswer(inv -> inv.getArgument(0))`. Mirror `service/TicketServiceTest.java`.

### Web slice — controller + security (the gotcha is the mock set)
```java
@WebMvcTest(ExpenseController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
class ExpenseControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean ExpenseService expenseService;     // every service the controller injects …
    @MockitoBean UserService userService;
    // … PLUS the fixed security collaborators the imported filter chain needs:
    @MockitoBean OrchardDetailsService orchardDetailsService;
    @MockitoBean JwtService jwtService;
    @MockitoBean PasswordEncoder passwordEncoder;
    @MockitoBean fruit.farm.management.repository.UserRepository userRepository;
}
```
Security model (from `SecurityConfig.securityFilterChain`): authorities are role **display names**
(`"Gardener"`, `"Employee"`, `"Admin"`); CSRF is disabled and sessions are stateless, so **anonymous → 403**
(not 401), and you don't need `.with(csrf())`. Read the chain for the route's required role and assert:
allowed authority (`@WithMockUser(authorities="…")`) → 2xx; wrong authority → 403; anonymous → 403. Most feature
routes only need `authenticated()`; `/api/users/**` & `/api/expenses/**` need `Gardener`; `/api/admin/**` and
`/api/tickets/{all,stats,*/status,*/comment}` need `Admin`; `/api/auth/**` is `permitAll`. Mirror `ExpenseControllerTest`.

### Repository — real PostgreSQL + Flyway
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WorkEntryJpaRepositoryTest extends AbstractIntegrationTest {
    @Autowired WorkEntryJpaRepository repository;   // autowire the JPA interface directly
    // seed valid related rows (role → user → …) first, then exercise each custom @Query
}
```
Mirror `repository/jpa/UserJpaRepositoryTest.java`. Read the entity + Flyway migrations to honor NOT-NULL/FK.

### Integration — full request flow
`@SpringBootTest @AutoConfigureMockMvc … extends AbstractIntegrationTest`. Mirror `controller/AuthFlowIntegrationTest.java`.

## Updating an existing test (when prod code changed)

1. Find the test for the changed class (mirrored path, `<Class>Test.java`); run just it with `-Dtest=<Class>Test`.
2. Read the failure: decide whether the **behavior** legitimately changed (update the test to the new contract)
   or the change is a **bug** (fix prod code, not the test). Never weaken an assertion just to make it pass.
3. Keep English naming, AAA, AssertJ, and the layer's pattern. New public method → add a focused test mirroring
   its siblings; new branch → add the missing scenario. Re-run the single test, then the whole suite.

## Bulk coverage pushes (optional, multi-agent)

For covering many classes at once, fan out a Workflow: per target a **writer** authors the test from the real
source + a sibling test, an **adversarial validator** checks compile-correctness against the real signatures and
kills weak/vacuous assertions, then run the full suite once and fix-loop to green. Keep each test self-contained
(no new shared base classes beyond `AbstractIntegrationTest`).

## Suggested rollout order (best return on effort)

1. Pure logic + `mapper/*` — zero infrastructure, catch real bugs.
2. Service tests with Mockito (validations, exceptions, repository orchestration).
3. `@DataJpaTest` (extending `AbstractIntegrationTest`) for custom `@Query` methods.
4. Web slices for controllers with non-trivial authorization.
5. One or two `@SpringBootTest` flows (auth).

After each step run the canonical command and confirm green before adding more.
