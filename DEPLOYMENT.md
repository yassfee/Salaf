# Salaf Deployment Guide

## For Dokpoly Deployment

### Prerequisites
- Docker and Docker Compose installed
- Git repository with the project files

### Quick Deployment Steps

1. **Clone your repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd salaf
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file and update:
   - `JWT_SECRET`: Use a secure 256-bit secret key
   - Other configuration as needed

3. **Deploy using Docker Compose**:
   ```bash
   # For development
   docker-compose up -d --build
   
   # For production
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Or use the deployment scripts**:
   ```bash
   # Linux/Mac
   ./deploy.sh
   
   # Windows
   deploy.bat
   ```

### Dokpoly Specific Instructions

1. **Ensure these files are in your repository root**:
   - `docker-compose.yml` ✅
   - `backend/Dockerfile` ✅
   - `.env.example` ✅

2. **Set environment variables in Dokpoly**:
   - `JWT_SECRET`: Your secure 256-bit key
   - `JWT_EXPIRATION_MS`: 86400000 (24 hours)
   - `LOG_LEVEL_ROOT`: WARN (for production)

3. **Dokpoly will automatically**:
   - Detect the `docker-compose.yml` file
   - Build the backend service
   - Expose port 8080
   - Create persistent volumes for data and logs

### Health Checks

After deployment, verify the service is running:

- **Basic health**: `GET /api/health`
- **Security health**: `GET /api/health/security`

Expected response:
```json
{
  "status": "UP",
  "service": "Salaf Backend"
}
```

### Troubleshooting

1. **"no such file or directory" error**:
   - Ensure `docker-compose.yml` is in the repository root
   - Check file permissions and Git tracking

2. **"no such container" error**:
   - Usually indicates Docker Compose file issues
   - Verify the service name matches in docker-compose.yml

3. **Build failures**:
   - Check if `backend/Dockerfile` exists
   - Ensure Java 21 is properly configured in Dockerfile

4. **Database issues**:
   - SQLite database is created automatically
   - Data persists in Docker volume `salaf_data`

### Port Configuration

- **Backend**: Port 8080
- **Health endpoint**: `http://localhost:8080/api/health`
- **API base**: `http://localhost:8080/api`

### Data Persistence

- **Database**: `/app/data/salaf.db` (persisted in `salaf_data` volume)
- **Logs**: `/app/logs/` (persisted in `salaf_logs` volume)

### Security Notes

- Always use a strong JWT_SECRET in production
- Consider using HTTPS in production
- Review security health endpoint regularly
- Monitor logs for security events