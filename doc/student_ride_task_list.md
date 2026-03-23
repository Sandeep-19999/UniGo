# Student Ride Management System - Task List (MERN)

## 📌 Overview
This project is a real-time student ride management system similar to Uber, built using the MERN stack.

---

## 🎯 Frontend Tasks (React)

### 1. Project Setup
- Create React app
- Setup folder structure (components, pages, services)
- Install dependencies (axios, react-router-dom)

### 2. Create Ride Page
- Form inputs:
  - Pickup location
  - Drop location
  - Vehicle type (Bike, Car, Van)
  - Payment method (Cash / Online)
  - Notes
- Submit request to backend

### 3. Browse Drivers Page
- Fetch drivers list from API
- Display:
  - Driver name
  - Vehicle type
  - Available seats

### 4. Driver Details Page
- Show:
  - Driver info
  - Vehicle info
  - Route
  - Ride time

### 5. Confirm Booking
- Button: Book Ride
- Confirmation UI
- Call booking API

### 6. Track Ride
- Show ride status:
  - Pending
  - Accepted
  - Started
  - Completed
- Show live location (map integration optional)
- Show driver contact details

### 7. Rating System
- Star rating UI
- Comment box
- Submit to backend

### 8. Ride History
- Show past rides (last week)
- Display list with details

---

## ⚙️ Backend Tasks (Express + MongoDB)

### 1. Setup Server
- Initialize Node.js project
- Install express, mongoose, cors, dotenv

### 2. Create Models
- User Model
- Driver Model
- Ride Model
- Booking Model
- Rating Model

### 3. Ride APIs
- POST /rides → Create ride
- GET /rides → Get all rides
- GET /rides/:id → Get ride details

### 4. Driver APIs
- GET /drivers → List drivers
- GET /drivers/:id → Driver details

### 5. Booking APIs
- POST /bookings → Book ride
- PUT /bookings/:id/status → Update status

### 6. Tracking APIs
- GET /rides/:id/status → Get ride status
- PUT /rides/:id/location → Update location

### 7. Rating APIs
- POST /ratings → Submit rating

### 8. History API
- GET /users/:id/history → Ride history

---

## 🔌 API Plan

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /rides | Create ride |
| GET | /drivers | Get drivers |
| GET | /drivers/:id | Driver details |
| POST | /bookings | Book ride |
| PUT | /rides/:id/status | Update ride status |
| GET | /rides/:id | Ride details |
| POST | /ratings | Submit rating |
| GET | /users/:id/history | Ride history |

---

## 📁 Suggested Folder Structure

### Frontend
src/
 ├── components/
 ├── pages/
 ├── services/
 ├── App.jsx

### Backend
server/
 ├── models/
 ├── routes/
 ├── controllers/
 ├── config/
 ├── server.js

---

## ✅ Notes
- Use Axios for API calls
- Use MongoDB Atlas for database
- Use JWT for authentication (optional)
