import { Link } from 'react-router-dom';

export default function OnboardingShell({ title, description, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/driver/onboarding" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <span aria-hidden="true">←</span>
            Account status
          </Link>
          <div className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 shadow-sm">
            UniGo driver onboarding
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{description}</p> : null}
          </div>

          <div className="px-6 py-8 sm:px-8">{children}</div>

          {footer ? <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 sm:px-8">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
