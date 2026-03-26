import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { getDriverNextRoute } from '../../utils/driverOnboarding';

export default function DriverProfileSetup() {
  const navigate = useNavigate();
  const { user, refreshDriverOnboarding } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', city: '' });

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
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put('/driver/onboarding/profile', form);
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
              <input name="firstName" value={form.firstName} onChange={handleChange} className="driver-input" placeholder="Viraj" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Last name</span>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="driver-input" placeholder="Harshana" required />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
            <input name="phone" value={form.phone} onChange={handleChange} className="driver-input" placeholder="0771234567" required />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
            <input name="city" value={form.city} onChange={handleChange} className="driver-input" placeholder="Kurunegala, North Western" required />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="driver-btn-primary min-w-[180px]">
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
