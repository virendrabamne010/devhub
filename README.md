# DevHub - DevOps Management Platform

**B.Tech CSE (Computer Science & Engineering) - Final Year Major Project**

A full-stack DevOps management platform for streamlining software development workflows — from team collaboration to CI/CD deployment tracking and real-time system monitoring.

| | |
|---|---|
| **Author** | Shravani & Rashmi |
| **Department** | Computer Science & Engineering |
| **Year** | 4th Year (Final Year) |
| **Technologies** | TypeScript, React 18, Node.js, Express.js, Prisma ORM, SQLite |

---

## Problem Statement

In modern software development, teams use multiple disconnected tools for different tasks — GitHub for code, Jenkins for CI/CD, Datadog for monitoring, Jira for project management. This fragmentation leads to:

- Context switching between 5-6 different tools
- No single source of truth for deployment status
- Difficulty tracking who did what and when (audit trail)
- No centralized monitoring with alerts

**DevHub solves this by providing a single unified platform** that combines team management, project tracking, CI/CD deployment monitoring, system uptime monitoring, and security audit logging — all in one dashboard.

---

## Objectives

1. Build a secure authentication system with JWT and role-based access control
2. Develop team and project management modules with CRUD operations
3. Implement CI/CD deployment tracking with real-time status updates
4. Create a system monitoring module with HTTP ping and uptime tracking
5. Provide a unified dashboard with analytics and activity feeds
6. Ensure security through audit logging, rate limiting, and API key management

---

## Architecture

```
+---------------------------------------------+
|          Frontend (React + Vite)             |
|  Dashboard | Projects | Teams | Deployments |
|  Monitoring | Users | Notifications         |
+----------------------+----------------------+
                       | HTTP/JSON (REST API)
+----------------------v----------------------+
|           API Server (Express.js)            |
|  Auth | CRUD | Webhooks | API Keys          |
|  Rate Limiting | Validation | JWT           |
+----------------------+----------------------+
                       | Prisma ORM
+----------------------v----------------------+
|          Database Layer (SQLite)             |
|         18 Models | Full Relations          |
+---------------------------------------------+
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | UI framework + build tool |
| Styling | Tailwind CSS | Utility-first CSS |
| State | Zustand | Lightweight state management |
| Charts | Recharts | Dashboard visualizations |
| Backend | Express.js + TypeScript | REST API server |
| Auth | JWT + bcryptjs | Authentication + password hashing |
| Validation | Zod | Request body validation |
| ORM | Prisma | Database abstraction |
| Database | SQLite | Development database |
| Security | Helmet, CORS, Rate Limiter | API protection |
| Testing | Jest | Unit testing |
| Containers | Docker + Docker Compose | Deployment |

---

## Features

### Authentication & Authorization
- JWT-based login with access + refresh token rotation
- 4 roles: Admin, Manager, Developer, Viewer
- Secure password hashing (bcrypt, 12 rounds)
- Email verification support

### Team Management
- Create and manage teams
- Add/remove members with roles (Owner, Admin, Member)
- Role-based team access control

### Project Management
- Full CRUD for projects
- Project status tracking (Active, Archived, Completed)
- Team-project association
- Activity logging for all changes

### CI/CD Deployment Tracking
- Track deployment status (Queued, In Progress, Success, Failed, Rolled Back)
- Environment management (Development, Staging, Production)
- Background workers simulate real pipeline progression
- Commit and repository linking

### System Monitoring
- URL monitoring with configurable check intervals
- Real HTTP ping with response time tracking
- Uptime percentage calculation
- 24-hour failure tracking

### Dashboard & Analytics
- Real-time statistics (projects, teams, users, deployments)
- Deployment success rate tracking
- Recent activity feed
- Deployment charts (last 7 days)

### Security & Compliance
- Comprehensive audit logging (who did what, when)
- API key management with prefix identification
- Webhook event management
- Rate limiting (1000 requests/15 minutes)
- Helmet.js security headers
- CORS configuration

---

## Database Schema

18 models covering the complete DevOps lifecycle:

| Model | Purpose |
|-------|---------|
| User | User accounts, roles, authentication |
| Session | Active user sessions |
| RefreshToken | JWT refresh token management |
| Team | Organizational teams |
| TeamMember | Team membership with roles |
| Project | Software projects |
| Repository | Git repositories |
| Commit | Git commit history |
| Environment | Deployment environments |
| Deployment | CI/CD deployment records |
| MonitoringTarget | URL monitoring targets |
| PingHistory | Monitoring ping results |
| AuditLog | Security audit trail |
| ActivityLog | General activity feed |
| Webhook | Webhook configurations |
| ApiKey | API key management |
| Notification | User notifications |
| Comment | Resource comments |

---

## Setup & Installation

### Prerequisites
- Node.js v18+ (`node --version`)
- npm v9+ (`npm --version`)
- Docker (optional)

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd devhub

# 2. Install dependencies
npm install

# 3. Setup database (SQLite - no extra setup needed)
cd packages/database
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
cd ../..

# 4. Start development servers
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001

### Docker Setup (Optional)

```bash
docker-compose up -d --build
docker-compose ps
docker-compose logs -f
docker-compose down
```

---

## Sample Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@devhub.com | DevHub@123 |
| Manager | manager@devhub.com | DevHub@123 |
| Developer | developer@devhub.com | DevHub@123 |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user profile | Yes |
| POST | /api/auth/refresh | Refresh access token | No |
| POST | /api/auth/logout | Logout (revoke refresh token) | Yes |

### Users (Admin/Manager)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| PATCH | /api/users/:id | Update user |
| DELETE | /api/users/:id | Deactivate user |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/teams | List teams |
| POST | /api/teams | Create team |
| GET | /api/teams/:id | Get team details |
| POST | /api/teams/:id/members | Add member |
| DELETE | /api/teams/:id/members/:memberId | Remove member |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Archive project |

### Deployments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/deployments | List deployments |
| POST | /api/deployments | Create deployment |
| GET | /api/deployments/:id | Get deployment details |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/monitoring/targets | List monitoring targets |
| POST | /api/monitoring/targets | Create target |
| GET | /api/monitoring/targets/:id/pings | Get ping history |
| GET | /api/monitoring/dashboard | Monitoring dashboard stats |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/activity | Recent activity feed |

### Security (Admin/Manager)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/webhooks | List webhooks |
| POST | /api/webhooks | Create webhook |
| GET | /api/apikeys | List API keys |
| POST | /api/apikeys | Create API key |
| GET | /api/auditlogs | Audit log history |
| GET | /api/notifications | User notifications |

---

## Testing

### Unit Tests (Jest)

```bash
npm test
```

**Results: 4 test suites, 20 tests — All Passed**

Tests cover:
- bcrypt password hashing and comparison
- JWT sign/verify with correct and incorrect secrets
- Expired token rejection
- Zod validation schemas (registration, teams, deployments, monitoring)
- Security configuration checks

### API Integration Tests

All 30+ API endpoints tested across 3 roles (Admin, Manager, Developer):
- Authentication flows (login, register, refresh, logout)
- CRUD operations (teams, projects, deployments)
- Role-based access control (403 for unauthorized access)
- Security (401 for missing/wrong tokens)
- Dashboard and analytics endpoints

---

## Project Structure

```
devhub/
  packages/
    api/                          # Express.js API server
      src/
        index.ts                  # Server entry point
        config.ts                 # Environment configuration
        middleware/
          auth.ts                 # JWT authentication
          errorHandler.ts         # Error handling
          validate.ts             # Zod validation schemas
        routes/
          auth.ts                 # Authentication routes
          users.ts                # User management
          teams.ts                # Team management
          projects.ts             # Project management
          deployments.ts          # CI/CD deployments
          monitoring.ts           # System monitoring
          dashboard.ts            # Dashboard analytics
          notifications.ts        # Notifications
          webhooks.ts             # Webhook management
          apikeys.ts              # API key management
          auditlogs.ts            # Audit logging
          comments.ts             # Comments
          repositories.ts         # Repository management
          environments.ts         # Environment management
        workers.ts                # Background workers
        lib/logger.ts             # Winston logging
        __tests__/                # Jest unit tests
    web/                          # React frontend
      src/
        App.tsx                   # Route definitions
        pages/                    # 9 pages
        components/               # Reusable components
        store/auth.ts             # Zustand auth store
        lib/api.ts                # Axios API client
        types/index.ts            # TypeScript types
    database/                     # Prisma ORM
      prisma/
        schema.prisma             # 18 database models
        seed.ts                   # Database seeder
      index.ts                    # Prisma client singleton
  docker-compose.yml              # Docker orchestration
  package.json                    # Monorepo root config
