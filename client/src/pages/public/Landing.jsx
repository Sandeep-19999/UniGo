import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "driver") return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2400&q=70)"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950/90" />

        <header className="relative z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-yellow-400/90 text-slate-900 grid place-items-center font-black">
                U
              </div>
              <div className="text-lg font-extrabold tracking-tight">
                UniGo <span className="text-white/70">Ride Share</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/auth/login"
                className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-yellow-300"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Register
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Your Journey with <span className="text-white">UniGo</span>
            </h1>
            <div className="mt-2 text-4xl font-extrabold md:text-6xl">
              <span className="text-white/90">Starts Here</span>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 md:text-lg">
              University-only ride sharing with role-based access: Admin, Driver, Passenger.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth/login"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/15"
              >
                Create Account
              </Link>
            </div>

            <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="font-extrabold">Driver Module</div>
                  <div className="mt-1 text-sm text-white/80">Vehicles, rides, history, earnings.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="font-extrabold">Passenger Module</div>
                  <div className="mt-1 text-sm text-white/80">Booking scaffolded.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="font-extrabold">Admin Control</div>
                  <div className="mt-1 text-sm text-white/80">Dashboard scaffolded.</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/70">
                Tip: register as <b>driver</b> to manage vehicles and rides.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
