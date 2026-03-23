# UniGo - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd UniGo
npm install
```

### 2. Run Development Servers
```bash
npm run dev
```

This starts both:
- **Client:** http://localhost:5173 (React app)
- **Server:** http://localhost:5001 (API)

### 3. Create Admin Account (Optional)
```bash
npm run seed:admin -w server
```

---

## 👤 Test User Credentials

After registration, you can login with:
- **Email:** any@example.com
- **Password:** any password (min 8 chars)

Or seed an admin:
- **Email:** admin@unigo.local (after seed command)
- **Password:** AdminPass123!

---

## 🔑 Key URLs

| Page | URL | Role |
|------|-----|------|
| Landing | http://localhost:5173 | Any |
| Register | http://localhost:5173/register | Any |
| Login | http://localhost:5173/login | Any |
| Driver Dashboard | http://localhost:5173/driver/dashboard | Driver |
| Admin Dashboard | http://localhost:5173/admin/dashboard | Admin |
| Browse Drivers | http://localhost:5173/browse-drivers | Any |
| Browse Rides | http://localhost:5173/browse-rides | Any |

---

## 📋 Task List Status

All 16 tasks from the Student Ride Management System are **✅ COMPLETE**

**Frontend (8/8):**
- ✅ Project Setup
- ✅ Create Ride Page
- ✅ Browse Drivers Page
- ✅ Driver Details Page
- ✅ Confirm Booking
- ✅ Track Ride
- ✅ Rating System
- ✅ Ride History

**Backend (8/8):**
- ✅ Setup Server
- ✅ Create Models (User, Vehicle, Ride, Booking, Rating)
- ✅ Ride APIs
- ✅ Driver APIs
- ✅ Booking APIs
- ✅ Tracking APIs
- ✅ Rating APIs
- ✅ History API

---

## 🛠️ What Was Fixed

- ✅ Fixed axios module export issue
- ✅ Updated all imports to use default export
- ✅ Verified all 25+ API endpoints
- ✅ Confirmed all database models

---

## 📚 Documentation

- **Full Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Task Plan:** See `.copilot/session-state/.../plan.md`
- **Original Task List:** See `doc/student_ride_task_list.md`

---

## 🆘 Troubleshooting

### Port Already in Use
If localhost:5001 or 5173 is already in use:
```bash
# Change server port in server/.env
PORT=5002

# Change client port in vite.config.js
```

### MongoDB Connection Error
Ensure `.env` has valid MONGODB_URI:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

### Module Not Found
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
```

---

## 📊 Project Structure

```
UniGo/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── api/         # API calls
│       ├── pages/       # Page components
│       ├── components/  # Reusable components
│       └── context/     # Global state
├── server/              # Express backend
│   └── src/
│       ├── models/      # Database models
│       ├── routes/      # API routes
│       ├── controllers/ # Business logic
│       └── middleware/  # Auth, errors, etc.
├── doc/                 # Documentation
├── IMPLEMENTATION_SUMMARY.md
└── QUICK_START.md       # This file
```

---

## 🎯 Next Steps

1. **Run the app:** `npm run dev`
2. **Register a user** at http://localhost:5173/register
3. **Select role:** Driver or User (Passenger)
4. **Explore features:**
   - As Driver: Add vehicles, create rides
   - As Passenger: Browse rides, book seats, rate drivers

---

## 📞 API Base URL

```
http://localhost:5001/api
```

Example API call:
```bash
curl http://localhost:5001/api/browse/drivers
```

---

## ✨ Features Available

✅ **Authentication** - Register, Login, JWT tokens  
✅ **Driver Management** - Vehicles, Rides, Earnings  
✅ **Ride Booking** - Search, Book, Cancel  
✅ **Ratings** - Rate drivers and passengers  
✅ **History** - View past rides  
✅ **Dashboard** - Stats and management  

---

**Status:** ✅ Ready to use!

For detailed information, see `IMPLEMENTATION_SUMMARY.md`
