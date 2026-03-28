import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../api/axios";

// =========================================================
// SMALL STAT CARD COMPONENT
// Reusable card used to display top-level admin dashboard stats
// =========================================================
function StatCard({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

// =========================================================
// MANAGEMENT TABLE COMPONENT
// Generic table used for passengers and drivers list views
// =========================================================
function ManagementTable({ title, columns, data, loading, error }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Table title */}
      <div className="border-b p-6">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      {/* API error message */}
      {error && (
        <div className="bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-6 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t bg-slate-50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data && data.length > 0 ? (
                data.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-slate-50">
                    {Object.values(row).map((cell, i) => (
                      <td
                        key={i}
                        className="px-6 py-4 text-sm text-slate-700"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record count footer */}
      {data && (
        <div className="border-t bg-slate-50 p-4 text-sm text-slate-600">
          Total: <span className="font-semibold">{data.length}</span> records
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  // =========================================================
  // STATE: DASHBOARD DATA
  // =========================================================
  const [stats, setStats] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // STATE: LOADING FLAGS
  // Controls loading UI for each independent data section
  // =========================================================
  const [loading, setLoading] = useState({
    stats: true,
    passengers: false,
    drivers: false
  });

  // =========================================================
  // STATE: ERROR MESSAGES
  // Stores API errors separately for each dashboard section
  // =========================================================
  const [errors, setErrors] = useState({
    stats: "",
    passengers: "",
    drivers: ""
  });

  // =========================================================
  // FETCH ADMIN STATS
  // Loads overall dashboard summary numbers when page mounts
  // =========================================================
  useEffect(() => {
    setLoading((prev) => ({ ...prev, stats: true }));

    api
      .get("/admin/stats")
      .then((res) => {
        setStats(res.data.stats);
        setErrors((prev) => ({ ...prev, stats: "" }));
      })
      .catch((err) => {
        setErrors((prev) => ({
          ...prev,
          stats: err?.response?.data?.message || "Failed to load stats"
        }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, stats: false }));
      });
  }, []);

  // =========================================================
  // FETCH PASSENGERS
  // Runs only when admin opens the passengers tab
  // =========================================================
  useEffect(() => {
    if (activeTab === "passengers") {
      setLoading((prev) => ({ ...prev, passengers: true }));

      api
        .get("/admin/passengers")
        .then((res) => {
          const passengerData = res.data.passengers.map((p) => ({
            Name: p.name,
            Email: p.email,
            Phone: p.phone || "N/A",
            Location: p.location || "N/A",
            "Joined Date": new Date(p.createdAt).toLocaleDateString()
          }));

          setPassengers(passengerData);
          setErrors((prev) => ({ ...prev, passengers: "" }));
        })
        .catch((err) => {
          setErrors((prev) => ({
            ...prev,
            passengers: err?.response?.data?.message || "Failed to load passengers"
          }));
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, passengers: false }));
        });
    }
  }, [activeTab]);

  // =========================================================
  // FETCH DRIVERS
  // Runs only when admin opens the drivers tab
  // =========================================================
  useEffect(() => {
    if (activeTab === "drivers") {
      setLoading((prev) => ({ ...prev, drivers: true }));

      api
        .get("/admin/drivers")
        .then((res) => {
          const driverData = res.data.drivers.map((d) => ({
            Name: d.name,
            Email: d.email,
            Phone: d.phone || "N/A",
            Location: d.location || "N/A",
            Rating: d.rating || "N/A",
            "Joined Date": new Date(d.createdAt).toLocaleDateString()
          }));

          setDrivers(driverData);
          setErrors((prev) => ({ ...prev, drivers: "" }));
        })
        .catch((err) => {
          setErrors((prev) => ({
            ...prev,
            drivers: err?.response?.data?.message || "Failed to load drivers"
          }));
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, drivers: false }));
        });
    }
  }, [activeTab]);



  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {/* =====================================================
            HEADER SECTION
            Includes title, description, and quick admin action
        ===================================================== */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage passengers, drivers, payments, and system settings
            </p>
          </div>

          {/* Quick action button to open driver onboarding review page */}
          <Link
            to="/admin/driver-reviews"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Driver Reviews
          </Link>
        </div>

        {/* =====================================================
            QUICK ACTION CARD
            Highlight entry point for approving driver documents
        ===================================================== */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Driver Onboarding Review
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Review profile photos, licenses, insurance, revenue licenses,
                and vehicle registration documents submitted by drivers.
              </p>
            </div>

            <Link
              to="/admin/driver-reviews"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Go to Review Queue
            </Link>
          </div>
        </div>

        {/* =====================================================
            STATS CARD SECTION
            Shows main system counts after stats are loaded
        ===================================================== */}
        {!loading.stats && stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Passengers"
              value={stats.totalPassengers}
              icon="👥"
              color="text-blue-600"
            />
            <StatCard
              label="Total Drivers"
              value={stats.totalDrivers}
              icon="🚗"
              color="text-green-600"
            />
            <StatCard
              label="Total Bookings"
              value={stats.totalBookings}
              icon="📅"
              color="text-purple-600"
            />
            <StatCard
              label="Total Revenue"
              value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
              icon="💰"
              color="text-yellow-600"
            />
          </div>
        )}

        {/* =====================================================
            STATS ERROR MESSAGE
        ===================================================== */}
        {errors.stats && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.stats}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 animate-pulse">
            {successMessage}
          </div>
        )}

        {/* =====================================================
            TAB NAVIGATION
            Switches between overview, passengers, drivers, payments
        ===================================================== */}
        <div className="flex gap-4 border-b border-slate-200">
          {["overview", "passengers", "drivers", "payments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* =====================================================
            TAB CONTENT: OVERVIEW
            Shows summary cards and calculated system metrics
        ===================================================== */}
        {activeTab === "overview" && stats && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Booking stats */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold">Booking Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Completed Bookings</span>
                  <span className="font-semibold text-green-600">
                    {stats.completedBookings}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Active Bookings</span>
                  <span className="font-semibold text-blue-600">
                    {stats.activeBookings}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Completion Rate</span>
                  <span className="font-semibold text-purple-600">
                    {stats.totalBookings > 0
                      ? `${(
                          (stats.completedBookings / stats.totalBookings) *
                          100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* System-level stats */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold">System Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Admin Accounts</span>
                  <span className="font-semibold">{stats.totalAdmins}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Total Users</span>
                  <span className="font-semibold">
                    {stats.totalPassengers + stats.totalDrivers}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Driver/Passenger Ratio</span>
                  <span className="font-semibold">
                    {stats.totalPassengers > 0
                      ? (stats.totalDrivers / stats.totalPassengers).toFixed(2)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            TAB CONTENT: PASSENGERS
            Displays passengers table
        ===================================================== */}
        {activeTab === "passengers" && (
          <ManagementTable
            title="Passenger Management"
            columns={["Name", "Email", "Phone", "Location", "Joined Date"]}
            data={passengers}
            loading={loading.passengers}
            error={errors.passengers}
          />
        )}

        {/* =====================================================
            TAB CONTENT: DRIVERS
            Displays drivers table
        ===================================================== */}
        {activeTab === "drivers" && (
          <ManagementTable
            title="Driver Management"
            columns={["Name", "Email", "Phone", "Location", "Rating", "Joined Date"]}
            data={drivers}
            loading={loading.drivers}
            error={errors.drivers}
          />
        )}



        {/* =====================================================
            TAB CONTENT: PAYMENTS
            Placeholder area for future payment management
        ===================================================== */}
        {activeTab === "payments" && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold">Payment Management</h2>

            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Payment tracking and management features coming soon.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats ? `$${(stats.totalRevenue || 0).toLocaleString()}` : "$0"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm text-slate-600">
                    Completed Transactions
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats ? stats.completedBookings : "0"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}