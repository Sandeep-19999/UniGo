import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="mx-auto max-w-6xl p-6">Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;

  if (roles.length && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
