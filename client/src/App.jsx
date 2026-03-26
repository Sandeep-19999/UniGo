import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// =========================================================
// PUBLIC PAGES
// These pages are available without login
// =========================================================
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// =========================================================
// ADMIN PAGES
// These pages are only for admin users
// =========================================================
import AdminDashboard from './pages/users/admin/AdminDashboard';
import AdminDriverReviewPage from './pages/users/admin/AdminDriverReviewPage';

// =========================================================
// DRIVER MAIN PAGES
// These are the main driver module pages after approval
// =========================================================
import DriverDashboard from './pages/users/driver/DriverDashboard';
import VehicleManagement from './pages/vehicles/VehicleManagement';
import RideManagement from './pages/rides/RideManagement';
import RideHistory from './pages/rides/RideHistory';
import DirectionalHire from './pages/directional-hire/DirectionalHire';

// =========================================================
// DRIVER ONBOARDING PAGES
// These pages are used before the driver gets full approval
// =========================================================
import DriverOnboardingHome from './pages/driver-onboarding/DriverOnboardingHome';
import DriverProfileSetup from './pages/driver-onboarding/DriverProfileSetup';
import DriverVehicleSetup from './pages/driver-onboarding/DriverVehicleSetup';
import DriverDocumentUpload from './pages/driver-onboarding/DriverDocumentUpload';
import DriverDocumentSubmitted from './pages/driver-onboarding/DriverDocumentSubmitted';
import DriverReviewPending from './pages/driver-onboarding/DriverReviewPending';
import DriverApproved from './pages/driver-onboarding/DriverApproved';

// =========================================================
// PASSENGER PAGES
// These pages are for the passenger-side ride flow
// =========================================================
import PassengerHome from './pages/users/passenger/PassengerHome';
import RideRequestForm from './pages/rides/RideRequestForm';
import BrowseDrivers from './pages/rides/BrowseDrivers';
import MyBookings from './pages/rides/MyBookings';
import RateDriver from './pages/rides/RateDriver';
import PassengerRideHistory from './pages/rides/PassengerRideHistory';

// =========================================================
// COMMON / SHARED PAGES
// Utility pages used by multiple roles
// =========================================================
import Unauthorized from './pages/common/Unauthorized';
import NotFound from './pages/common/NotFound';
import SafetyPage from './pages/SafetyPage';
import PaymentPage from './pages/PaymentPage';

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Global navigation bar shown across the app */}
      <Navbar />

      <Routes>
        {/* =====================================================
            PUBLIC ROUTES
            Open for all users without authentication
        ===================================================== */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* =====================================================
            ADMIN ROUTES
            Accessible only for users with admin role
        ===================================================== */}

        {/* Main admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Driver onboarding review page for admin approval/rejection */}
        <Route
          path="/admin/driver-reviews"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDriverReviewPage />
            </ProtectedRoute>
          }
        />

        {/* Optional shortcut: /admin -> /admin/dashboard */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        {/* =====================================================
            DRIVER ONBOARDING ROUTES
            These routes are allowed for driver role before
            full approval is completed
        ===================================================== */}

        {/* Driver onboarding home / account status page */}
        <Route
          path="/driver/onboarding"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverOnboardingHome />
            </ProtectedRoute>
          }
        />

        {/* Optional alias for driver account status */}
        <Route
          path="/driver/account-status"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverOnboardingHome />
            </ProtectedRoute>
          }
        />

        {/* Driver profile setup page */}
        <Route
          path="/driver/onboarding/account"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* Driver vehicle setup page */}
        <Route
          path="/driver/onboarding/vehicle"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverVehicleSetup />
            </ProtectedRoute>
          }
        />

        {/* Dynamic document upload route
            Example:
            /driver/onboarding/document/profile_photo
            /driver/onboarding/document/driving_license
        */}
        <Route
          path="/driver/onboarding/document/:documentType"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverDocumentUpload />
            </ProtectedRoute>
          }
        />

        {/* Page shown after document submission */}
        <Route
          path="/driver/onboarding/submitted"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverDocumentSubmitted />
            </ProtectedRoute>
          }
        />

        {/* Review pending page
            Driver comes here after submitting all required documents
            and waits for admin approval before dashboard access */}
        <Route
          path="/driver/onboarding/review-pending"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverReviewPending />
            </ProtectedRoute>
          }
        />

        {/* Approved page
            Driver comes here after admin approves all required
            onboarding documents, then can continue to dashboard */}
        <Route
          path="/driver/onboarding/approved"
          element={
            <ProtectedRoute roles={['driver']}>
              <DriverApproved />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            DRIVER MAIN MODULE ROUTES
            These routes require:
            1. driver role
            2. approved onboarding
            So blocked drivers cannot access them
        ===================================================== */}

        {/* Driver dashboard */}
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        {/* Driver vehicle management */}
        <Route
          path="/driver/vehicles"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <VehicleManagement />
            </ProtectedRoute>
          }
        />

        {/* Driver ride management */}
        <Route
          path="/driver/rides"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <RideManagement />
            </ProtectedRoute>
          }
        />

        {/* Driver ride history */}
        <Route
          path="/driver/history"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <RideHistory />
            </ProtectedRoute>
          }
        />

        {/* Driver directional hire page */}
        <Route
          path="/driver/directional-hire"
          element={
            <ProtectedRoute roles={['driver']} requireApprovedDriverOnboarding>
              <DirectionalHire />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            PASSENGER ROUTES
            These routes are for normal user/passenger role
        ===================================================== */}

        {/* Passenger home page */}
        <Route
          path="/home"
          element={
            <ProtectedRoute roles={['user']}>
              <PassengerHome />
            </ProtectedRoute>
          }
        />

        {/* Passenger creates a new ride request */}
        <Route
          path="/rides/request"
          element={
            <ProtectedRoute roles={['user']}>
              <RideRequestForm />
            </ProtectedRoute>
          }
        />

        {/* Passenger browses available rides/drivers */}
        <Route
          path="/rides/browse"
          element={
            <ProtectedRoute roles={['user']}>
              <BrowseDrivers />
            </ProtectedRoute>
          }
        />

        {/* Passenger booking list */}
        <Route
          path="/rides/my-bookings"
          element={
            <ProtectedRoute roles={['user']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Passenger rates a driver after a completed trip */}
        <Route
          path="/rides/rate/:bookingId"
          element={
            <ProtectedRoute roles={['user']}>
              <RateDriver />
            </ProtectedRoute>
          }
        />

        {/* Passenger ride history */}
        <Route
          path="/rides/history"
          element={
            <ProtectedRoute roles={['user']}>
              <PassengerRideHistory />
            </ProtectedRoute>
          }
        />

        {/* Passenger payment page */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute roles={['user']}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        {/* Passenger safety page */}
        <Route
          path="/safety"
          element={
            <ProtectedRoute roles={['user']}>
              <SafetyPage />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            LEGACY / SHORTCUT REDIRECT ROUTES
            These help older paths redirect to the new structure
        ===================================================== */}
        <Route
          path="/dashboard"
          element={<Navigate to="/driver/dashboard" replace />}
        />
        <Route
          path="/vehicles"
          element={<Navigate to="/driver/vehicles" replace />}
        />
        <Route
          path="/rides"
          element={<Navigate to="/driver/rides" replace />}
        />
        <Route
          path="/history"
          element={<Navigate to="/driver/history" replace />}
        />
        <Route
          path="/directional-hire"
          element={<Navigate to="/driver/directional-hire" replace />}
        />

        {/* =====================================================
            FALLBACK ROUTE
            If no matching route exists, show Not Found page
        ===================================================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}