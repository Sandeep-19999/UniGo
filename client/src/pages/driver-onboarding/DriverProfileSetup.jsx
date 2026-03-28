import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { getDriverNextRoute } from '../../utils/driverOnboarding';

// Validation Functions
const SRI_LANKAN_PHONE_REGEX = /^0\d{9}$/;

function validateFirstName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'First name is required.';
  if (trimmed.length < 2) return 'First name must be at least 2 characters.';
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return 'First name can only contain letters, spaces, hyphens, and apostrophes.';
  return '';
}

function validateLastName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Last name is required.';
  if (trimmed.length < 2) return 'Last name must be at least 2 characters.';
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
  return '';
}

function validatePhone(phone) {
  const trimmed = phone.trim();
  if (!trimmed) return 'Phone number is required.';
  if (!SRI_LANKAN_PHONE_REGEX.test(trimmed)) {
    return 'Please enter a valid Sri Lankan phone number (e.g., 0771234567).';
  }
  return '';
}

function validateCity(city) {
  const trimmed = city.trim();
  if (!trimmed) return 'City is required.';
  if (trimmed.length < 2) return 'City must be at least 2 characters.';
  if (!/^[a-zA-Z\s,'-]+$/.test(trimmed)) return 'City can only contain letters, spaces, commas, hyphens, and apostrophes.';
  return '';
}

export default function DriverProfileSetup() {
  const navigate = useNavigate();
  const { user, refreshDriverOnboarding } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', city: '' });
  const [errors, setErrors] = useState({ firstName: '', lastName: '', phone: '', city: '' });

  const splitName = useMemo(() => {
    const parts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ')
    };
  }, [user?.name]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get('/driver/onboarding/detail');
        const profile = data?.profile;
        if (!active) return;
        setForm({
          firstName: profile?.firstName || splitName.firstName,
          lastName: profile?.lastName || splitName.lastName,
          phone: profile?.phone || '',
          city: profile?.city || ''
        });
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || 'Failed to load your profile details.');
          setForm({
            firstName: splitName.firstName,
            lastName: splitName.lastName,
            phone: '',
            city: ''
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [splitName.firstName, splitName.lastName]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    if (value.trim()) {
      let fieldError = '';
      if (name === 'firstName') fieldError = validateFirstName(value);
      else if (name === 'lastName') fieldError = validateLastName(value);
      else if (name === 'phone') fieldError = validatePhone(value);
      else if (name === 'city') fieldError = validateCity(value);

      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    if (value.trim()) {
      let fieldError = '';
      if (name === 'firstName') fieldError = validateFirstName(value);
      else if (name === 'lastName') fieldError = validateLastName(value);
      else if (name === 'phone') fieldError = validatePhone(value);
      else if (name === 'city') fieldError = validateCity(value);

      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    // Validate all fields before submit
    const firstNameErr = validateFirstName(form.firstName);
    const lastNameErr = validateLastName(form.lastName);
    const phoneErr = validatePhone(form.phone);
    const cityErr = validateCity(form.city);

    setErrors({
      firstName: firstNameErr,
      lastName: lastNameErr,
      phone: phoneErr,
      city: cityErr
    });

    if (firstNameErr || lastNameErr || phoneErr || cityErr) {
      return;
    }

    setSaving(true);
    try {
      await api.put('/driver/onboarding/profile', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim()
      });
      const onboarding = await refreshDriverOnboarding();
      navigate(getDriverNextRoute(onboarding));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      title="Let’s start by creating your account"
      description="This keeps your driver profile aligned with onboarding, document review, and operational contact details."
      footer={<div className="text-sm text-slate-500">These details are used in driver verification and support workflows.</div>}
    >
      {loading ? (
        <div className="text-sm text-slate-500">Loading profile form...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">First name</span>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Viraj"
              />
              {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName}</p> : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Last name</span>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`driver-input ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Harshana"
              />
              {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName}</p> : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`driver-input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="0771234567"
            />
            {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`driver-input ${errors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Kurunegala, North Western"
            />
            {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city}</p> : null}
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || errors.firstName || errors.lastName || errors.phone || errors.city}
              className="driver-btn-primary min-w-[180px]"
            >
              {saving ? 'Saving...' : 'Continue'}
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
