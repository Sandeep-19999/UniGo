// import { useEffect, useMemo, useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { api } from '../../api/axios';
// import { useAuth } from '../../context/AuthContext';
// import {
//   canDriverAccessDashboard,
//   formatOnboardingBadge,
//   getDriverNextRoute,
//   getDriverStepRoute,
//   isDriverProfileComplete
// } from '../../utils/driverOnboarding';

// function StepRow({ step }) {
//   const route = getDriverStepRoute(step);
//   const badge = formatOnboardingBadge(step);
//   const iconClass =
//     step.state === 'completed'
//       ? 'bg-emerald-100 text-emerald-700'
//       : step.state === 'submitted'
//         ? 'bg-amber-100 text-amber-700'
//         : 'bg-slate-100 text-slate-600';

//   return (
//     <Link
//       to={route}
//       className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
//     >
//       <div className="flex min-w-0 items-center gap-4">
//         <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${iconClass}`}>
//           {step.state === 'completed' ? '✓' : '▣'}
//         </div>
//         <div className="min-w-0">
//           <div className="truncate text-base font-bold text-slate-950">{step.title}</div>
//           <div className="mt-1 text-sm text-slate-500">{badge}</div>
//         </div>
//       </div>
//       <div className="text-2xl text-slate-300">›</div>
//     </Link>
//   );
// }

// function SummaryCard({ label, value, hint }) {
//   return (
//     <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
//       <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
//       <div className="mt-3 text-3xl font-extrabold text-slate-950">{value}</div>
//       <div className="mt-2 text-sm text-slate-500">{hint}</div>
//     </div>
//   );
// }

// export default function DriverOnboardingHome() {
//   const navigate = useNavigate();
//   const { user, refreshDriverOnboarding, driverOnboarding } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [localOnboarding, setLocalOnboarding] = useState(driverOnboarding);

//   useEffect(() => {
//     let active = true;

//     (async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const onboarding = await refreshDriverOnboarding();
//         if (active) setLocalOnboarding(onboarding);
//       } catch (err) {
//         if (active) setError(err?.response?.data?.message || 'Failed to load account status.');
//       } finally {
//         if (active) setLoading(false);
//       }
//     })();

//     return () => {
//       active = false;
//     };
//   }, [refreshDriverOnboarding]);

//   const onboarding = localOnboarding || driverOnboarding;
//   const profileComplete = isDriverProfileComplete(onboarding?.profile);
//   const readyForDashboard = canDriverAccessDashboard(onboarding);

//   const requiredSteps = useMemo(() => {
//     const steps = onboarding?.steps || [];
//     const base = profileComplete
//       ? []
//       : [
//           {
//             key: 'profile_account',
//             title: 'Account Details',
//             state: 'required',
//             subtitle: 'Recommended next step'
//           }
//         ];

//     return [...base, ...steps.filter((step) => step.state === 'required')];
//   }, [onboarding, profileComplete]);

//   const submittedSteps = useMemo(() => {
//     const steps = onboarding?.steps || [];
//     return steps.filter((step) => step.state === 'submitted');
//   }, [onboarding]);

//   const completedSteps = useMemo(() => {
//     const steps = onboarding?.steps || [];
//     const base = profileComplete
//       ? [
//           {
//             key: 'profile_account',
//             title: 'Account Details',
//             state: 'completed',
//             subtitle: 'Saved'
//           }
//         ]
//       : [];

//     return [...base, ...steps.filter((step) => step.state === 'completed')];
//   }, [onboarding, profileComplete]);

//   async function handleRefreshMatches() {
//     try {
//       await api.get('/driver/requests/matches');
//       await refreshDriverOnboarding();
//     } catch {
//       // this button is just a lightweight connectivity check
//     }
//   }

//   if (loading) {
//     return <div className="mx-auto max-w-5xl p-6">Loading account status...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-5xl space-y-6">
//         <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
//           <div className="px-6 py-8 sm:px-8">
//             <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//               <div>
//                 <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
//                   Driver account status
//                 </div>
//                 <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
//                   Welcome back, {onboarding?.profile?.firstName || user?.name?.split(' ')[0] || 'Driver'}
//                 </h1>
//                 <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
//                   Here is what you need to complete before the driver dashboard becomes fully available.
//                 </p>
//               </div>

