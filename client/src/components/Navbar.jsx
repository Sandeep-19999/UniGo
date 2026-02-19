import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-xl px-3 py-2 text-sm font-semibold",
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hideOn = ["/", "/auth/login", "/auth/register"];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
        <Link to="/" className="text-lg font-extrabold tracking-tight">
          UniGo <span className="text-slate-500">RBAC</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user?.role === "admin" ? (
            <NavItem to="/admin/dashboard">Admin Dashboard</NavItem>
          ) : user?.role === "driver" ? (
            <>
              <NavItem to="/driver/dashboard">Dashboard</NavItem>
              <NavItem to="/driver/vehicles">Vehicles</NavItem>
              <NavItem to="/driver/rides">Rides</NavItem>
              <NavItem to="/driver/history">History</NavItem>
            </>
          ) : user?.role === "user" ? (
            <NavItem to="/home">Home</NavItem>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-sm text-slate-600 md:block">
                {user.name} • <span className="font-medium">{user.role}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/auth/login");
                }}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth/login" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
