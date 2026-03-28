import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import AdminDashboard from './pages/users/admin/AdminDashboard';
import AdminDriverReviewPage from './pages/users/admin/AdminDriverReviewPage';

import DriverDashboard from './pages/users/driver/DriverDashboard';
import VehicleManagement from './pages/vehicles/VehicleManagement';
import RideHistory from './pages/rides/RideHistory';

import DriverOnboardingHome from './pages/driver-onboarding/DriverOnboardingHome';
import DriverProfileSetup from './pages/driver-onboarding/DriverProfileSetup';
import DriverVehicleSetup from './pages/driver-onboarding/DriverVehicleSetup';
import DriverDocumentUpload from './pages/driver-onboarding/DriverDocumentUpload';
import DriverDocumentSubmitted from './pages/driver-onboarding/DriverDocumentSubmitted';
import DriverReviewPending from './pages/driver-onboarding/DriverReviewPending';
import DriverApproved from './pages/driver-onboarding/DriverApproved';

import PassengerHome from './pages/users/passenger/PassengerHome';
import RideRequestForm from './pages/rides/RideRequestForm';
import MyBookings from './pages/rides/MyBookings';
import RideTrackingPage from './pages/rides/RideTrackingPage';
import PassengerRideHistory from './pages/rides/PassengerRideHistory';
import RideDetailsPage from './pages/rides/RideDetailsPage';
import DriverCashout from './pages/driver/DriverCashout';

import Unauthorized from './pages/common/Unauthorized';
import NotFound from './pages/common/NotFound';
import SafetyPage from './pages/SafetyPage';
import PaymentPage from './pages/PaymentPage';

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
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/driver-reviews"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDriverReviewPage />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route
          path="/driver/onboarding"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverOnboardingHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/account-status"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverOnboardingHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/onboarding/account"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverProfileSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/onboarding/vehicle"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverVehicleSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/onboarding/document/:documentType"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverDocumentUpload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/onboarding/submitted"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverDocumentSubmitted />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/onboarding/review-pending"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverReviewPending />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/onboarding/approved"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverApproved />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/vehicles"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <VehicleManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/rides"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <Navigate to="/driver/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/history"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <RideHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/cashout"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <DriverCashout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/directional-hire"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <Navigate to="/driver/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute roles={['user']}>
              <PassengerHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/request"
          element={
            <ProtectedRoute roles={['user']}>
              <RideRequestForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/my-bookings"
          element={
            <ProtectedRoute roles={['user']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/track/:bookingId"
          element={
            <ProtectedRoute roles={['user']}>
              <RideTrackingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/history"
          element={
            <ProtectedRoute roles={['user']}>
              <PassengerRideHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rides/details/:bookingId"
          element={
            <ProtectedRoute roles={['user']}>
              <RideDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute roles={['user']}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/safety"
          element={
            <ProtectedRoute roles={['user']}>
              <SafetyPage />
            </ProtectedRoute>
          }
        />

        <Route path="/dashboard" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/vehicles" element={<Navigate to="/driver/vehicles" replace />} />
        <Route path="/rides" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/history" element={<Navigate to="/driver/history" replace />} />
        <Route path="/directional-hire" element={<Navigate to="/driver/dashboard" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}