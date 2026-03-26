// import { useLocation, useNavigate } from 'react-router-dom';
// import OnboardingShell from '../../components/driver/OnboardingShell';

// export default function DriverDocumentSubmitted() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const title = location.state?.title || 'Document';
//   const nextRoute = location.state?.nextRoute || '/driver/onboarding';

//   return (
//     <OnboardingShell
//       title="We’re reviewing your document"
//       description="It usually takes less than a day for us to complete the review process. You can return to account status at any time to check progress."
//       footer={<div className="text-sm text-slate-500">Latest submission: {title}</div>}
//     >
//       <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
//         <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-700">
//           ✓
//         </div>
//         <div className="max-w-xl text-lg font-semibold text-slate-900">Your {title.toLowerCase()} has been submitted for review.</div>
//         <div className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
//           The document is now in the submitted state. Once it is approved, your onboarding progress will update automatically.
//         </div>

//         <div className="mt-8 flex flex-wrap justify-center gap-3">
//           <button type="button" onClick={() => navigate('/driver/onboarding')} className="driver-btn-primary">
//             Go to account status
//           </button>
//           <button type="button" onClick={() => navigate(nextRoute)} className="driver-btn-secondary">
//             Continue setup
//           </button>
//         </div>
//       </div>
//     </OnboardingShell>
//   );
// }




import { useLocation, useNavigate } from 'react-router-dom';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { DRIVER_REVIEW_PENDING_ROUTE } from '../../utils/driverOnboarding';

export default function DriverDocumentSubmitted() {
  const navigate = useNavigate();
  const location = useLocation();

  const title = location.state?.title || 'Document';
  const nextRoute = location.state?.nextRoute || '/driver/onboarding';
  const waitingForReview = nextRoute === DRIVER_REVIEW_PENDING_ROUTE;

  return (
    <OnboardingShell
      title={waitingForReview ? 'Your documents are now under review' : 'We’re reviewing your document'}
      description={
        waitingForReview
          ? 'All required onboarding items have been submitted. Admin review is now in progress. Once everything is approved, your driver dashboard will unlock.'
          : 'It usually takes less than a day for us to complete the review process. You can return to account status at any time to check progress.'
      }
      footer={<div className="text-sm text-slate-500">Latest submission: {title}</div>}
    >
      <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-700">
          ✓
        </div>

        <div className="max-w-xl text-lg font-semibold text-slate-900">
          Your {title.toLowerCase()} has been submitted for review.
        </div>

        <div className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
          {waitingForReview
            ? 'You have completed the driver submission stage. The next step is admin approval.'
            : 'The document is now in the submitted state. Once it is approved, your onboarding progress will update automatically.'}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/driver/onboarding')}
            className="driver-btn-secondary"
          >
            Go to account status
          </button>

          <button
            type="button"
            onClick={() => navigate(nextRoute)}
            className="driver-btn-primary"
          >
            {waitingForReview ? 'Open review status' : 'Continue setup'}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}