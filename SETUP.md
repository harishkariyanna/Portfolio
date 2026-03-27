# Application Setup Guide

## Intelligent Dynamic Portfolio Platform

AI-Powered Dynamic Portfolio Platform built with **MERN Stack** (MongoDB, Express, React, Node.js).

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0 (Current: v24.13.0 detected)
- **npm** >= 9.0.0
- **MongoDB Atlas** account (free M0 tier) or local MongoDB instance

### Installation

1. **Install Dependencies**
```bash
# From project root
npm install
```

2. **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your values:
# - MONGODB_URI: Your Mongo connection string
# - JWT_SECRET: Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# - OPENAI_API_KEY: Optional (for AI features)
# - CLOUDINARY_URL: Optional (for media uploads)
```

3. **Run Development Servers**
```bash
# Option 1: Both servers concurrently (recommended)
npm run dev

# Option 2: Separate terminals
npm run dev:frontend  # Frontend: http://localhost:5173
npm run dev:backend   # Backend: http://localhost:5000
```

---

## 📂 Project Structure

```
PropelIQ-Copilot/
├── frontend/               # React 18.2 + Vite 5.0
│   ├── src/
│   │   ├── main.jsx       # App entry point
│   │   ├── App.jsx        # Root component with routing
│   │   ├── index.css      # Global styles
│   │   └── App.css        # Component styles
│   ├── dist/              # Production build output
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite config (code splitting, minification)
│   └── package.json
│
├── backend/               # Express 4.18 + Mongoose 8.0
│   ├── src/
│   │   ├── server.js              # Express initialization
│   │   ├── config/
│   │   │   └── database.js        # MongoDB connection (pooling, retry logic)
│   │   └── utils/
│   │       └── validateEnv.js     # Joi environment validation
│   └── package.json
│
├── shared/               # Shared utilities
│   ├── constants.js      # Common constants
│   └── package.json
│
├── scripts/
│   └── smoke-test.js     # Automated setup validation
│
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Environment template
└── package.json          # Workspace configuration
```

---

## 🔧 Available Scripts

### Root Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Run frontend + backend concurrently |
| `npm run dev:frontend` | Frontend dev server only (port 5173) |
| `npm run dev:backend` | Backend dev server only (port 5000) |
| `npm run build:frontend` | Build frontend for production |
| `npm run start:backend` | Start backend in production mode |
| `npm run lint` | Lint all workspaces |

### Frontend Scripts (cd frontend)
| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR (port 5173) |
| `npm run build` | Production build (outputs to dist/) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint code analysis |

### Backend Scripts (cd backend)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon auto-restart (port 5000) |
| `npm start` | Production mode (no auto-restart) |
| `npm run lint` | ESLint code analysis |

---

## 🏗️ Technology Stack

### Frontend
- **React 18.2** - UI library with hooks
- **Vite 5.0** - Lightning-fast build tool
- **React Router 6.20** - Client-side routing
- **ESLint** - Code quality enforcement

### Backend
- **Node.js 18 LTS+** - JavaScript runtime
- **Express 4.18** - Web application framework
- **Mongoose 8.0** - MongoDB object modeling
- **Helmet** - Security headers middleware
- **CORS** - Cross-origin resource sharing
- **Joi** - Schema validation for env vars

### Database
- **MongoDB Atlas M0** - Free tier (512MB, 10 connections)
- **Connection Pooling** - maxPoolSize: 10
- **Retry Logic** - 3 attempts with exponential backoff (1s, 3s, 9s)

---

## ⚙️ Configuration Details

### Vite Build Optimization
- **Bundle Target**: < 500KB gzipped ✓ (Current: ~52KB)
- **Code Splitting**: React vendor chunk separated
- **Minification**: Terser with console/debugger removal
- **Source Maps**: Enabled for debugging

### MongoDB Connection
- **MaxPoolSize**: 10 connections (Atlas M0 limit)
- **Server Selection Timeout**: 5 seconds
- **Socket Timeout**: 45 seconds
- **IPv4 Only**: Enforced for compatibility

### Environment Variables (Required)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/portfolio` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Generate with crypto |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-proj-...` |
| `CLOUDINARY_URL` | Cloudinary upload URL (optional) | `cloudinary://...` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

---

## 🚨 Troubleshooting

### ❌ MongoDB Connection Fails
**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions**:
1. Verify `MONGODB_URI` format in `.env`
2. Check MongoDB Atlas network access (whitelist IP: `0.0.0.0/0` for dev)
3. Ensure database user has read/write permissions
4. Confirm MongoDB Atlas cluster status is "Active"

---

### ❌ Port Already in Use
**Error**: `EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

---

### ❌ Environment Validation Fails
**Error**: `JWT_SECRET is required`

**Solutions**:
1. Ensure `.env` exists (copy from `.env.example`)
2. Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
3. Verify all required variables are set

---

### ❌ Build Size Exceeds Limit
**Issue**: Bundle > 500KB gzipped

**Solutions**:
1. Check bundle analysis:
```bash
cd frontend
npm run build
# Review dist/assets/*.js sizes
```
2. Optimize `vite.config.js` manualChunks
3. Remove unused imports
4. Consider lazy loading routes:
```javascript
const Dashboard = React.lazy(() => import('./Dashboard'));
```

---

### ❌ Terser Not Found
**Error**: `terser not found. Since Vite v3, terser has become an optional dependency`

**Solution**:
```bash
cd frontend
npm install --save-dev terser
```

---

## ✅ Verification

### Run Smoke Tests
```bash
# Automated validation (32 checks)
node scripts/smoke-test.js
```

**Checks Include**:
- [x] Node.js version ≥ 18
- [x] Project structure (/frontend, /backend, /shared)
- [x] All package.json files exist
- [x] MongoDB connection code implemented
- [x] Vite configuration optimized
- [x] .env.example contains all required variables
- [x] Bundle size < 500KB gzipped

### Manual Verification
1. **Frontend**: Open http://localhost:5173 (should show welcome page)
2. **Backend Health**: http://localhost:5000/health (should return JSON)
3. **Backend API**: http://localhost:5000/api (should return version info)
4. **HMR**: Edit `frontend/src/App.jsx`, save → browser auto-updates
5. **Nodemon**: Edit `backend/src/server.js`, save → server restarts

---

## 📝 Next Steps

After successful setup, continue with:
1. **US_002**: CI/CD Pipeline & Logging Infrastructure (Winston, GitHub Actions)
2. **US_003**: MongoDB Schema Implementation (13 schemas + seed script)
3. **US_004**: Admin Authentication System (JWT, login forms)
4. **US_007**: AI RAG Document Ingestion (OpenAI embeddings, vector search)
5. **US_010**: Visitor Analytics Dashboard (real-time metrics)

---

## 📄 License

MIT

## 🤝 Support

For issues, create a ticket in the repository.