//               <div className="flex flex-wrap gap-3">
//                 <button type="button" onClick={() => navigate(getDriverNextRoute(onboarding))} className="driver-btn-primary">
//                   {readyForDashboard ? 'Open dashboard' : 'Continue setup'}
//                 </button>
//                 <button type="button" onClick={handleRefreshMatches} className="driver-btn-secondary">
//                   Refresh status
//                 </button>
//               </div>
//             </div>

//             {error ? (
//               <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
//             ) : null}

//             {readyForDashboard ? (
//               <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
//                 All required onboarding steps are approved. Your driver dashboard is unlocked.
//               </div>
//             ) : (
//               <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
//                 Your documents are not complete. Please complete registration before accessing the dashboard.
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="grid gap-4 md:grid-cols-3">
//           <SummaryCard label="Progress" value={`${Math.round((completedSteps.length / 7) * 100)}%`} hint="Across profile, vehicle, and document verification." />
//           <SummaryCard label="Remaining" value={requiredSteps.length} hint="These items still require action from the driver." />
//           <SummaryCard label="In review" value={submittedSteps.length} hint="Submitted items waiting for admin verification." />
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[1.25fr_0.8fr]">
//           <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
//             <div className="flex items-center justify-between gap-3">
//               <div>
//                 <h2 className="text-2xl font-extrabold text-slate-950">Required steps</h2>
//                 <p className="mt-1 text-sm text-slate-500">Complete these first to move toward driver approval.</p>
//               </div>
//             </div>

//             <div className="mt-6 space-y-3">
//               {requiredSteps.length ? requiredSteps.map((step) => <StepRow key={step.key} step={step} />) : (
//                 <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
//                   No required steps remain.
//                 </div>
//               )}
//             </div>
//           </section>

//           <div className="space-y-6">
//             <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
//               <h2 className="text-xl font-extrabold text-slate-950">Submitted</h2>
//               <p className="mt-1 text-sm text-slate-500">These items are already with the admin review flow.</p>
//               <div className="mt-5 space-y-3">
//                 {submittedSteps.length ? submittedSteps.map((step) => <StepRow key={step.key} step={step} />) : (
//                   <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">No submitted items yet.</div>
//                 )}
//               </div>
//             </section>

//             <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
//               <h2 className="text-xl font-extrabold text-slate-950">Completed</h2>
//               <p className="mt-1 text-sm text-slate-500">Approved steps that are already finished.</p>
//               <div className="mt-5 space-y-3">
//                 {completedSteps.length ? completedSteps.map((step) => <StepRow key={step.key} step={step} />) : (
//                   <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">Nothing approved yet.</div>
//                 )}
//               </div>
//             </section>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  canDriverAccessDashboard,
  formatOnboardingBadge,
  getDriverNextRoute,
  getDriverStepRoute,
  isDriverAwaitingReview,
  isDriverProfileComplete
} from '../../utils/driverOnboarding';

