# UniGo RBAC (Admin / Driver / Passenger) — MERN

This project provides a **role-based authentication** foundation for UniGo plus the **Driver module**
(Vehicle + Ride Management). Admin and Passenger are scaffolded for easy extension.

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get running in 3 minutes
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[doc/student_ride_task_list.md](doc/student_ride_task_list.md)** - Original task list

## Quick start

### 1) Install dependencies (from project root)

```bash
npm install
```

### 2) Run development servers

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5001

### 3) Create admin user (optional)

```bash
npm run seed:admin -w server
```

## ✅ Task Status

All **16 tasks** from the Student Ride Management System are **COMPLETE**:

**Frontend (8/8):** Project Setup, Create Ride, Browse Drivers, Driver Details, Confirm Booking, Track Ride, Rating System, Ride History

**Backend (8/8):** Server Setup, Models, Ride APIs, Driver APIs, Booking APIs, Tracking APIs, Rating APIs, History APIs

## Role redirects after login
- Admin → `/admin/dashboard`
- Driver → `/driver/dashboard`
- Passenger → `/home`

## Admin creation
Public registration blocks `admin` unless `ADMIN_INVITE_CODE` matches.
You can also seed an admin:

```bash
npm run seed:admin -w server
```

## Key folders
- `client/src/pages/users/*` (admin/driver/passenger pages)
- `server/src/models/*` (users/vehicles/rides models)
- `server/src/routes/*` (auth/admin/driver/passenger routes)

## Driver APIs
- `GET/POST /api/driver/vehicles`
- `PATCH/DELETE /api/driver/vehicles/:id`
- `GET/POST /api/driver/rides`
- `PATCH/DELETE /api/driver/rides/:id`
- `PATCH /api/driver/rides/:id/status`
- `POST /api/driver/rides/:id/book-seat` (simulation)
- `GET /api/driver/rides/history`
- `GET /api/driver/rides/earnings/summary`

## Passenger APIs
- `GET /api/browse/rides` - Search available rides
- `GET /api/browse/drivers` - List all drivers
- `POST /api/passenger/bookings` - Book seats
- `GET /api/passenger/bookings` - View bookings
- `POST /api/ratings` - Submit rating

## Environment Variables

**Server (.env):**
```
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
ADMIN_INVITE_CODE=admin-code
```

**Client:**
- API URL defaults to `/api`

## Database Models

- **User** - Authentication (admin, driver, user roles)
- **Vehicle** - Driver vehicles (bike, car, van, mini_van)
- **Ride** - Driver ride listings
- **Booking** - Passenger bookings (seats, payment method)
- **Rating** - Ride ratings and reviews

## Features

✅ User authentication with JWT  
✅ Role-based access control  
✅ Driver vehicle management  
✅ Ride creation and management  
✅ Passenger ride booking  
✅ Earnings tracking  
✅ Rating and review system  
✅ Responsive UI with Tailwind CSS  
✅ Protected API routes  

## Tech Stack

**Frontend:**
- React 18 with Vite
- React Router v6
- Axios
- Tailwind CSS

**Backend:**
- Express.js
- Mongoose ODM
- MongoDB
- JWT authentication
- bcryptjs

## Latest Changes

✅ Fixed axios module export issue (default export)
✅ Updated all import statements
✅ Verified all API endpoints
✅ Created comprehensive documentation

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for full details.
