# UniGo RBAC (Admin / Driver / Passenger) — MERN

This project provides a **role-based authentication** foundation for UniGo plus the **Driver module**
(Vehicle + Ride Management). Admin and Passenger are scaffolded for easy extension.

## Quick start

### 1) Configure env files

**Server**
- Copy `server/.env.example` to `server/.env`
- Update `MONGODB_URI` and `JWT_SECRET`

**Client**
- Copy `client/.env.example` to `client/.env`

### 2) Install and run (from project root)

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5001

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
