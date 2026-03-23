import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/public/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/users/admin/AdminDashboard";
import DriverDashboard from "./pages/users/driver/DriverDashboard";
import PassengerHome from "./pages/users/passenger/PassengerHome";
import BrowseDrivers from "./pages/users/passenger/BrowseDrivers";
import DriverDetails from "./pages/users/passenger/DriverDetails";

import VehicleManagement from "./pages/vehicles/VehicleManagement";
import RideManagement from "./pages/rides/RideManagement";
import RideHistory from "./pages/rides/RideHistory";
import BrowseRides from "./pages/rides/BrowseRides";
import RideDetails from "./pages/rides/RideDetails";
import PassengerBookings from "./pages/rides/PassengerBookings";
import RateRide from "./pages/rides/RateRide";

import Unauthorized from "./pages/common/Unauthorized";
import NotFound from "./pages/common/NotFound";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute roles={["driver"]}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute roles={["user"]}>
              <PassengerHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/vehicles"
          element={
            <ProtectedRoute roles={["driver"]}>
              <VehicleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/rides"
          element={
            <ProtectedRoute roles={["driver"]}>
              <RideManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/history"
          element={
            <ProtectedRoute roles={["driver"]}>
              <RideHistory />
            </ProtectedRoute>
          }
        />

        {/* Passenger routes */}
        <Route path="/browse/drivers" element={<BrowseDrivers />} />
        <Route path="/browse/drivers/:driverId" element={<DriverDetails />} />
        <Route path="/browse/rides" element={<BrowseRides />} />
        <Route path="/browse/rides/:rideId" element={<RideDetails />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={["user"]}>
              <PassengerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rate-ride/:bookingId"
          element={
            <ProtectedRoute roles={["user"]}>
              <RateRide />
            </ProtectedRoute>
          }
        />

        {/* Compatibility redirects */}
        <Route path="/dashboard" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/vehicles" element={<Navigate to="/driver/vehicles" replace />} />
        <Route path="/rides" element={<Navigate to="/driver/rides" replace />} />
        <Route path="/history" element={<Navigate to="/driver/history" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
