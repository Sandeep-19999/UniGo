import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DriverLayout from "../../components/driver/DriverLayout";
import { api } from "../../api/axios";
import { fmtMoney } from "../../utils/format";

export default function DriverWithdrawalPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const withdrawalAmount = Number(location.state?.withdrawalAmount || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    accountType: "savings",
    routingNumber: "",
    note: ""
  });

  useEffect(() => {
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      navigate("/driver/cashout", { replace: true });
      return;
    }

    api
      .get("/driver/earnings/account-details")
      .then((res) => {
        const bank = res.data?.accountDetails?.bankAccount || {};
        setForm((prev) => ({
          ...prev,
          accountHolderName: bank.accountHolderName || "",
          accountNumber: bank.accountNumber || "",
          bankName: bank.bankName || "",
          accountType: bank.accountType || "savings",
          routingNumber: bank.routingNumber || ""
        }));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to load account details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, withdrawalAmount]);

  const isBankFormValid = useMemo(() => {
    return (
      form.accountHolderName.trim().length > 1 &&
      form.accountNumber.trim().length > 4 &&
      form.bankName.trim().length > 1
    );
  }, [form]);

  async function saveAccountDetails() {
    setSaving(true);
    setError("");

    try {
      await api.post("/driver/earnings/account-details", {
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        bankName: form.bankName,
        accountType: form.accountType,
        routingNumber: form.routingNumber
      });
      setSuccess("Bank account details saved.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save account details.");
    } finally {
      setSaving(false);
    }
  }

  async function submitWithdrawal() {
    setSubmitting(true);
    setError("");

    try {
      await api.post("/driver/earnings/cashout", {
        amount: withdrawalAmount,
        method: "bank_transfer",
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        bankName: form.bankName,
        note: form.note
      });
      navigate("/driver/cashout", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DriverLayout title="Withdraw Earnings" subtitle="Confirm account details and submit your withdrawal request.">
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="driver-card p-6">
          <div className="text-xl font-bold text-slate-950">Withdrawal Summary</div>
          <div className="mt-1 text-sm text-slate-500">Amount requested for this transfer.</div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Withdrawal amount</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">{fmtMoney(withdrawalAmount)}</div>
          </div>
          <div className="mt-6 text-sm text-slate-500">Admin will verify your details and process payout manually.</div>
        </section>

        <section className="driver-card p-6">
          <div className="text-xl font-bold text-slate-950">Bank Account Details</div>
          <div className="mt-1 text-sm text-slate-500">These details will be sent with your cashout request.</div>

          {loading ? (
            <div className="mt-6 text-sm text-slate-500">Loading account details...</div>
          ) : (
            <div className="mt-6 space-y-4">
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Account holder name"
                value={form.accountHolderName}
                onChange={(e) => setForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Account number"
                value={form.accountNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Bank name"
                value={form.bankName}
                onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                value={form.accountType}
                onChange={(e) => setForm((prev) => ({ ...prev, accountType: e.target.value }))}
              >
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
              </select>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Routing number (optional)"
                value={form.routingNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, routingNumber: e.target.value }))}
              />
              <textarea
                className="h-24 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Note for admin (optional)"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={!isBankFormValid || saving}
                  onClick={saveAccountDetails}
                >
                  {saving ? "Saving..." : "Save Details"}
                </button>
                <button
                  type="button"
                  className="driver-btn-primary justify-center px-4 py-2"
                  disabled={!isBankFormValid || submitting}
                  onClick={submitWithdrawal}
                >
                  {submitting ? "Submitting..." : "Submit Withdrawal"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DriverLayout>
  );
}
