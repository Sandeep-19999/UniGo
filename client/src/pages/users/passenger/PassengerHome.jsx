import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api/axios";
import { formatCurrency } from "../../../utils/paymentHelpers";
import StatCard from "../../../components/StatCard";

function rideAmount(ride) {
  if (Number(ride?.finalFare) > 0) return Number(ride.finalFare);
  if (Number(ride?.estimatedFare) > 0) return Number(ride.estimatedFare);
  if (Number(ride?.estimatedPrice) > 0) return Number(ride.estimatedPrice);
  return 0;
}

function formatRideDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

export default function PassengerHome() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(450);
  const [completedRides, setCompletedRides] = useState(0);
  const [rating, setRating] = useState(4.8);
  const [totalBookings, setTotalBookings] = useState(0);
  const [activeRides, setActiveRides] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [recentRides, setRecentRides] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Fetch passenger rides and calculate statistics
    api
      .get("/passenger/rides")
      .then((r) => {
        const rides = r.data.rideRequests || [];
        setTotalBookings(rides.length);

        const sortedRecentRides = [...rides]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 3)
          .map((ride, index) => ({
            id: ride._id || ride.id || index,
            date: ride.createdAt,
            from: ride.pickupLocation || ride.from || "Pickup location",
            to: ride.dropLocation || ride.to || "Drop location",
            distance: ride.distance || ride.tripDistance || null,
            amount: rideAmount(ride),
            status: ride.status ? ride.status.charAt(0).toUpperCase() + ride.status.slice(1) : "Completed",
          }));

        setRecentRides(sortedRecentRides);
        
        // Calculate rides by status
        const completedCount = rides.filter(ride => ride.status === "completed").length;
        const activeCount = rides.filter(ride => ride.status === "active" || ride.status === "accepted").length;
        const pendingCount = rides.filter(ride => ride.status === "pending").length;
        
        setCompletedRides(completedCount);
        setActiveRides(activeCount);
        setPendingBookings(pendingCount);
      })
      .catch((e) => {
        setErr(e?.response?.data?.message || "Failed to load passenger home");
        console.error("Error fetching rides:", e);
      });

    // Fetch home page message
    api
      .get("/passenger/home")
      .then((r) => console.log("Passenger home loaded:", r.data.message))
      .catch((e) => console.error("Failed to load passenger home message:", e));
  }, []);

  return (
    <div className="unigo-shell min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header Greeting */}
        <div className="unigo-fade-up">
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
            Welcome back, <span className="text-emerald-700">{user?.name || "Passenger"}</span>
          </h1>
          <p className="mt-2 text-slate-600">
            Continue your journey with UniGo. Book rides, check your wallet, and stay safe.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="unigo-fade-up flex gap-2 border-b border-slate-200 [animation-delay:40ms]">
          <button className="border-b-2 border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-600">
            📊 Dashboard
          </button>
          <Link
            to="/rides/history"
            className="border-b-2 border-transparent px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            📜 Ride History
          </Link>
        </div>

        {/* Key Statistics Cards */}
        <div className="unigo-fade-up grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [animation-delay:50ms]">
          <StatCard 
            label="Total Bookings" 
            value={totalBookings}
            hint={totalBookings === 1 ? "1 booking" : `${totalBookings} bookings`}
          />
          <StatCard 
            label="Completed Rides" 
            value={completedRides}
            hint={completedRides === 1 ? "1 ride" : `${completedRides} rides`}
          />
          <StatCard 
            label="Active Rides" 
            value={activeRides}
            hint={activeRides === 0 ? "No active rides" : `${activeRides} ongoing`}
          />
          <StatCard 
            label="Pending" 
            value={pendingBookings}
            hint={pendingBookings === 0 ? "All caught up" : `Awaiting driver`}
          />
        </div>

        {/* Quick Status Cards */}
        <div className="unigo-fade-up grid gap-4 sm:grid-cols-3 [animation-delay:100ms]">
          <div className="unigo-glass rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Wallet Balance</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(walletBalance)}</p>
            <Link
              to="/payments"
              className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Top up balance →
            </Link>
          </div>

          <div className="unigo-glass rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Rides Completed</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{completedRides}</p>
            <p className="mt-3 text-sm text-slate-600">Join 1000+ campus riders</p>
          </div>

          <div className="unigo-glass rounded-2xl p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Your Rating</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{rating} ⭐</p>
            <p className="mt-3 text-sm text-slate-600">Trusted and reliable</p>
          </div>
        </div>

        {/* Error Message */}
        {err ? (
          <div className="unigo-fade-up rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 [animation-delay:200ms]">
            {err}
          </div>
        ) : null}

        {/* Primary CTA & Quick Action */}
        <div className="unigo-fade-up grid gap-4 sm:grid-cols-2 [animation-delay:150ms]">
          <Link
            to="/rides/request"
            className="rounded-2xl bg-emerald-600 px-6 py-4 text-center font-bold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-500"
          >
            🚗 Book Your Next Ride
          </Link>
          <button className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-bold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
            🚨 Find Nearby Drivers
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="unigo-fade-up grid gap-6 lg:grid-cols-3 [animation-delay:200ms]">
          {/* Recent Rides */}
          <div className="lg:col-span-2 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recent Rides</h2>
              <p className="mt-1 text-sm text-slate-600">Your trip history and earnings</p>
            </div>

            {recentRides.length === 0 ? (
              <div className="unigo-glass rounded-2xl p-8 text-center">
                <p className="text-slate-600">No rides yet. Start your first journey!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="unigo-glass rounded-2xl border border-white/60 p-5 transition hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{ride.from}</h3>
                          <span className="text-slate-400">→</span>
                          <h3 className="font-semibold text-slate-900">{ride.to}</h3>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span>📅 {formatRideDate(ride.date)}</span>
                          {ride.distance ? <span>📏 {ride.distance} km</span> : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(ride.amount)}</p>
                        <p className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                          {ride.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/rides/history"
              className="mt-4 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              View all rides →
            </Link>
          </div>

          {/* Feature Shortcuts */}
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Features</h2>
              <p className="mt-1 text-sm text-slate-600">Quick access to modules</p>
            </div>

            <Link
              to="/payments"
              className="unigo-glass group rounded-2xl border border-white/60 p-5 transition hover:shadow-lg"
            >
              <div className="text-3xl">💳</div>
              <h3 className="mt-2 font-semibold text-slate-900">Payments</h3>
              <p className="mt-1 text-xs text-slate-600">Fares, history, wallet</p>
              <p className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-emerald-500">
                Open →
              </p>
            </Link>

            <Link
              to="/safety"
              className="unigo-glass group rounded-2xl border border-white/60 p-5 transition hover:shadow-lg"
            >
              <div className="text-3xl">🛡️</div>
              <h3 className="mt-2 font-semibold text-slate-900">Safety</h3>
              <p className="mt-1 text-xs text-slate-600">SOS, location, contacts</p>
              <p className="mt-3 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-emerald-500">
                Open →
              </p>
            </Link>

            <div className="unigo-glass rounded-2xl border border-white/60 p-5">
              <div className="text-3xl">📢</div>
              <h3 className="mt-2 font-semibold text-slate-900">Promotions</h3>
              <p className="mt-1 text-xs text-slate-600">STUDENT15 - Get 15% off</p>
              <p className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                Limited time
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="unigo-fade-up rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-8 text-white [animation-delay:300ms]">
          <h3 className="text-lg font-bold">Need Help?</h3>
          <p className="mt-2 text-slate-300">
            Have questions about a ride, payment, or safety? Our support team is here to help.
          </p>
          <button className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
