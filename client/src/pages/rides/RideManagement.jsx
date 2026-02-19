import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import { fmtDateTime, fmtMoney } from "../../utils/format";

const STATUS = ["pending", "ongoing", "completed", "cancelled"];

export default function RideManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [rides, setRides] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    vehicleId: "",
    originLabel: "SLIIT Malabe",
    destinationLabel: "",
    departureTime: "",
    pricePerSeat: 250,
    totalSeats: 1
  });

  async function load() {
    const [v, r] = await Promise.all([api.get("/driver/vehicles"), api.get("/driver/rides")]);
    const vv = v.data.vehicles || [];
    setVehicles(vv);
    setRides(r.data.rides || []);

    if (!form.vehicleId && vv[0]?._id) {
      setForm((s) => ({ ...s, vehicleId: vv[0]._id, totalSeats: Math.min(1, vv[0].seatCapacity) || 1 }));
    }
  }

  useEffect(() => {
    load().catch((e) => setErr(e?.response?.data?.message || "Failed to load rides."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () => rides.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [rides]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        origin: { label: form.originLabel },
        destination: { label: form.destinationLabel },
        departureTime: form.departureTime,
        pricePerSeat: Number(form.pricePerSeat),
        totalSeats: Number(form.totalSeats)
      };

      if (!payload.vehicleId) throw new Error("Select a vehicle first.");
      if (!payload.destination.label) throw new Error("Destination is required.");

      if (editId) await api.patch(`/driver/rides/${editId}`, payload);
      else await api.post("/driver/rides", payload);

      setForm((s) => ({ ...s, destinationLabel: "" }));
      setEditId(null);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(r) {
    setEditId(r._id);
    setForm({
      vehicleId: r.vehicle?._id || r.vehicle,
      originLabel: r.origin?.label || "",
      destinationLabel: r.destination?.label || "",
      departureTime: new Date(r.departureTime).toISOString().slice(0, 16),
      pricePerSeat: r.pricePerSeat,
      totalSeats: r.totalSeats
    });
  }

  async function onDelete(id) {
    if (!confirm("Delete this ride? (Blocked if bookedSeats > 0)")) return;
    setErr("");
    try {
      await api.delete(`/driver/rides/${id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed.");
    }
  }

  async function setStatus(id, status) {
    setErr("");
    try {
      await api.patch(`/driver/rides/${id}/status`, { status });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Status update failed.");
    }
  }

  async function bookSeat(id) {
    setErr("");
    try {
      await api.post(`/driver/rides/${id}/book-seat`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Booking failed.");
    }
  }

  const selectedVehicle = vehicles.find((v) => v._id === form.vehicleId);
  const seatMax = selectedVehicle?.seatCapacity || 1;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Ride Management</h1>
        <p className="text-sm text-slate-600">Driver-only. Create, edit, delete and manage ride status.</p>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">{editId ? "Edit ride" : "Create ride"}</div>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-semibold">Vehicle</span>
              <select
                className="mt-1 w-full rounded-xl border p-2"
                value={form.vehicleId}
                onChange={(e) => setForm((s) => ({ ...s, vehicleId: e.target.value }))}
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} • {v.type} • seats {v.seatCapacity}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-500">Max seats for this vehicle: {seatMax}</div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Origin</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                value={form.originLabel}
                onChange={(e) => setForm((s) => ({ ...s, originLabel: e.target.value }))}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Destination</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                value={form.destinationLabel}
                onChange={(e) => setForm((s) => ({ ...s, destinationLabel: e.target.value }))}
                placeholder="Where are you going?"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Departure time</span>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border p-2"
                value={form.departureTime}
                onChange={(e) => setForm((s) => ({ ...s, departureTime: e.target.value }))}
                required
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Price per seat (LKR)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border p-2"
                  value={form.pricePerSeat}
                  onChange={(e) => setForm((s) => ({ ...s, pricePerSeat: e.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Seats offered</span>
                <input
                  type="number"
                  min={1}
                  max={seatMax}
                  className="mt-1 w-full rounded-xl border p-2"
                  value={form.totalSeats}
                  onChange={(e) => setForm((s) => ({ ...s, totalSeats: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {busy ? "Saving..." : editId ? "Update" : "Create"}
              </button>

              {editId ? (
                <button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">Your rides</div>

          <div className="mt-4 space-y-3">
            {sorted.map((r) => (
              <div key={r._id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.origin?.label} → {r.destination?.label}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Departs: {fmtDateTime(r.departureTime)} • Vehicle: {r.vehicle?.plateNumber || "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Seats: {r.availableSeats}/{r.totalSeats} • Price: {fmtMoney(r.pricePerSeat)} • Booked: {r.bookedSeats}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                      {String(r.status).toUpperCase()}
                    </span>

                    <button className="rounded-xl border px-3 py-1 text-sm font-semibold hover:bg-slate-50" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button className="rounded-xl bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-500" onClick={() => onDelete(r._id)}>
                      Delete
                    </button>

                    <div className="flex gap-1">
                      {STATUS.map((s) => (
                        <button
                          key={s}
                          className="rounded-xl border px-2 py-1 text-xs font-semibold hover:bg-slate-50"
                          onClick={() => setStatus(r._id, s)}
                          title="Transition rules enforced by backend"
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <button
                      className="rounded-xl bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800"
                      onClick={() => bookSeat(r._id)}
                      title="Simulation endpoint to test seat reduction"
                    >
                      +1 booked
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {sorted.length === 0 ? <div className="text-sm text-slate-500">No rides yet. Create your first ride.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
