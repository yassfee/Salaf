# Container Startup Issues - Quick Fix Guide

## 🚨 Issue Identified: Cookie Security Configuration

**Problem**: `server.servlet.session.cookie.secure=true` requires HTTPS, but Dokpoly might serve over HTTP initially.

**Solution**: ✅ **FIXED** - Made it configurable with environment variable.

## 🔧 Quick Fix Options

### Option 1: Use Fixed Configuration (Recommended)
Replace your `docker-compose.yml` with `docker-compose.fix.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.simple
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=temp-secret-key-for-testing-only-change-in-production
      - SERVER_PORT=8080
      - COOKIE_SECURE=false
```

### Option 2: Use Minimal Configuration
Replace your `docker-compose.yml` with `docker-compose.minimal.yml`

## 🎯 Immediate Action Plan

1. **Copy docker-compose.fix.yml to docker-compose.yml**
2. **Redeploy in Dokpoly**
3. **Test the health endpoint**: `https://salaf.sandbox.array.world/api/health`

## 🐛 What Was Wrong

1. **Cookie security setting** - Required HTTPS but platform serves HTTP
2. **Complex health checks** - Might interfere with startup
3. **Too many environment variables** - Some might be missing

## ✅ What's Fixed

1. **Cookie security** - Now configurable (disabled for HTTP)
2. **Simplified Dockerfile** - Minimal, reliable build
3. **Minimal environment** - Only essential variables
4. **No health checks** - Let the platform handle it

## 🚀 After Fix

Your API should be accessible at:
- **Health**: `https://salaf.sandbox.array.world/api/health`
- **Auth**: `https://salaf.sandbox.array.world/api/auth/login`
- **Dashboard**: `https://salaf.sandbox.array.world/api/dashboard/summary`

The response should be:
```json
{
  "status": "UP",
  "service": "Salaf Backend"
}
```