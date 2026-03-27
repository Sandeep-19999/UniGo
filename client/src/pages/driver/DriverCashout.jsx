import { useEffect, useMemo, useState } from "react";
import DriverLayout from "../../components/driver/DriverLayout";
import { api } from "../../api/axios";
import { fmtMoney, fmtDateTime } from "../../utils/format";

const INITIAL_FORM = {
  amount: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  note: ""
};

export default function DriverCashout() {
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState({ rideEarnings: [], cashoutRequests: [] });
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      await api.post("/driver/earnings/cashout", {
        amount: Number(form.amount || 0),
        method: "bank_transfer",
        bankName: form.bankName,
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        note: form.note
      });

      setMessage("Cashout request submitted.");
      setForm(INITIAL_FORM);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit cashout request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DriverLayout
      title="Cashout & Earnings"
      subtitle="Track ride income, available balance, and submit withdrawal requests without affecting the rest of the driver dashboard flow."
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

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
                  <tr key={`${item.rideId}-${item.earnedAt}`} className="border-t border-slate-100">
                    <td>{fmtDateTime(item.earnedAt)}</td>
                    <td>{item.routeLabel || "Ride completed"}</td>
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
          <div className="text-xl font-bold text-slate-950">Request cashout</div>
          <div className="mt-1 text-sm text-slate-500">Submit a bank transfer request from your available balance.</div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Amount (LKR)</label>
              <input className="driver-input w-full" type="number" min="1" max={Math.max(0, availableBalance)} value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Enter amount" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Bank name</label>
              <input className="driver-input w-full" value={form.bankName} onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))} placeholder="Commercial Bank" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Account holder</label>
              <input className="driver-input w-full" value={form.accountHolderName} onChange={(e) => setForm((prev) => ({ ...prev, accountHolderName: e.target.value }))} placeholder="Driver full name" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Account number</label>
              <input className="driver-input w-full" value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))} placeholder="Account number" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Note</label>
              <textarea className="driver-input min-h-[110px] w-full" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="Optional note for the admin payout team" />
            </div>
            <button type="submit" className="driver-btn-primary w-full justify-center" disabled={busy || availableBalance <= 0}>
              {busy ? "Submitting..." : availableBalance > 0 ? "Request withdrawal" : "No balance available"}
            </button>
          </form>

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