import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { useAuth } from '../../context/AuthContext';
import {
  canDriverAccessDashboard,
  getDriverNextRoute
} from '../../utils/driverOnboarding';

export default function DriverApproved() {
  const navigate = useNavigate();
  const { driverOnboarding, refreshDriverOnboarding } = useAuth();

  useEffect(() => {
    let active = true;

    (async () => {
      const latest = await refreshDriverOnboarding({ silent: true });
      if (!active) return;

      if (!canDriverAccessDashboard(latest)) {
        navigate(getDriverNextRoute(latest), { replace: true });
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate, refreshDriverOnboarding]);

  return (
    <OnboardingShell
      title="Your account is approved"
      description="All required driver documents have been approved. Your driver dashboard is now unlocked, and you can start receiving ride opportunities."
      footer={
        <div className="text-sm text-slate-500">
          You can now open the dashboard or go directly to directional hire.
        </div>
      }
    >
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-700">
          ✓
        </div>

        <div className="max-w-2xl text-2xl font-extrabold text-slate-950">
          Driver onboarding completed successfully
        </div>

        <div className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          You have passed the admin review stage. You can now access the driver dashboard,
          publish directional hire routes, and accept or reject matched passenger requests.
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/driver/dashboard', { replace: true })}
            className="driver-btn-primary min-w-[220px]"
          >
            Open driver dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate('/driver/directional-hire')}
            className="driver-btn-secondary min-w-[220px]"
          >
            Open directional hire
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}