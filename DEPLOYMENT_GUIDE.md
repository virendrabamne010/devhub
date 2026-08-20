# Deployment Guide

## 1. Prepare environment variables
Copy [.env.example](.env.example) to .env and update the values for your deployment target.

Required values:
- NODE_ENV=production
- PORT=3001
- DATABASE_URL=postgresql://user:password@host:5432/devhub?schema=public
- JWT_SECRET=<at least 32 random characters>
- CORS_ORIGIN=https://your-frontend-domain.example

## 2. Run database migrations
From the repo root:

npm install
npm run db:generate
npm run db:migrate
npm run db:seed

## 3. Build the application
npm run build

## 4. Start the API
npm start

## 5. Serve the frontend
The frontend can be served from the Vite build output or from a static host.
