# Production Readiness Checklist

## Application
- [x] API has structured error handling and health checks.
- [x] CORS configuration supports multiple origins and safer defaults.
- [x] Security headers are added by middleware.
- [x] Frontend auth state restores safely and clears corrupted storage.

## Configuration
- [x] Environment template includes production guidance.
- [ ] Set a strong JWT_SECRET before deployment.
- [ ] Set DATABASE_URL to a production-capable database (PostgreSQL recommended).
- [ ] Configure CORS_ORIGIN to the deployed frontend origin.

## Operations
- [ ] Run database migrations against the target environment.
- [ ] Seed or initialize initial admin users.
- [ ] Configure reverse proxy / TLS / domain mapping.
- [ ] Add monitoring and alerting for uptime and errors.
