import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { getDriverNextRoute } from '../../utils/driverOnboarding';

const DEFAULT_FORM = {
  type: 'car',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plateNumber: '',
  seatCapacity: 4,
  color: '',
  isPrimary: true
};

export default function DriverVehicleSetup() {
  const navigate = useNavigate();
  const { refreshDriverOnboarding } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [vehicleId, setVehicleId] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get('/driver/onboarding/detail');
        const vehicle = data?.primaryVehicle;
        if (!active || !vehicle) return;
        setVehicleId(vehicle._id || '');
        setForm({
          type: vehicle.type || 'car',
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          plateNumber: vehicle.plateNumber || '',
          seatCapacity: vehicle.seatCapacity || 4,
          color: vehicle.color || '',
          isPrimary: vehicle.isPrimary !== false
        });
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Failed to load vehicle information.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/driver/onboarding/vehicle', {
        vehicleId: vehicleId || undefined,
        ...form,
        seatCapacity: Number(form.seatCapacity),
        year: Number(form.year)
      });

      const onboarding = await refreshDriverOnboarding();
      navigate(getDriverNextRoute(onboarding));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save vehicle information.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      title="Enter your vehicle information"
      description="This vehicle becomes the primary vehicle for driver onboarding, ride acceptance, and directional hire matching."
      footer={<div className="text-sm text-slate-500">Use the same vehicle details for insurance, revenue license, and registration documents.</div>}
    >
      {loading ? (
        <div className="text-sm text-slate-500">Loading vehicle form...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Vehicle type</span>
              <select name="type" value={form.type} onChange={handleChange} className="driver-select">
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="mini_van">Mini Van</option>
                <option value="van">Van</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">License plate</span>
              <input name="plateNumber" value={form.plateNumber} onChange={handleChange} className="driver-input" placeholder="CAA-1234" required />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Make</span>
              <input name="make" value={form.make} onChange={handleChange} className="driver-input" placeholder="Toyota" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Model</span>
              <input name="model" value={form.model} onChange={handleChange} className="driver-input" placeholder="Prius" required />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Year</span>
              <input name="year" type="number" value={form.year} onChange={handleChange} className="driver-input" min="1990" max="2099" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Seat capacity</span>
              <input name="seatCapacity" type="number" value={form.seatCapacity} onChange={handleChange} className="driver-input" min="1" max="60" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Color</span>
              <input name="color" value={form.color} onChange={handleChange} className="driver-input" placeholder="White" />
            </label>
          </div>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" name="isPrimary" checked={form.isPrimary} onChange={handleChange} className="h-4 w-4" />
            Keep this as my primary vehicle
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="driver-btn-primary min-w-[180px]">
              {saving ? 'Saving...' : 'Save vehicle'}
            </button>
            <button type="button" onClick={() => navigate('/driver/onboarding')} className="driver-btn-secondary">
              Back to status
            </button>
          </div>
        </form>
      )}
    </OnboardingShell>
  );
}
