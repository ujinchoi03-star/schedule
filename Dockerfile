# 1. 빌드 환경 설정 (안정적인 Eclipse Temurin JDK 사용)
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app
COPY . .
# gradlew 실행 권한 부여 및 빌드 (테스트 제외)
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# 2. 실행 환경 설정 (가벼운 JRE 사용)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# 빌드된 jar 파일을 app.jar라는 이름으로 복사
COPY --from=builder /app/build/libs/*-SNAPSHOT.jar app.jar

# 3. 서버 실행 (포트 8080)
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]