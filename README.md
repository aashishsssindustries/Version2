# WealthMax

A modern fintech web application for personal finance management.

## 🏗️ Architecture

This project follows a monorepo structure with separate frontend and backend applications:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Supabase)

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database (Supabase recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 2. Environment Configuration

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string (from Supabase)
- `PORT`: Backend server port (default: 5000)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:5173)

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` and configure:
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:5000/api/v1)

### 3. Run Development Servers

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run individually:
npm run dev:backend
npm run dev:frontend
```

### 4. Verify Setup

- **Backend**: http://localhost:5000/api/v1/health
- **Frontend**: http://localhost:5173

## 📁 Project Structure

```
wealthmax/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (env, database, logger)
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   ├── assets/          # Static assets
│   │   ├── App.tsx          # Root component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── package.json             # Root workspace config
└── README.md
```

## 🛠️ Development

### Available Scripts

**Root level:**
- `npm run dev` - Run both frontend and backend
- `npm run build` - Build both applications
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

**Backend:**
- `npm run dev --workspace=backend` - Start dev server with hot reload
- `npm run build --workspace=backend` - Build for production
- `npm run start --workspace=backend` - Run production build

**Frontend:**
- `npm run dev --workspace=frontend` - Start Vite dev server
- `npm run build --workspace=frontend` - Build for production
- `npm run preview --workspace=frontend` - Preview production build

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## 🗄️ Database Setup

This project uses PostgreSQL via Supabase. To set up:

1. Create a Supabase project at https://supabase.com
2. Get your connection string from Project Settings > Database
3. Add it to `backend/.env` as `DATABASE_URL`

The connection string format:
```
postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
```

## 🔒 Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `LOG_LEVEL` | Logging level | `debug` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api/v1` |

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (pg)
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Dev Tools**: Nodemon, ESLint, Prettier

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Dev Tools**: ESLint, Prettier

## 🚢 Deployment

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

## 📝 API Documentation

### Health Check Endpoints

**GET** `/api/v1/health`
- Returns basic server health status

**GET** `/api/v1/health/detailed`
- Returns detailed health including database connection status

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strict mode
3. Run linting and formatting before committing
4. Write meaningful commit messages

## 📄 License

Private - All rights reserved

---

**Phase 1 Complete** ✅
- Monorepo structure
- Backend with Express + TypeScript
- Frontend with React + TypeScript + Vite
- PostgreSQL/Supabase integration
- Development tooling (ESLint, Prettier, logging)
- Environment-based configuration
