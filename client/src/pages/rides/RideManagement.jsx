import { useEffect, useMemo, useState } from "react";
import DriverLayout from "../../components/driver/DriverLayout";
import StatusBadge from "../../components/driver/StatusBadge";
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

  function startEdit(ride) {
    setEditId(ride._id);
    setForm({
      vehicleId: ride.vehicle?._id || ride.vehicle,
      originLabel: ride.origin?.label || "",
      destinationLabel: ride.destination?.label || "",
      departureTime: new Date(ride.departureTime).toISOString().slice(0, 16),
      pricePerSeat: ride.pricePerSeat,
      totalSeats: ride.totalSeats
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

  const selectedVehicle = vehicles.find((vehicle) => vehicle._id === form.vehicleId);
  const seatMax = selectedVehicle?.seatCapacity || 1;

  const activeCount = rides.filter((ride) => ["pending", "ongoing"].includes(ride.status)).length;
  const bookedSeats = rides.reduce((sum, ride) => sum + Number(ride.bookedSeats || 0), 0);

  return (
    <DriverLayout
      title="Ride Management"
      subtitle="Create, edit, and control ride status using the same backend logic you already have."
      actions={
        <button type="submit" form="ride-form" disabled={busy} className="driver-btn-primary">
          {busy ? "Saving..." : editId ? "Update ride" : "Create ride"}
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
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total rides</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{rides.length}</div>
          <div className="mt-2 text-sm text-slate-500">All rides created in your account.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Active rides</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{activeCount}</div>
          <div className="mt-2 text-sm text-slate-500">Pending and ongoing rides.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Booked seats</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{bookedSeats}</div>
          <div className="mt-2 text-sm text-slate-500">Based on your current ride list.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
        <section className="driver-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-slate-950">{editId ? "Edit ride" : "Create a ride"}</div>
              <div className="text-sm text-slate-500">Your existing validation rules remain unchanged.</div>
            </div>
          </div>

          <form id="ride-form" className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Vehicle</label>
              <select
                className="driver-select"
                value={form.vehicleId}
                onChange={(e) => setForm((s) => ({ ...s, vehicleId: e.target.value }))}
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.plateNumber} • {vehicle.type} • seats {vehicle.seatCapacity}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-500">Max seats for this vehicle: {seatMax}</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Origin</label>
              <input
                className="driver-input"
                value={form.originLabel}
                onChange={(e) => setForm((s) => ({ ...s, originLabel: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Destination</label>
              <input
                className="driver-input"
                value={form.destinationLabel}
                onChange={(e) => setForm((s) => ({ ...s, destinationLabel: e.target.value }))}
                placeholder="Where are you going?"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Departure time</label>
              <input
                type="datetime-local"
                className="driver-input"
                value={form.departureTime}
                onChange={(e) => setForm((s) => ({ ...s, departureTime: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Price per seat (LKR)</label>
                <input
                  type="number"
                  min={0}
                  className="driver-input"
                  value={form.pricePerSeat}
                  onChange={(e) => setForm((s) => ({ ...s, pricePerSeat: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Seats offered</label>
                <input
                  type="number"
                  min={1}
                  max={seatMax}
                  className="driver-input"
                  value={form.totalSeats}
                  onChange={(e) => setForm((s) => ({ ...s, totalSeats: e.target.value }))}
                  required
                />
              </div>
            </div>

            {editId ? (
              <button type="button" className="driver-btn-secondary w-full" onClick={() => setEditId(null)}>
                Cancel edit
              </button>
            ) : null}
          </form>
        </section>

        <section className="driver-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-slate-950">Your rides</div>
              <div className="text-sm text-slate-500">Status transitions are still enforced by the backend.</div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {sorted.map((ride) => (
              <div key={ride._id} className="rounded-[24px] border border-slate-200 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-950">
                      {ride.origin?.label} → {ride.destination?.label}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Departs {fmtDateTime(ride.departureTime)} • Vehicle {ride.vehicle?.plateNumber || "-"}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Seats {ride.availableSeats}/{ride.totalSeats}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Price {fmtMoney(ride.pricePerSeat)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Booked {ride.bookedSeats}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={ride.status} />
                </div>

                <div className="driver-divider my-4" />

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="driver-btn-secondary" onClick={() => startEdit(ride)}>
                      Edit
                    </button>
                    <button type="button" className="driver-btn-secondary" onClick={() => onDelete(ride._id)}>
                      Delete
                    </button>
                    <button type="button" className="driver-btn-accent" onClick={() => bookSeat(ride._id)}>
                      +1 booked
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatus(ride._id, status)}
                        className={[
                          "rounded-2xl px-3 py-2 text-xs font-semibold transition",
                          ride.status === status
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        ].join(" ")}
                        title="Transition rules are enforced by backend"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {sorted.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No rides yet. Create your first ride.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DriverLayout>
  );
}