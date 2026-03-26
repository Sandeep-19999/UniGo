// import { useEffect, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import OnboardingShell from '../../components/driver/OnboardingShell';
// import { useAuth } from '../../context/AuthContext';
// import {
//   canDriverAccessDashboard,
//   getDriverNextRoute,
//   isDriverAwaitingReview
// } from '../../utils/driverOnboarding';

// function InfoCard({ label, value, hint }) {
//   return (
//     <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
//       <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
//         {label}
//       </div>
//       <div className="mt-3 text-3xl font-extrabold text-slate-950">{value}</div>
//       <div className="mt-2 text-sm text-slate-500">{hint}</div>
//     </div>
//   );
// }

// export default function DriverReviewPending() {
//   const navigate = useNavigate();
//   const { driverOnboarding, refreshDriverOnboarding } = useAuth();
//   const [checking, setChecking] = useState(false);
//   const [message, setMessage] = useState('');

//   const onboarding = driverOnboarding;

//   const submittedCount = useMemo(
//     () => (Array.isArray(onboarding?.submitted) ? onboarding.submitted.length : 0),
//     [onboarding]
//   );

//   const approvedCount = useMemo(
//     () => (Array.isArray(onboarding?.completed) ? onboarding.completed.length : 0),
//     [onboarding]
//   );

//   useEffect(() => {
//     let active = true;

//     async function checkStatus(silent = true) {
//       try {
//         const latest = await refreshDriverOnboarding({ silent });

//         if (!active || !latest) return;

//         if (canDriverAccessDashboard(latest)) {
//           navigate('/driver/dashboard', { replace: true });
//           return;
//         }

//         if (!isDriverAwaitingReview(latest)) {
//           navigate(getDriverNextRoute(latest), { replace: true });
//         }
//       } catch {
//         // ignore polling failures
//       }
//     }

//     checkStatus(true);

//     const intervalId = setInterval(() => {
//       checkStatus(true);
//     }, 8000);

//     return () => {
//       active = false;
//       clearInterval(intervalId);
//     };
//   }, [navigate, refreshDriverOnboarding]);

//   async function handleCheckNow() {
//     setChecking(true);
//     setMessage('');

//     try {
//       const latest = await refreshDriverOnboarding();

//       if (canDriverAccessDashboard(latest)) {
//         navigate('/driver/dashboard', { replace: true });
//         return;
//       }

//       if (!isDriverAwaitingReview(latest)) {
//         navigate(getDriverNextRoute(latest), { replace: true });
//         return;
//       }

//       setMessage('Still under admin review. We will unlock your dashboard once approval is complete.');
//     } catch {
//       setMessage('Failed to refresh review status. Please try again.');
//     } finally {
//       setChecking(false);
//     }
//   }

//   return (
//     <OnboardingShell
//       title="Your document review is on the way"
//       description="All required driver details and documents have been submitted. Our admin team is reviewing them now. As soon as approval is complete, your driver dashboard will unlock."
//       footer={
//         <div className="text-sm text-slate-500">
//           This page checks your onboarding approval automatically every few seconds.
//         </div>
//       }
//     >
//       <div className="space-y-6">
//         <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
//           Your onboarding is currently under review. You cannot access the driver dashboard until admin approval is completed.
//         </div>

//         <div className="grid gap-4 md:grid-cols-3">
//           <InfoCard
//             label="Submitted"
//             value={submittedCount}
//             hint="Documents waiting for admin verification."
//           />
//           <InfoCard
//             label="Approved"
//             value={approvedCount}
//             hint="Items that are already verified."
//           />
//           <InfoCard
//             label="Dashboard Access"
//             value="Blocked"
//             hint="This changes automatically after full approval."
//           />
//         </div>

//         <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
//           <h2 className="text-xl font-extrabold text-slate-950">What happens next?</h2>
//           <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
//             <p>1. Admin reviews your submitted profile photo and vehicle documents.</p>
//             <p>2. Once all required items are approved, dashboard access becomes available automatically.</p>
//             <p>3. After approval, you can open the driver dashboard and start receiving ride opportunities.</p>
//           </div>

