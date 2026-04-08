# Etapa de compilación
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa de ejecución
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Xmx200m", "-XX:MaxMetaspaceSize=128m", "-Xss512k", "-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-jar", "app.jar"]