```

---

## Background Workers

The API server runs background workers that simulate real DevOps operations:

| Worker | Interval | Description |
|--------|----------|-------------|
| Monitoring Checker | 30 seconds | Pings monitoring targets, records uptime |
| Deployment Simulator | 10 seconds | Simulates CI/CD pipeline progression |
| Token Cleanup | 6 hours | Removes expired refresh tokens |
| Ping History Cleanup | 24 hours | Retains 30 days of ping data |

---

## Security Features

- **JWT Authentication** with access + refresh token rotation
- **Role-Based Access Control** (Admin > Manager > Developer > Viewer)
- **Rate Limiting** (1000 requests/15 min global, 100 login attempts/15 min)
- **Helmet.js** security headers (HSTS, CSP, X-Frame-Options)
- **CORS** configuration for cross-origin protection
- **Zod Validation** on all input fields
- **Audit Logging** for all critical operations
- **bcrypt** password hashing (12 rounds)

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Web dev servers |
| `npm run dev:api` | Start API only |
| `npm run dev:web` | Start Web only |
| `npm test` | Run Jest tests |
| `npm run build` | Build all packages |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |

---

## Future Scope

1. **Real CI/CD Integration** — Connect with GitHub/GitLab webhooks for actual deployment triggering
2. **Email Notifications** — SMTP integration for deployment alerts and monitoring failures
3. **Real-time Updates** — WebSocket support for live deployment status
4. **Cloud Deployment** — AWS/Azure deployment with PostgreSQL
5. **Mobile App** — React Native companion app for on-the-go monitoring
6. **AI-Powered Analytics** — Deployment failure prediction and root cause analysis

---

## Acknowledgments

- Prisma ORM documentation
- Express.js community
- React documentation
- TypeScript documentation
- Tailwind CSS
- All open-source dependencies used in this project

---

**Author:** Shravani & Rashmi
**Project:** B.Tech CSE Major Project
