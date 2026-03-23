# UniGo - API Configuration Guide

## 🔧 Environment Setup

The application is now fully configured with proper API URL setup.

### Client Configuration

**File:** `client/.env.local`
```env
VITE_API_URL=http://localhost:5001/api
```

This file is already created and configured. If you need to change it, update the URL to match your backend location.

### Server Configuration

**File:** `server/.env`
```env
PORT=5001
MONGODB_URI=mongodb+srv://maleeshasandeep99_db_user:cXEisIhXdkQzrZ3n@cluster0.xbi1ypw.mongodb.net/
JWT_SECRET=change_me_super_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
ADMIN_INVITE_CODE=change_me_admin_invite
```

Server is already configured. Update as needed for your environment.

---

## 📡 API Communication Flow

```
Client (Port 5173)
    ↓
axios (with JWT interceptor)
    ↓
API Base URL: http://localhost:5001/api
    ↓
Express Server (Port 5001)
    ↓
MongoDB
```

### Example API Call

```javascript
// In AuthContext.jsx
api.post("/auth/register", { name, email, password, role, adminInviteCode })
// Resolves to: http://localhost:5001/api/auth/register
```

---

## 🚀 Running the Application

### Prerequisites
- Both server and client must be running
- MongoDB connection must be active
- Environment variables must be set

### Start Development Servers

```bash
# From project root
npm install
npm run dev
```

This starts:
- **Server:** http://localhost:5001
- **Client:** http://localhost:5173
- **API:** http://localhost:5001/api

### In Separate Terminals

**Terminal 1 - Server:**
```bash
npm run dev -w server
# Starts on http://localhost:5001
```

**Terminal 2 - Client:**
```bash
npm run dev -w client
# Starts on http://localhost:5173
```

---

## ✅ Verify Setup

### 1. Check Server is Running
```bash
curl http://localhost:5001/api/health
# Should return: Server is healthy
```

### 2. Register User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123",
    "role": "user",
    "adminInviteCode": ""
  }'
```

### 3. Access Frontend
- Open http://localhost:5173 in browser
- You should see the landing page
- Try registering or logging in

---

## 🔑 Accessing API Endpoints

The base URL is: `http://localhost:5001/api`

### Authentication Endpoints
```
POST /auth/register       - Register new user
POST /auth/login          - Login user
GET  /auth/me             - Get current user
```

### Driver Endpoints
```
GET  /driver/vehicles     - Get driver vehicles
POST /driver/vehicles     - Create vehicle
...
```

### Browse Endpoints (Public)
```
GET /browse/rides         - Search available rides
GET /browse/drivers       - List all drivers
...
```

---

## 🔍 Troubleshooting

### "404 Not Found" on API Calls
**Problem:** API calls are going to port 5173 instead of 5001  
**Solution:** Ensure `VITE_API_URL` is set in `client/.env.local`
```env
VITE_API_URL=http://localhost:5001/api
```

### "Connection Refused" on API Calls
**Problem:** Server is not running on port 5001  
**Solution:** Start server: `npm run dev -w server`

### "CORS Error"
**Problem:** Cross-origin request blocked  
**Solution:** Ensure `CORS_ORIGIN` in `server/.env` includes your client URL
```env
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

### MongoDB Connection Error
**Problem:** Cannot connect to MongoDB  
**Solution:** Update `MONGODB_URI` in `server/.env` with valid connection string
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

---

## 📋 Environment Files

### Client Files

**`.env.local`** - Development configuration (git-ignored)
```env
VITE_API_URL=http://localhost:5001/api
```

**`.env.example`** - Template for developers
```env
# Copy this to .env.local and update values
VITE_API_URL=http://localhost:5001/api
```

### Server Files

**`.env`** - Development configuration (git-ignored)
- Already configured with MongoDB and JWT settings

**`.env.example`** - Template for developers
- Shows all available configuration options

---

## 🚨 Important Notes

1. **Frontend to Backend Communication**
   - Client MUST point to correct server URL
   - Default is `http://localhost:5001/api`
   - Set in `client/.env.local`

2. **JWT Authentication**
   - Token automatically added to request headers
   - Stored in localStorage as `unigo_token`
   - Refreshed on app load

3. **CORS Configuration**
   - Server allows requests from `localhost:5173`
   - Update `CORS_ORIGIN` for other domains

4. **MongoDB Required**
   - All data stored in MongoDB
   - Connection string must be valid
   - Check `.env` for `MONGODB_URI`

---

## 📚 Related Documentation

- **QUICK_START.md** - Fast setup guide
- **IMPLEMENTATION_SUMMARY.md** - Complete details
- **README.md** - Project overview

---

**Status:** ✅ Configuration Complete  
**API:** Ready for requests  
**Next Step:** Run `npm install && npm run dev`
