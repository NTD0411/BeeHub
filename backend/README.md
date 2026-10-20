# UniMove Backend API

Node.js Express API server with Supabase integration.

## 🚀 Quick Start

```bash
npm install
cp ../.env.example ../.env
# Edit .env with Supabase credentials
npm run create-admin
npm run dev
```

## 🧪 Testing

```bash
# Test database connection
npm test

# API server
curl http://localhost:3000/api/health
```

## 📋 Available Scripts

- `npm start` - Production server
- `npm run dev` - Development server with auto-reload
- `npm test` - Test database connection
- `npm run create-admin` - Create admin user

## 🔗 API Documentation

See [../docs/ADMIN_API.md](../docs/ADMIN_API.md) for complete API documentation.

## 📊 Admin Endpoints

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/dashboard` - KPI dashboard  
- `GET /api/admin/providers/pending` - Pending providers
- `GET /api/admin/disputes` - Dispute management

## 🔧 Environment Variables

Required in `../.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## 🏗️ Architecture

```
src/
├── controllers/    # Request handlers
├── routes/        # API routes
├── middleware/    # Auth & validation
└── services/      # Supabase integration
```
