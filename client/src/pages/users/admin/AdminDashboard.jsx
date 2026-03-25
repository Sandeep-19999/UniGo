import { useEffect, useState } from "react";
import { api } from "../../../api/axios";

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

// Management Table Component
function ManagementTable({ title, columns, data, loading, error }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      {error && (
        <div className="p-6 text-sm text-red-700 bg-red-50">
          {error}
        </div>
      )}

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

      {data && (
        <div className="p-4 border-t text-sm text-slate-600 bg-slate-50">
          Total: <span className="font-semibold">{data.length}</span> records
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState({
    stats: true,
    passengers: false,
    drivers: false
  });

  const [errors, setErrors] = useState({
    stats: "",
    passengers: "",
    drivers: ""
  });

  // Fetch stats
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
      .finally(() => setLoading((prev) => ({ ...prev, stats: false })));
  }, []);

  // Fetch passengers
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
        .finally(() => setLoading((prev) => ({ ...prev, passengers: false })));
    }
  }, [activeTab]);

  // Fetch drivers
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
        .finally(() => setLoading((prev) => ({ ...prev, drivers: false })));
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage passengers, drivers, payments, and system settings
          </p>
        </div>

        {/* Stats Cards */}
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

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-200">
          {["overview", "passengers", "drivers", "payments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && stats && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Additional Stats */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold mb-4">Booking Overview</h3>
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
                      ? `${((stats.completedBookings / stats.totalBookings) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold mb-4">System Overview</h3>
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
                      ? (
                        stats.totalDrivers / stats.totalPassengers
                      ).toFixed(2)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "passengers" && (
          <ManagementTable
            title="Passenger Management"
            columns={["Name", "Email", "Phone", "Location", "Joined Date"]}
            data={passengers}
            loading={loading.passengers}
            error={errors.passengers}
          />
        )}

        {activeTab === "drivers" && (
          <ManagementTable
            title="Driver Management"
            columns={["Name", "Email", "Phone", "Location", "Rating", "Joined Date"]}
            data={drivers}
            loading={loading.drivers}
            error={errors.drivers}
          />
        )}

        {activeTab === "payments" && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Payment Management</h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Payment tracking and management features coming soon.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600 mb-2">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats ? `$${(stats.totalRevenue || 0).toLocaleString()}` : "$0"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-600 mb-2">Completed Transactions</p>
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