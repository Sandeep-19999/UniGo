import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { getDriverNextRoute } from '../../utils/driverOnboarding';

// Validation patterns
const SRI_LANKAN_PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;
const VEHICLE_MAKE_REGEX = /^[a-zA-Z\s-]{2,50}$/;
const VEHICLE_MODEL_REGEX = /^[a-zA-Z0-9\s-]{2,50}$/;
const COLOR_REGEX = /^[a-zA-Z\s-]{2,30}$/;

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

// Validation functions
function validatePlateNumber(plate) {
  if (!plate.trim()) return 'License plate is required';
  if (!SRI_LANKAN_PLATE_REGEX.test(plate.trim())) {
    return 'License plate must be in format: ABC-1234';
  }
  return '';
}

function validateMake(make) {
  if (!make.trim()) return 'Make is required';
  if (!VEHICLE_MAKE_REGEX.test(make.trim())) {
    return 'Make must be 2-50 characters (letters, spaces, hyphens only)';
  }
  return '';
}

function validateModel(model) {
  if (!model.trim()) return 'Model is required';
  if (!VEHICLE_MODEL_REGEX.test(model.trim())) {
    return 'Model must be 2-50 characters (letters, numbers, spaces, hyphens only)';
  }
  return '';
}

function validateYear(year) {
  const currentYear = new Date().getFullYear();
  const numYear = Number(year);
  if (!year) return 'Year is required';
  if (isNaN(numYear)) return 'Year must be a valid number';
  if (numYear < 1990) return 'Year must be 1990 or later';
  if (numYear > currentYear + 1) return `Year must not exceed ${currentYear + 1}`;
  return '';
}

function validateSeatCapacity(capacity) {
  const numCapacity = Number(capacity);
  if (!capacity) return 'Seat capacity is required';
  if (isNaN(numCapacity)) return 'Seat capacity must be a valid number';
  if (numCapacity < 1) return 'Seat capacity must be at least 1';
  if (numCapacity > 60) return 'Seat capacity cannot exceed 60';
  return '';
}

function validateColor(color) {
  if (!color.trim()) return '';
  if (!COLOR_REGEX.test(color.trim())) {
    return 'Color must be 2-30 characters (letters, spaces, hyphens only)';
  }
  return '';
}

export default function DriverVehicleSetup() {
  const navigate = useNavigate();
  const { refreshDriverOnboarding } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [vehicleId, setVehicleId] = useState('');
  const [errors, setErrors] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    seatCapacity: '',
    color: ''
  });

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
    const newValue = type === 'checkbox' ? checked : value;
    
    setForm((prev) => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation
    if (name === 'plateNumber') {
      setErrors((prev) => ({ ...prev, plateNumber: validatePlateNumber(newValue) }));
    } else if (name === 'make') {
      setErrors((prev) => ({ ...prev, make: validateMake(newValue) }));
    } else if (name === 'model') {
      setErrors((prev) => ({ ...prev, model: validateModel(newValue) }));
    } else if (name === 'year') {
      setErrors((prev) => ({ ...prev, year: validateYear(newValue) }));
    } else if (name === 'seatCapacity') {
      setErrors((prev) => ({ ...prev, seatCapacity: validateSeatCapacity(newValue) }));
    } else if (name === 'color') {
      setErrors((prev) => ({ ...prev, color: validateColor(newValue) }));
    }
  }

  function handleBlur(event) {
    const { name } = event.target;
    const value = form[name];

    if (name === 'plateNumber') {
      setErrors((prev) => ({ ...prev, plateNumber: validatePlateNumber(value) }));
    } else if (name === 'make') {
      setErrors((prev) => ({ ...prev, make: validateMake(value) }));
    } else if (name === 'model') {
      setErrors((prev) => ({ ...prev, model: validateModel(value) }));
    } else if (name === 'year') {
      setErrors((prev) => ({ ...prev, year: validateYear(value) }));
    } else if (name === 'seatCapacity') {
      setErrors((prev) => ({ ...prev, seatCapacity: validateSeatCapacity(value) }));
    } else if (name === 'color') {
      setErrors((prev) => ({ ...prev, color: validateColor(value) }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    // Validate all fields
    const plateError = validatePlateNumber(form.plateNumber);
    const makeError = validateMake(form.make);
    const modelError = validateModel(form.model);
    const yearError = validateYear(form.year);
    const seatError = validateSeatCapacity(form.seatCapacity);
    const colorError = validateColor(form.color);

    const newErrors = {
      plateNumber: plateError,
      make: makeError,
      model: modelError,
      year: yearError,
      seatCapacity: seatError,
      color: colorError
    };

    setErrors(newErrors);

    // Check if any errors exist
    if (plateError || makeError || modelError || yearError || seatError || colorError) {
      return;
    }

    setSaving(true);

    try {
      await api.put('/driver/onboarding/vehicle', {
        vehicleId: vehicleId || undefined,
        type: form.type,
        make: form.make.trim(),
        model: form.model.trim(),
        plateNumber: form.plateNumber.trim(),
        year: Number(form.year),
        seatCapacity: Number(form.seatCapacity),
        color: form.color.trim(),
        isPrimary: form.isPrimary
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
              <input
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.plateNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="CAA-1234"
              />
              {errors.plateNumber && <div className="mt-1 text-xs text-red-600">{errors.plateNumber}</div>}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Make</span>
              <input
                name="make"
                value={form.make}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.make ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Toyota"
              />
              {errors.make && <div className="mt-1 text-xs text-red-600">{errors.make}</div>}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Model</span>
              <input
                name="model"
                value={form.model}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.model ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Prius"
              />
              {errors.model && <div className="mt-1 text-xs text-red-600">{errors.model}</div>}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Year</span>
              <input
                name="year"
                type="number"
                value={form.year}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.year ? 'border-red-500 focus:ring-red-500' : ''}`}
                min="1990"
                max="2099"
              />
              {errors.year && <div className="mt-1 text-xs text-red-600">{errors.year}</div>}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Seat capacity</span>
              <input
                name="seatCapacity"
                type="number"
                value={form.seatCapacity}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.seatCapacity ? 'border-red-500 focus:ring-red-500' : ''}`}
                min="1"
                max="60"
              />
              {errors.seatCapacity && <div className="mt-1 text-xs text-red-600">{errors.seatCapacity}</div>}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Color</span>
              <input
                name="color"
                value={form.color}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.color ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="White"
              />
              {errors.color && <div className="mt-1 text-xs text-red-600">{errors.color}</div>}
            </label>
          </div>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" name="isPrimary" checked={form.isPrimary} onChange={handleChange} className="h-4 w-4" />
            Keep this as my primary vehicle
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || errors.plateNumber || errors.make || errors.model || errors.year || errors.seatCapacity || errors.color}
              className="driver-btn-primary min-w-[180px]"
            >
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
