import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/public/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/users/admin/AdminDashboard";
import DriverDashboard from "./pages/users/driver/DriverDashboard";
import PassengerHome from "./pages/users/passenger/PassengerHome";

import VehicleManagement from "./pages/vehicles/VehicleManagement";
import RideManagement from "./pages/rides/RideManagement";
import RideHistory from "./pages/rides/RideHistory";
import PassengerRideHistory from "./pages/rides/PassengerRideHistory";
import RideRequestForm from "./pages/rides/RideRequestForm";
import BrowseDrivers from "./pages/rides/BrowseDrivers";
import MyBookings from "./pages/rides/MyBookings";
import RateDriver from "./pages/rides/RateDriver";
import DirectionalHire from "./pages/directional-hire/DirectionalHire";

import Unauthorized from "./pages/common/Unauthorized";
import NotFound from "./pages/common/NotFound";

import SafetyPage from "./pages/SafetyPage";
import PaymentPage from "./pages/PaymentPage";
export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Driver Routes */}
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute roles={["driver"]}>
              <DriverDashboard />
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
        <Route
          path="/driver/directional-hire"
          element={
            <ProtectedRoute roles={["driver"]}>
              <DirectionalHire />
            </ProtectedRoute>
          }
        />

        {/* Passenger Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute roles={["user"]}>
              <PassengerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/request"
          element={
            <ProtectedRoute roles={["user"]}>
              <RideRequestForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/browse"
          element={
            <ProtectedRoute roles={["user"]}>
              <BrowseDrivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/my-bookings"
          element={
            <ProtectedRoute roles={["user"]}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/rate/:bookingId"
          element={
            <ProtectedRoute roles={["user"]}>
              <RateDriver />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/history"
          element={
            <ProtectedRoute roles={["user"]}>
              <PassengerRideHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute roles={["user"]}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/safety"
          element={
            <ProtectedRoute roles={["user"]}>
              <SafetyPage />
            </ProtectedRoute>
          }
        />

        {/* Compatibility redirects */}
        <Route path="/dashboard" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/vehicles" element={<Navigate to="/driver/vehicles" replace />} />
        <Route path="/rides" element={<Navigate to="/driver/rides" replace />} />
        <Route path="/history" element={<Navigate to="/driver/history" replace />} />
        <Route path="/directional-hire" element={<Navigate to="/driver/directional-hire" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}