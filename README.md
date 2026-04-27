# UniGo

UniGo is a MERN stack ride sharing web application built for university transport use cases. The system has three main user areas: passenger, driver, and admin. Passengers can request rides, drivers can complete onboarding and accept matched rides, and admins can review driver submissions.

This repository contains both the React frontend and the Express/MongoDB backend.

---

## Main features

### Authentication and roles

- User registration and login with JWT authentication
- Role based access for admin, driver, and passenger accounts
- Protected frontend routes for each role
- Driver dashboard access is blocked until onboarding is complete

### Driver onboarding

A driver cannot start handling rides immediately after account creation. The driver must complete the onboarding flow first.

The onboarding process includes:

- Basic driver profile details
- Profile photo upload
- Driving license upload
- Vehicle insurance upload
- Revenue license upload
- Vehicle registration document upload
- Vehicle information submission
- Admin review before dashboard access

Driver onboarding status is tracked with progress, next step suggestions, and review states such as `not_started`, `in_progress`, `under_review`, `approved`, and `rejected`.

### Vehicle management

Drivers can register and manage their vehicles from the driver side of the system.

Vehicle details include:

- Vehicle type: bike, car, van, or mini van
- Plate number
- Seat capacity
- Make, model, year, and color support in the model
- Primary vehicle support
- Review status support

The backend validates vehicle seat capacity based on the selected vehicle type. A vehicle cannot be edited or deleted while it is connected to an active ride.

### Driver availability and ride handling

After approval, a driver can use the dashboard to:

- Save current destination
- Go online with live location
- Select a vehicle for availability
- Receive matched passenger ride requests
- Accept or reject requests
- Update ride progress steps
- Complete rides
- Track completed ride earnings

The matching logic uses driver availability, destination text, vehicle type, required seats, and pickup distance to suggest suitable drivers for a passenger request.

### Passenger ride flow

Passengers can:

- Create ride requests with pickup and drop locations
- Select vehicle type and number of seats
- View booking and ride details
- Track accepted rides
- View ride history
- Use payment, safety, and rating related features

### Admin functions

Admins can:

- Access the admin dashboard
- Review driver onboarding submissions
- Approve or reject driver documents
- Review cashout requests

---

## Tech stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- Leaflet and React Leaflet
- Leaflet Routing Machine

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Multer for file upload handling
- Cloudinary support for driver document storage

---

## Project structure

```text
UniGo/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── README.md
└── package.json
```

---

## Important folders

### Client

- `client/src/pages/auth` - login and registration pages
- `client/src/pages/driver-onboarding` - driver onboarding screens
- `client/src/pages/users/driver` - driver dashboard
- `client/src/pages/vehicles` - vehicle management page
- `client/src/pages/rides` - passenger ride request, tracking, history, and ride details
- `client/src/context/AuthContext.jsx` - login state, token handling, and driver onboarding refresh
- `client/src/api/axios.js` - API base URL and token interceptor

### Server

- `server/src/models/users/User.js` - user account model
- `server/src/models/drivers/DriverProfile.js` - driver profile and onboarding status
- `server/src/models/drivers/DriverDocument.js` - uploaded driver documents
- `server/src/models/drivers/DriverAvailability.js` - online driver availability and live location
- `server/src/models/vehicles/Vehicle.js` - vehicle data and validation
- `server/src/models/rides/RideRequest.js` - passenger ride requests and matching status
- `server/src/controllers/driver` - onboarding, availability, earnings, and request handling
- `server/src/services/matchingService.js` - driver matching logic

---

## Environment setup

Create a `.env` file inside the `server` folder.

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
ADMIN_INVITE_CODE=your_admin_invite_code

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `.env` file inside the `client` folder.

```env
VITE_API_URL=http://localhost:5001/api
```

In development, the Vite proxy can also send `/api` requests to the backend depending on the local setup.

---

## Installation

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

---

## Running the project

Start the backend server:

```bash
cd server
npm run dev
```

Start the frontend app in another terminal:

```bash
cd client
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Health check: `http://localhost:5001/api/health`

---

## Useful scripts

Backend:

```bash
npm run dev
npm run start
npm run seed:admin
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

---

## Driver and vehicle workflow

1. Driver creates an account using the driver role.
2. A driver profile is created automatically.
3. Driver completes onboarding details and uploads required documents.
4. Driver submits vehicle information.
5. Admin reviews the driver documents and vehicle details.
6. After approval, the driver can access the dashboard.
7. Driver saves a current destination and goes online.
8. Passenger creates a ride request.
9. The system matches online drivers based on destination, seats, vehicle type, and distance.
10. Driver accepts the request and completes the ride steps.
11. Completed ride earnings are added to the driver earnings record.

---

## Main API routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Driver onboarding

```text
GET    /api/driver/onboarding/status
GET    /api/driver/onboarding/detail
PUT    /api/driver/onboarding/profile
PUT    /api/driver/onboarding/vehicle
GET    /api/driver/onboarding/documents
PUT    /api/driver/onboarding/documents/:documentType
DELETE /api/driver/onboarding/documents/:documentType
```

### Vehicle management

```text
GET    /api/driver/vehicles
POST   /api/driver/vehicles
PATCH  /api/driver/vehicles/:id
DELETE /api/driver/vehicles/:id
```

### Driver availability

```text
GET   /api/driver/availability/me
PATCH /api/driver/availability/destination
POST  /api/driver/availability/go-online
PATCH /api/driver/availability/location
PATCH /api/driver/availability/go-offline
```

### Driver ride requests

```text
GET   /api/driver/requests/matches
GET   /api/driver/requests/accepted
PATCH /api/driver/requests/:id/accept
PATCH /api/driver/requests/:id/reject
PATCH /api/driver/requests/:id/step
PATCH /api/driver/requests/:id/cancel
```

### Driver rides

```text
GET    /api/driver/rides
POST   /api/driver/rides
PATCH  /api/driver/rides/:id
DELETE /api/driver/rides/:id
PATCH  /api/driver/rides/:id/status
POST   /api/driver/rides/:id/book-seat
GET    /api/driver/rides/history
GET    /api/driver/rides/earnings/summary
```

---
