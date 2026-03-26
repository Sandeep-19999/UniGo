import { buildDriverOnboardingSummary } from "../services/onboardingService.js";

export async function requireApprovedDriverOnboarding(req, res, next) {
  try {
    const summary = await buildDriverOnboardingSummary(req.user._id);
    if (!summary.canAccessDashboard) {
      return res.status(403).json({
        message: "Your documents are not complete. Please complete registration before accessing the dashboard.",
        onboarding: summary
      });
    }

    req.driverOnboarding = summary;
    next();
  } catch (err) {
    next(err);
  }
}
