import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function BrandIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 17l-2 2m0 0l2 2m-2-2h8a4 4 0 004-4V3" />
        <path d="M17 7l2-2m0 0l-2-2m2 2H11a4 4 0 00-4 4v12" />
      </svg>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
    </svg>
  );
}

function VehicleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 14l2-6h14l2 6" />
      <path d="M5 14h14v4H5z" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="16.5" cy="18.5" r="1.5" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 109-9" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CashoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v10H3z" />
      <path d="M16 12h2" />
      <path d="M7 12h5" />
      <circle cx="9" cy="12" r="2" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: "Dashboard", to: "/driver/dashboard", icon: DashboardIcon },
  { label: "Ride History", to: "/driver/history", icon: HistoryIcon },
  { label: "Vehicle Details", to: "/driver/vehicles", icon: VehicleIcon },
  { label: "Cashout", to: "/driver/cashout", icon: CashoutIcon }
];

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) => ["driver-sidebar-link", isActive ? "driver-sidebar-link-active" : ""].join(" ")}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon />
      </span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function DriverLayout({ title, subtitle, actions, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => location.pathname.startsWith(item.to)),
    [location.pathname]
  );

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <BrandIcon />
        <div>
          <div className="text-lg font-extrabold tracking-tight text-slate-900">UniGo Driver</div>
          <div className="text-xs font-medium text-slate-500">Ride operations workspace</div>
        </div>
      </div>

      <div className="px-4">
        <div className="rounded-[28px] bg-slate-50 p-3">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Navigation
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-6 px-4">
        <div className="driver-card p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Driver profile</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
              {(user?.name || "D").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{user?.name || "Driver"}</div>
              <div className="text-sm text-slate-500">{user?.email || user?.role || "driver"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto px-4 pb-6">
        <button type="button" onClick={handleLogout} className="driver-btn-secondary w-full justify-center">
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] shrink-0 border-r border-slate-200/80 bg-white md:block">{sidebar}</aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[290px] border-r border-slate-200 bg-white shadow-2xl">{sidebar}</div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#f4f7f6]/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden"
                >
                  <MenuIcon />
                </button>

                <div className="hidden min-w-[280px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:flex">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input
                    className="w-full bg-transparent text-sm text-slate-700 outline-none"
                    placeholder="Search dashboard, history, cashout, vehicle details..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:block">
                  {activeItem?.label || "Driver"} workspace
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-900">
                  {(user?.name || "D").slice(0, 1).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Driver module
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
              </div>

              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}