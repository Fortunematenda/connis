# CONNIS — ISP Management Platform

A production-ready ISP CRM and network management system inspired by Splynx.

## Tech Stack

- **Backend:** Node.js (Express) + PostgreSQL
- **Frontend:** React (Vite) + Tailwind CSS
- **Network:** MikroTik RouterOS (Stage 2+)
- **Auth:** FreeRADIUS (Stage 3+)

## Project Structure

```
connis/
├── backend/
│   ├── src/
│   │   ├── config/       # Database connection
│   │   ├── controllers/  # Route handlers
│   │   ├── db/           # SQL schema + init
│   │   ├── middleware/    # Error handling, validation
│   │   └── routes/       # Express routes
│   ├── .env              # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── services/     # API client
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE connis;"

# Schema is auto-applied on first server start
```

### 2. Backend
```bash
cd backend
npm install

# Edit .env with your PostgreSQL credentials
# Then start the server:
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

| Method | Route                 | Description            |
|--------|-----------------------|------------------------|
| GET    | /api/health           | Health check           |
| POST   | /api/users/create     | Create user            |
| GET    | /api/users            | List users             |
| GET    | /api/users/:id        | Get user details       |
| POST   | /api/plans/create     | Create plan            |
| GET    | /api/plans            | List plans             |
| POST   | /api/leads/create     | Create lead            |
| GET    | /api/leads            | List leads             |
| GET    | /api/leads/:id        | Get lead               |
| PUT    | /api/leads/:id/status | Update lead stage      |
