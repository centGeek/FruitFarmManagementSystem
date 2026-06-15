# --- Etap budowania ---
# $BUILDPLATFORM = natywna architektura buildera (arm64 na Macu). Maven kompiluje natywnie, a wynik
# (jar) jest niezależny od architektury — więc finalny obraz JRE może spokojnie targetować
# linux/amd64 bez emulacji QEMU całego buildu (ta sama sztuczka co we frontendzie).
FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
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
# JVM flags tuned for the scale-to-zero, low-vCPU Container App: the JVM boots cold on the first
# request after any idle gap, so we trade peak throughput for faster startup.
#   -XX:TieredStopAtLevel=1  stop at C1 — skip the slow C2 JIT we don't need for a short-lived demo
#   -XX:+UseSerialGC         no parallel GC threads to spin up on a 1-vCPU container
#   -Xss512k                 smaller thread stacks → less memory pressure at boot
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-Xss512k", "-jar", "/app/app.jar"]
