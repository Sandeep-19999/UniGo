import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

const TYPE_LABELS = { bike: "Bike", car: "Car", van: "Van", mini_van: "Mini Van" };

function seatHint(type) {
  if (type === "bike") return "Bike must be exactly 1 seat.";
  if (type === "car") return "Car seats: 1–4.";
  if (type === "van") return "Van seats: 8–60.";
  return "Mini Van seats: 6–20.";
}

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ type: "car", plateNumber: "", seatCapacity: 4 });
  const [editId, setEditId] = useState(null);

  async function load() {
    setErr("");
    const { data } = await api.get("/driver/vehicles");
    setVehicles(data.vehicles || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e?.response?.data?.message || "Failed to load vehicles."));
  }, []);

  const sorted = useMemo(
    () => vehicles.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [vehicles]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const payload = {
        type: form.type,
        plateNumber: form.plateNumber.trim(),
        seatCapacity: Number(form.seatCapacity)
      };
      if (!payload.plateNumber) throw new Error("Plate number is required.");

      if (editId) await api.patch(`/driver/vehicles/${editId}`, payload);
      else await api.post("/driver/vehicles", payload);

      setForm({ type: "car", plateNumber: "", seatCapacity: 4 });
      setEditId(null);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(v) {
    setEditId(v._id);
    setForm({ type: v.type, plateNumber: v.plateNumber, seatCapacity: v.seatCapacity });
  }

  async function onDelete(id) {
    if (!confirm("Delete this vehicle? (Blocked if active ride exists)")) return;
    setErr("");
    try {
      await api.delete(`/driver/vehicles/${id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Vehicle Management</h1>
        <p className="text-sm text-slate-600">Driver-only. Seat policies are enforced on the backend.</p>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">{editId ? "Edit vehicle" : "Add vehicle"}</div>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-semibold">Vehicle type</span>
              <select
                className="mt-1 w-full rounded-xl border p-2"
                value={form.type}
                onChange={(e) => {
                  const t = e.target.value;
                  setForm((s) => ({
                    ...s,
                    type: t,
                    seatCapacity: t === "bike" ? 1 : t === "car" ? 4 : t === "van" ? 8 : 10
                  }));
                }}
              >
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="mini_van">Mini Van</option>
              </select>
              <div className="mt-1 text-xs text-slate-500">{seatHint(form.type)}</div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Plate number</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                value={form.plateNumber}
                onChange={(e) => setForm((s) => ({ ...s, plateNumber: e.target.value }))}
                placeholder="ABC-1234"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Seat capacity</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border p-2"
                value={form.seatCapacity}
                onChange={(e) => setForm((s) => ({ ...s, seatCapacity: e.target.value }))}
                min={1}
                required
              />
            </label>

            <div className="flex gap-2">
              <button
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {busy ? "Saving..." : editId ? "Update" : "Add"}
              </button>

              {editId ? (
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-sm font-semibold"
                  onClick={() => {
                    setEditId(null);
                    setForm({ type: "car", plateNumber: "", seatCapacity: 4 });
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">Your vehicles</div>

          <div className="mt-4 space-y-3">
            {sorted.map((v) => (
              <div key={v._id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {TYPE_LABELS[v.type] || v.type} • {v.plateNumber}
                    </div>
                    <div className="text-xs text-slate-600">Seats: {v.seatCapacity}</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border px-3 py-1 text-sm font-semibold hover:bg-slate-50"
                      onClick={() => startEdit(v)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-xl bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-500"
                      onClick={() => onDelete(v._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {sorted.length === 0 ? (
              <div className="text-sm text-slate-500">No vehicles yet. Add one to start creating rides.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
