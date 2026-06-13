# --- Etap budowania ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Najpierw zależności (lepszy cache warstw Dockera)
COPY pom.xml ./
RUN mvn -q -B dependency:go-offline

COPY src ./src
# Testy pomijamy w obrazie — wymagają Dockera (Testcontainers); uruchamiane osobno w CI/lokalnie
RUN mvn -q -B clean package -DskipTests

# --- Etap uruchomieniowy ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/management-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8091
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