//           {message ? (
//             <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
//               {message}
//             </div>
//           ) : null}

//           <div className="mt-6 flex flex-wrap gap-3">
//             <button
//               type="button"
//               onClick={handleCheckNow}
//               disabled={checking}
//               className="driver-btn-primary min-w-[200px]"
//             >
//               {checking ? 'Checking...' : 'Check approval status'}
//             </button>

//             <button
//               type="button"
//               onClick={() => navigate('/driver/onboarding')}
//               className="driver-btn-secondary"
//             >
//               Back to account status
//             </button>
//           </div>
//         </div>
//       </div>
//     </OnboardingShell>
//   );
// }



import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { useAuth } from '../../context/AuthContext';
import {
  canDriverAccessDashboard,
  getDriverNextRoute,
  isDriverAwaitingReview
} from '../../utils/driverOnboarding';

function InfoCard({ label, value, hint }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-3xl font-extrabold text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{hint}</div>
    </div>
  );
}

export default function DriverReviewPending() {
  const navigate = useNavigate();
  const { driverOnboarding, refreshDriverOnboarding } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const onboarding = driverOnboarding;

  const submittedCount = useMemo(
    () => (Array.isArray(onboarding?.submitted) ? onboarding.submitted.length : 0),
    [onboarding]
  );

  const approvedCount = useMemo(
    () => (Array.isArray(onboarding?.completed) ? onboarding.completed.length : 0),
    [onboarding]
  );

  useEffect(() => {
    let active = true;

    async function checkStatus(silent = true) {
      try {
        const latest = await refreshDriverOnboarding({ silent });

        if (!active || !latest) return;

        if (canDriverAccessDashboard(latest)) {
          navigate('/driver/onboarding/approved', { replace: true });
          return;
        }

        if (!isDriverAwaitingReview(latest)) {
          navigate(getDriverNextRoute(latest), { replace: true });
        }
      } catch {
        // ignore polling failures
      }
    }

    checkStatus(true);

    const intervalId = setInterval(() => {
      checkStatus(true);
    }, 8000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [navigate, refreshDriverOnboarding]);

  async function handleCheckNow() {
    setChecking(true);
    setMessage('');

    try {
      const latest = await refreshDriverOnboarding();

      if (canDriverAccessDashboard(latest)) {
        navigate('/driver/onboarding/approved', { replace: true });
        return;
      }

      if (!isDriverAwaitingReview(latest)) {
        navigate(getDriverNextRoute(latest), { replace: true });
        return;
      }

      setMessage(
        'Still under admin review. We will unlock your dashboard once approval is complete.'
      );
    } catch {
      setMessage('Failed to refresh review status. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <OnboardingShell
      title="Your document review is on the way"
      description="All required driver details and documents have been submitted. Our admin team is reviewing them now. As soon as approval is complete, you will move to the approval page automatically."
      footer={
        <div className="text-sm text-slate-500">
          This page checks your onboarding approval automatically every few seconds.
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Your onboarding is currently under review. You cannot access the driver dashboard until admin approval is completed.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            label="Submitted"
            value={submittedCount}
            hint="Documents waiting for admin verification."
          />
          <InfoCard
            label="Approved"
            value={approvedCount}
            hint="Items that are already verified."
          />
          <InfoCard
            label="Dashboard Access"
            value="Blocked"
            hint="This changes automatically after full approval."
          />
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-950">What happens next?</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>1. Admin reviews your submitted profile photo and vehicle documents.</p>
            <p>2. Once all required items are approved, the system moves you to the approval page automatically.</p>
            <p>3. From there, you can open the driver dashboard and start receiving ride opportunities.</p>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCheckNow}
              disabled={checking}
              className="driver-btn-primary min-w-[200px]"
            >
              {checking ? 'Checking...' : 'Check approval status'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/driver/onboarding')}
              className="driver-btn-secondary"
            >
              Back to account status
            </button>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}