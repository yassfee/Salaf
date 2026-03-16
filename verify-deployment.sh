#!/bin/bash

echo "🔍 Verifying Salaf deployment readiness..."

# Check required files
echo "📁 Checking required files..."

files=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "backend/pom.xml"
    ".env.example"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Validate docker-compose syntax
echo "🔧 Validating Docker Compose syntax..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml syntax is valid"
else
    echo "❌ docker-compose.yml has syntax errors"
    docker-compose config
    exit 1
fi

# Check Java version consistency
echo "☕ Checking Java version consistency..."
DOCKERFILE_JAVA=$(grep "eclipse-temurin:" backend/Dockerfile | head -1 | grep -o "[0-9]\+")
POM_JAVA=$(grep "<java.version>" backend/pom.xml | grep -o "[0-9]\+")

if [ "$DOCKERFILE_JAVA" = "$POM_JAVA" ]; then
    echo "✅ Java versions match (Java $POM_JAVA)"
else
    echo "❌ Java version mismatch: Dockerfile=$DOCKERFILE_JAVA, pom.xml=$POM_JAVA"
    exit 1
fi

# Check if git repo is clean
echo "📦 Checking Git status..."
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  You have uncommitted changes. Consider committing before deployment:"
    git status --porcelain
fi

# Test local build (optional)
echo "🏗️  Testing local Docker build..."
if docker-compose build --no-cache salaf-backend > /dev/null 2>&1; then
    echo "✅ Docker build successful"
else
    echo "❌ Docker build failed. Check the logs:"
    docker-compose build salaf-backend
    exit 1
fi

echo ""
echo "🎉 All checks passed! Ready for Dokpoly deployment."
echo ""
echo "Next steps:"
echo "1. Commit and push all files to your repository"
echo "2. Set environment variables in Dokpoly dashboard:"
echo "   - JWT_SECRET (use a secure 256-bit key)"
echo "   - JWT_EXPIRATION_MS=86400000"
echo "   - LOG_LEVEL_ROOT=WARN"
echo "3. Deploy in Dokpoly"
echo "4. Test health endpoint: /api/health"