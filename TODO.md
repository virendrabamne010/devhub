# DevHub - Industry-Level Production Hardening Plan

> Goal: Make DevHub fully production-ready & fully functional (Google-grade quality).

## Phase 1: Security Hardening (Backend)
- [ ] 1.1 Fix `config.ts`: fail-fast if JWT_SECRET missing in production; load env securely
- [ ] 1.2 Add ownership/authorization checks on teams & projects mutations (RBAC on resources)
- [ ] 1.3 Guard against admin self-deactivation & demoting/depromoting last admin
- [ ] 1.4 Add Helmet CSP + security headers (already present - verify)
- [ ] 1.5 Add request ID + structured logging (morgan JSON in prod)
- [ ] 1.6 Add global error boundary + unhandled rejection handling

## Phase 2: Full CRUD Completeness
- [ ] 2.1 Add DELETE /api/projects/:id (soft-delete)
- [ ] 2.2 Add notifications endpoints (GET /api/notifications, mark read)
- [ ] 2.3 Add repository & environment CRUD routes
- [ ] 2.4 Add comments endpoints
- [ ] 2.5 Add audit log listing endpoint

## Phase 3: Auth & Session Improvements
- [ ] 3.1 Implement frontend refresh-token rotation (axios interceptor)
- [ ] 3.2 Add email verification flow completion (frontend)
- [ ] 3.3 Add password change endpoint
- [ ] 3.4 Add proper logout that revokes refresh token on frontend

## Phase 4: Frontend Polish & Reliability
- [ ] 4.1 Add error boundaries & loading skeletons
- [ ] 4.2 Add toast notifications
- [ ] 4.3 Fix seed dates to Date.now()-relative for live demo
- [ ] 4.4 Add proper 404/error pages
- [ ] 4.5 Add environment selection in Deployments "Trigger Deploy"

## Phase 5: Infrastructure & Operations
- [ ] 5.1 Fix start_servers.ps1 port 3002 -> 3001 health check
- [ ] 5.2 Add graceful shutdown (SIGTERM/SIGINT) handler
- [ ] 5.3 Add health check DB connectivity (already added - verify)
- [ ] 5.4 Add .env.example with secure defaults
- [ ] 5.5 Add Docker healthcheck verification

## Phase 6: Testing & Quality
- [ ] 6.1 Add integration test for auth flow
- [ ] 6.2 Add tests for RBAC/ownership
- [ ] 6.3 Run full build + lint + tests
- [ ] 6.4 Fix "Table of Conten" typo in generate_report.py
- [ ] 6.5 Reconcile progress report student names

## Phase 7: Final Verification
- [ ] 7.1 Clean restart (kill stale node, start fresh)
- [ ] 7.2 Full E2E test (all endpoints 200)
- [ ] 7.3 Verify webhooks/apikeys mounted (401 not 404)
- [ ] 7.4 Final build + test pass
