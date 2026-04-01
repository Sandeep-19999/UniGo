import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/axios";

const STATUS_OPTIONS = ["pending", "approved", "paid", "rejected"];

export default function AdminCashoutRequests() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [noteById, setNoteById] = useState({});
  const [refById, setRefById] = useState({});

  function loadCashouts() {
    setLoading(true);
    setError("");

    api
      .get(`/admin/cashouts?status=${statusFilter}`)
      .then((res) => {
        setItems(res.data?.items || []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load cashout requests.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadCashouts();
  }, [statusFilter]);

  const pendingCount = useMemo(() => items.filter((item) => item.status === "pending").length, [items]);

  async function updateStatus(requestId, status) {
    setSavingId(requestId);
    setError("");

    try {
      await api.patch(`/admin/cashouts/${requestId}`, {
        status,
        adminNote: noteById[requestId] || "",
        payoutReference: refById[requestId] || ""
      });
      loadCashouts();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update cashout request.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Driver Cashout Requests</h1>
          <p className="mt-1 text-sm text-slate-600">Review bank details, approve requests, and mark payouts as paid.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">Pending: {pendingCount}</div>
        </div>
      </header>

      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading cashout requests...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No cashout requests found for this status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Driver</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Bank Details</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.requestId} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.driverName}</div>
                      <div className="text-slate-600">{item.driverEmail}</div>
                      <div className="text-slate-600">{item.driverPhone}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">LKR {Number(item.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{item.bankName}</div>
                      <div>{item.accountHolderName}</div>
                      <div>{item.accountNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <input
                          className="w-52 rounded-md border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Admin note"
                          value={noteById[item.requestId] || ""}
                          onChange={(e) => setNoteById((prev) => ({ ...prev, [item.requestId]: e.target.value }))}
                        />
                        <input
                          className="w-52 rounded-md border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Payout reference"
                          value={refById[item.requestId] || ""}
                          onChange={(e) => setRefById((prev) => ({ ...prev, [item.requestId]: e.target.value }))}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            disabled={savingId === item.requestId || item.status === "approved" || item.status === "paid"}
                            onClick={() => updateStatus(item.requestId, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            disabled={savingId === item.requestId || item.status === "paid"}
                            onClick={() => updateStatus(item.requestId, "paid")}
                          >
                            Mark Paid
                          </button>
                          <button
                            className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            disabled={savingId === item.requestId || item.status === "rejected" || item.status === "paid"}
                            onClick={() => updateStatus(item.requestId, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
