@echo off
echo 🔍 Verifying Salaf deployment readiness...

echo 📁 Checking required files...

if exist docker-compose.yml (
    echo ✅ docker-compose.yml exists
) else (
    echo ❌ docker-compose.yml missing
    exit /b 1
)

if exist backend\Dockerfile (
    echo ✅ backend\Dockerfile exists
) else (
    echo ❌ backend\Dockerfile missing
    exit /b 1
)

if exist backend\pom.xml (
    echo ✅ backend\pom.xml exists
) else (
    echo ❌ backend\pom.xml missing
    exit /b 1
)

if exist .env.example (
    echo ✅ .env.example exists
) else (
    echo ❌ .env.example missing
    exit /b 1
)

echo 🔧 Validating Docker Compose syntax...
docker-compose config > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ docker-compose.yml syntax is valid
) else (
    echo ❌ docker-compose.yml has syntax errors
    docker-compose config
    exit /b 1
)

echo 🏗️  Testing local Docker build...
docker-compose build --no-cache salaf-backend > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker build successful
) else (
    echo ❌ Docker build failed. Check the logs:
    docker-compose build salaf-backend
    exit /b 1
)

echo.
echo 🎉 All checks passed! Ready for Dokpoly deployment.
echo.
echo Next steps:
echo 1. Commit and push all files to your repository
echo 2. Set environment variables in Dokpoly dashboard:
echo    - JWT_SECRET (use a secure 256-bit key)
echo    - JWT_EXPIRATION_MS=86400000
echo    - LOG_LEVEL_ROOT=WARN
echo 3. Deploy in Dokpoly
echo 4. Test health endpoint: /api/health
pause