function StepRow({ step }) {
  const route = getDriverStepRoute(step);
  const badge = formatOnboardingBadge(step);
  const iconClass =
    step.state === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : step.state === 'submitted'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-600';

  return (
    <Link
      to={route}
      className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${iconClass}`}
        >
          {step.state === 'completed' ? '✓' : '▣'}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-slate-950">{step.title}</div>
          <div className="mt-1 text-sm text-slate-500">{badge}</div>
        </div>
      </div>
      <div className="text-2xl text-slate-300">›</div>
    </Link>
  );
}

function SummaryCard({ label, value, hint }) {
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

export default function DriverOnboardingHome() {
  const navigate = useNavigate();
  const { user, refreshDriverOnboarding, driverOnboarding } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localOnboarding, setLocalOnboarding] = useState(driverOnboarding);

  useEffect(() => {
    if (driverOnboarding) {
      setLocalOnboarding(driverOnboarding);
    }
  }, [driverOnboarding]);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const onboarding = await refreshDriverOnboarding();
        if (active) setLocalOnboarding(onboarding);
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || 'Failed to load account status.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshDriverOnboarding]);

  const onboarding = localOnboarding || driverOnboarding;
  const profileComplete = isDriverProfileComplete(onboarding?.profile);
  const readyForDashboard = canDriverAccessDashboard(onboarding);
  const awaitingReview = isDriverAwaitingReview(onboarding);

  const requiredSteps = useMemo(() => {
    const steps = onboarding?.steps || [];
    const base = profileComplete
      ? []
      : [
          {
            key: 'profile_account',
            title: 'Account Details',
            state: 'required',
            subtitle: 'Recommended next step'
          }
        ];

    return [...base, ...steps.filter((step) => step.state === 'required')];
  }, [onboarding, profileComplete]);

  const submittedSteps = useMemo(() => {
    const steps = onboarding?.steps || [];
    return steps.filter((step) => step.state === 'submitted');
  }, [onboarding]);

  const completedSteps = useMemo(() => {
    const steps = onboarding?.steps || [];
    const base = profileComplete
      ? [
          {
            key: 'profile_account',
            title: 'Account Details',
            state: 'completed',
            subtitle: 'Saved'
          }
        ]
      : [];

    return [...base, ...steps.filter((step) => step.state === 'completed')];
  }, [onboarding, profileComplete]);

  async function handleRefreshStatus() {
    try {
      const latest = await refreshDriverOnboarding();
      setLocalOnboarding(latest);
    } catch {
      // ignore refresh button error
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6">Loading account status...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Driver account status
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Welcome back, {onboarding?.profile?.firstName || user?.name?.split(' ')[0] || 'Driver'}
                </h1>

                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
                  Track your onboarding progress, submit missing driver documents, and unlock the driver dashboard after admin approval.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(getDriverNextRoute(onboarding))}
                  className="driver-btn-primary"
                >
                  {readyForDashboard
                    ? 'Open dashboard'
                    : awaitingReview
                      ? 'Open review status'
                      : 'Continue setup'}
                </button>

                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  className="driver-btn-secondary"
                >
                  Refresh status
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {readyForDashboard ? (
              <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
                All required onboarding steps are approved. Your driver dashboard is unlocked.
              </div>
            ) : awaitingReview ? (
              <div className="mt-6 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-800">
                All required details are submitted. Your documents are now under admin review.
              </div>
            ) : onboarding?.overallStatus === 'rejected' ? (
              <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
                One or more documents were rejected. Please review the notes and re-submit the required item.
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
                Your documents are not complete. Please complete registration before accessing the dashboard.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Progress"
            value={`${Math.round((completedSteps.length / 7) * 100)}%`}
            hint="Across profile, vehicle, and document verification."
          />
          <SummaryCard
            label="Remaining"
            value={requiredSteps.length}
            hint="These items still require action from the driver."
          />
          <SummaryCard
            label="In review"
            value={submittedSteps.length}
            hint="Submitted items waiting for admin verification."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.8fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">Required steps</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete these first to move toward driver approval.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {requiredSteps.length ? (
                requiredSteps.map((step) => <StepRow key={step.key} step={step} />)
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                  No required steps remain.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-extrabold text-slate-950">Submitted</h2>
              <p className="mt-1 text-sm text-slate-500">
                These items are already with the admin review flow.
              </p>

              <div className="mt-5 space-y-3">
                {submittedSteps.length ? (
                  submittedSteps.map((step) => <StepRow key={step.key} step={step} />)
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No submitted items yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-extrabold text-slate-950">Completed</h2>
              <p className="mt-1 text-sm text-slate-500">
                Approved steps that are already finished.
              </p>

              <div className="mt-5 space-y-3">
                {completedSteps.length ? (
                  completedSteps.map((step) => <StepRow key={step.key} step={step} />)
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Nothing approved yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}