import { useEffect, useMemo, useState } from "react";
import DriverLayout from "../../components/driver/DriverLayout";
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

  function startEdit(vehicle) {
    setEditId(vehicle._id);
    setForm({ type: vehicle.type, plateNumber: vehicle.plateNumber, seatCapacity: vehicle.seatCapacity });
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

  const totalSeats = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.seatCapacity || 0), 0);

  return (
    <DriverLayout
      title="Vehicle Management"
      subtitle="A cleaner fleet screen that keeps your original API calls and validation flow untouched."
      actions={
        <button type="submit" form="vehicle-form" disabled={busy} className="driver-btn-primary">
          {busy ? "Saving..." : editId ? "Update vehicle" : "Add vehicle"}
        </button>
      }
    >
      {err ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fleet size</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{vehicles.length}</div>
          <div className="mt-2 text-sm text-slate-500">Vehicles currently registered.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total seat capacity</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{totalSeats}</div>
          <div className="mt-2 text-sm text-slate-500">Combined across all vehicles.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Policy note</div>
          <div className="mt-3 text-lg font-bold text-slate-950">Backend enforced</div>
          <div className="mt-2 text-sm text-slate-500">Seat rules stay on the server exactly as before.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
        <section className="driver-card p-6">
          <div className="text-xl font-bold text-slate-950">{editId ? "Edit vehicle" : "Add a vehicle"}</div>
          <div className="mt-1 text-sm text-slate-500">Use the same existing endpoints with a better UI shell.</div>

          <form id="vehicle-form" className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Vehicle type</label>
              <select
                className="driver-select"
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setForm((s) => ({
                    ...s,
                    type,
                    seatCapacity: type === "bike" ? 1 : type === "car" ? 4 : type === "van" ? 8 : 10
                  }));
                }}
              >
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="mini_van">Mini Van</option>
              </select>
              <div className="mt-2 text-xs text-slate-500">{seatHint(form.type)}</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Plate number</label>
              <input
                className="driver-input"
                value={form.plateNumber}
                onChange={(e) => setForm((s) => ({ ...s, plateNumber: e.target.value }))}
                placeholder="ABC-1234"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Seat capacity</label>
              <input
                type="number"
                className="driver-input"
                value={form.seatCapacity}
                onChange={(e) => setForm((s) => ({ ...s, seatCapacity: e.target.value }))}
                min={1}
                required
              />
            </div>

            {editId ? (
              <button
                type="button"
                className="driver-btn-secondary w-full"
                onClick={() => {
                  setEditId(null);
                  setForm({ type: "car", plateNumber: "", seatCapacity: 4 });
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </form>
        </section>

        <section className="driver-card p-6">
          <div className="text-xl font-bold text-slate-950">Your vehicles</div>
          <div className="mt-1 text-sm text-slate-500">A more polished fleet list with the same behavior underneath.</div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {sorted.map((vehicle) => (
              <div key={vehicle._id} className="rounded-[24px] border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {TYPE_LABELS[vehicle.type] || vehicle.type}
                    </div>
                    <div className="mt-3 text-lg font-bold text-slate-950">{vehicle.plateNumber}</div>
                    <div className="mt-1 text-sm text-slate-500">Seat capacity {vehicle.seatCapacity}</div>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    🚘
                  </div>
                </div>

                <div className="driver-divider my-4" />

                <div className="flex gap-2">
                  <button type="button" className="driver-btn-secondary flex-1" onClick={() => startEdit(vehicle)}>
                    Edit
                  </button>
                  <button type="button" className="driver-btn-primary flex-1" onClick={() => onDelete(vehicle._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {sorted.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No vehicles yet. Add one to start creating rides.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DriverLayout>
  );
}