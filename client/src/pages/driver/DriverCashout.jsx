import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverLayout from "../../components/driver/DriverLayout";
import { api } from "../../api/axios";
import { fmtMoney, fmtDateTime } from "../../utils/format";

export default function DriverCashout() {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState({ rideEarnings: [], cashoutRequests: [] });
  const [error, setError] = useState("");
  const [withdrawnInput, setWithdrawnInput] = useState("");

  async function loadData() {
    const [summaryRes, historyRes] = await Promise.all([
      api.get("/driver/earnings/summary"),
      api.get("/driver/earnings/history?limit=10")
    ]);

    setEarnings(summaryRes.data?.earnings || null);
    setHistory({
      rideEarnings: historyRes.data?.rideEarnings || [],
      cashoutRequests: historyRes.data?.cashoutRequests || []
    });
  }

  useEffect(() => {
    loadData().catch((err) => {
      setError(err?.response?.data?.message || "Failed to load earnings data.");
    });
  }, []);

  const availableBalance = Number(earnings?.availableBalance || 0);
  const lifetimeEarnings = Number(earnings?.totalEarnings || 0);
  const totalWithdrawn = Number(earnings?.totalWithdrawn || 0);
  const completedRides = Number(earnings?.completedRides || 0);

  const lastRideRows = useMemo(() => history.rideEarnings || [], [history.rideEarnings]);
  const lastCashouts = useMemo(() => history.cashoutRequests || [], [history.cashoutRequests]);

  function handleWithdraw() {
    const amount = Number(withdrawnInput || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid withdrawal amount.");
      return;
    }

    if (amount > availableBalance) {
      setError(`Withdrawal amount exceeds available balance (${fmtMoney(availableBalance)}).`);
      return;
    }

    setError("");
    navigate("/driver/withdrawal", { state: { withdrawalAmount: amount } });
  }

  return (
    <DriverLayout
      title="Cashout & Earnings"
      subtitle="Track ride income, available balance, and view withdrawal requests without affecting the rest of the driver dashboard flow."
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Available balance</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{fmtMoney(availableBalance)}</div>
          <div className="mt-2 text-sm text-slate-500">Ready for cashout requests.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lifetime earnings</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{fmtMoney(lifetimeEarnings)}</div>
          <div className="mt-2 text-sm text-slate-500">All completed ride earnings.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Withdrawn</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{fmtMoney(totalWithdrawn)}</div>
          <div className="mt-2 text-sm text-slate-500">Amount already requested for payout.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Completed rides</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{completedRides}</div>
          <div className="mt-2 text-sm text-slate-500">Trips credited to your account.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="driver-table-wrap overflow-hidden">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="text-xl font-bold text-slate-950">Recent ride earnings</div>
            <div className="mt-1 text-sm text-slate-500">Each completed ride automatically adds to earnings and available balance.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lastRideRows.map((item) => (
                  <tr key={`${item.rideId}-${item.date}`} className="border-t border-slate-100">
                    <td>{fmtDateTime(item.date)}</td>
                    <td>{item.route || "Ride completed"}</td>
                    <td className="capitalize">{item.status || "completed"}</td>
                    <td>{fmtMoney(item.amount)}</td>
                  </tr>
                ))}
                {lastRideRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No ride earnings yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="driver-card p-6">
          <div className="text-xl font-bold text-slate-950">Withdrawn Amount</div>
          <div className="mt-1 text-sm text-slate-500">Total amount already withdrawn from your earnings.</div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Enter Withdrawn Amount</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-600 font-semibold">LKR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={withdrawnInput}
                  onChange={(e) => setWithdrawnInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-14 pr-4 text-lg font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <button type="button" className="driver-btn-primary w-full justify-center" onClick={handleWithdraw}>
              Withdrawn
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <div className="text-sm font-semibold text-slate-900">Recent cashout requests</div>
            <div className="mt-3 space-y-3">
              {lastCashouts.map((item) => (
                <div key={`${item._id}-${item.requestedAt}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{fmtMoney(item.amount)}</div>
                      <div className="text-xs text-slate-500">{fmtDateTime(item.requestedAt)}</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">{item.status}</div>
                  </div>
                </div>
              ))}
              {lastCashouts.length === 0 ? <div className="text-sm text-slate-500">No cashout requests yet.</div> : null}
            </div>
          </div>
        </section>
      </div>
    </DriverLayout>
  );
}