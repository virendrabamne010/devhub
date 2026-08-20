# DevHub - Demo Script for B.Tech CSE Major Project

## 🎯 Project Overview
**DevHub** is a comprehensive DevOps Management Platform that demonstrates:
- Full-stack development with TypeScript
- REST API design with Express.js
- Database design with Prisma ORM
- Modern React frontend with real-time charts
- Authentication & Authorization (JWT, RBAC)
- CI/CD pipeline simulation
- System monitoring & uptime tracking

---

## 🚀 Quick Start (For Presentation)

### Prerequisites
- Node.js v18+
- npm v9+

### Step 1: Setup (2 minutes)
```bash
# Clone and install
cd devhub
npm install

# Generate Prisma client & run migrations
cd packages/database
npx prisma generate
npx prisma migrate dev --name init

# Seed the database
npx tsx prisma/seed.ts
cd ../..
```

### Step 2: Start the Application (1 minute)
```bash
# Terminal 1: Start API server
cd packages/api
npm run dev

# Terminal 2: Start frontend
cd packages/web
npm run dev
```

### Step 3: Open in Browser
- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health

---

## 📋 Presentation Flow (15 minutes)

### 1. Introduction (2 min)
- **What is DevHub?** A DevOps management platform
- **Problem Statement:** Managing deployments, monitoring, and team collaboration
- **Tech Stack:** TypeScript, React, Express.js, Prisma, SQLite

### 2. Architecture Overview (2 min)
- **Monorepo structure** with 3 packages
- **Database:** 18 models covering users, teams, projects, deployments, monitoring
- **API:** RESTful with JWT auth, role-based access, rate limiting
- **Frontend:** React with Recharts, Tailwind CSS, Zustand state management

### 3. Live Demo (8 min)

#### a) Authentication (1 min)
- Open http://localhost:5173
- Login with: `admin@devhub.com` / `DevHub@123`
- Show demo credentials on login page

#### b) Dashboard (2 min)
- **Stat cards:** Projects, Deployments, Success Rate, Active Targets, Teams, Users
- **Bar chart:** Deployments last 7 days (stacked by status)
- **Pie chart:** Deployment success vs failure ratio
- **Recent deployments table** with auto-refresh

#### c) Teams Management (1 min)
- View existing teams (Alpha Team, Beta Team)
- Create a new team
- Show member avatars with initials

#### d) Projects (1 min)
- View projects with team associations
- Show repository and environment counts
- Create a new project

#### e) Deployments (2 min)
- **Trigger a new deployment** - watch it go through QUEUED → IN_PROGRESS → SUCCESS
- **Auto-refresh** every 5 seconds
- **Filter by status** (All, Queued, In Progress, Success, Failed)
- **Expand logs** to see deployment output
- **Background workers** simulate real CI/CD pipeline

#### f) Monitoring (1 min)
- **Dashboard stats:** Total targets, Healthy, Down/Degraded
- **Target list** with status indicators (UP/DOWN/DEGRADED)
- **Response time chart** with real-time data
- **Ping history table**
- **Create new monitoring target**

### 4. Technical Highlights (2 min)

#### Backend
- **JWT Authentication** with bcrypt password hashing (12 rounds)
- **Role-Based Access Control** (ADMIN, MANAGER, DEVELOPER, VIEWER)
- **Input Validation** with Zod schemas
- **Rate Limiting** (100 requests/15 minutes)
- **Security Headers** with Helmet.js
- **Audit Logging** for all actions
- **Background Workers** for monitoring checks & deployment simulation

#### Database
- **18 models** with proper relations, indexes, and constraints
- **Soft delete** support
- **Composite unique constraints**
- **Cascading deletes** where appropriate

#### Frontend
- **React 18** with TypeScript
- **Zustand** for state management
- **Recharts** for interactive charts
- **Tailwind CSS** for responsive design
- **Axios** with interceptors for auth
- **Auto-refresh** for real-time updates

### 5. Conclusion (1 min)
- **What we learned:** Full-stack development, DevOps concepts, CI/CD pipelines
- **Future enhancements:** PostgreSQL support, WebSocket real-time updates, Kubernetes integration
- **Q&A**

---

## 🎬 Key Demo Actions

### Before Presentation
```bash
# Ensure both servers are running
# Terminal 1:
cd packages/api && npm run dev

# Terminal 2:
cd packages/web && npm run dev
```

### During Presentation
1. **Login** - Show the login page with demo credentials
2. **Dashboard** - Point out the 6 stat cards and 2 charts
3. **Trigger Deployment** - Click "Trigger Deploy" and watch it progress
4. **Show Logs** - Click on a deployment row to expand logs
5. **Monitoring** - Show the response time chart updating
6. **Create Target** - Add a new monitoring target
7. **Users Page** - Show role management (admin only)

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F
```

### Database issues
```bash
# Reset database
cd packages/database
npx prisma migrate reset --force
npx tsx prisma/seed.ts
```

### Frontend not connecting
- Ensure API server is running on port 3001
- Check CORS_ORIGIN in .env matches http://localhost:5173
- Vite proxy is configured in vite.config.ts

---

## 📊 Project Statistics
- **Lines of Code:** ~5,000+
- **API Endpoints:** 25+
- **Database Models:** 18
- **Frontend Pages:** 8
- **NPM Packages:** 40+
- **Development Time:** ~2 months

---

## 🏆 Key Features for Evaluation
1. ✅ Complete authentication system with JWT
2. ✅ Role-based access control (4 roles)
3. ✅ CRUD operations for all entities
4. ✅ Interactive dashboard with real-time charts
5. ✅ CI/CD deployment simulation
6. ✅ URL monitoring with ping history
7. ✅ Background workers for automation
8. ✅ Input validation with Zod
9. ✅ Security best practices (Helmet, rate limiting, CORS)
10. ✅ Responsive UI with Tailwind CSS
11. ✅ TypeScript throughout
12. ✅ Docker support
13. ✅ Comprehensive API documentation
14. ✅ Database with 18 models and proper indexing
15. ✅ Audit logging for security