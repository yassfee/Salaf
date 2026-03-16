# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-20 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:20-jre-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create data directory for SQLite persistence
RUN mkdir -p /app/data /app/logs

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENV SERVER_PORT=8080 \
    DB_URL=jdbc:sqlite:/app/data/salaf.db \
    JWT_SECRET=change-this-to-a-secure-256-bit-secret-in-production \
    JWT_EXPIRATION_MS=86400000 \
    ENCRYPTION_KEY="" \
    LOG_LEVEL_ROOT=INFO \
    LOG_LEVEL_SECURITY=WARN

ENTRYPOINT ["java", "-jar", "app.jar"]
