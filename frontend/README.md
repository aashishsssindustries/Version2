# WealthMax Frontend

Modern React + TypeScript frontend for WealthMax financial advisor platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Configure the API URL in `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx    # Main layout wrapper
│       ├── Header.tsx       # Top navigation
│       └── Sidebar.tsx      # Side navigation
├── pages/
│   ├── auth/
│   │   ├── Login.tsx        # Login page
│   │   └── Signup.tsx       # Signup page
│   ├── Dashboard.tsx        # Main dashboard
│   ├── Calculators.tsx      # Financial calculators
│   └── RiskAssessment.tsx   # Risk assessment
├── services/
│   └── api.ts               # API client
├── types/
│   └── index.ts             # TypeScript types
├── App.tsx                  # Root component with routing
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

## Features

### Layout
- Fixed header with user menu
- Fixed sidebar with navigation
- Responsive main content area

### Authentication
- Login with email/password
- Signup with validation
- JWT token management
- Protected routes

### Pages
- **Dashboard**: Financial profile, health score, action items
- **Calculators**: Financial planning tools (coming soon)
- **Risk Assessment**: Investment risk profiling (coming soon)

## Design System

The UI follows a professional SaaS fintech aesthetic with:

- Modern color palette (blues/purples)
- Clean card-based layouts
- Smooth transitions and hover effects
- CSS custom properties for theming
- Responsive design

## API Integration

The frontend connects to the WealthMax backend API:

- Base URL configured via environment variables
- Axios interceptors for auth token injection
- Global error handling
- Automatic redirect on 401 (Unauthorized)

## Code Quality

- TypeScript strict mode
- ESLint for code linting
- Component-based architecture
- Clean separation of concerns
