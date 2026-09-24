# Stage 1: build con Maven e JDK 21. I test non girano qui: servono Docker
# (Testcontainers) e li esegue la pipeline prima di costruire l'immagine.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# prima il pom da solo: finché non cambia, le dipendenze restano nella cache di Docker
COPY pom.xml .
RUN mvn --batch-mode dependency:go-offline
COPY src ./src
RUN mvn --batch-mode package -DskipTests

# Stage 2: solo il JRE e il JAR, con un utente senza privilegi
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S impianti && adduser -S impianti -G impianti
USER impianti
COPY --from=build /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
