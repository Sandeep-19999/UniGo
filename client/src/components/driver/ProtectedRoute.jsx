import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canDriverAccessDashboard, getDriverNextRoute } from '../utils/driverOnboarding';

export default function ProtectedRoute({ roles = [], requireApprovedDriverOnboarding = false, children }) {
  const { user, loading, driverOnboarding, driverOnboardingLoading } = useAuth();
  const location = useLocation();

  if (loading || (user?.role === 'driver' && driverOnboardingLoading)) {
    return <div className="mx-auto max-w-6xl p-6">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (user.role === 'driver' && requireApprovedDriverOnboarding && !canDriverAccessDashboard(driverOnboarding)) {
    return (
      <Navigate
        to={getDriverNextRoute(driverOnboarding)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
