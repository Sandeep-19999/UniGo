import User from "../models/users/User.js";
import Vehicle from "../models/vehicles/Vehicle.js";
import DriverProfile from "../models/drivers/DriverProfile.js";
import DriverDocument, { DRIVER_DOCUMENT_TYPES } from "../models/drivers/DriverDocument.js";

export const DRIVER_ONBOARDING_STEPS = [
  { key: "profile_photo", title: "Profile Photo", kind: "document", documentType: "profile_photo" },
  { key: "driving_license", title: "Driving License", kind: "document", documentType: "driving_license" },
  { key: "vehicle_insurance", title: "Vehicle Insurance", kind: "document", documentType: "vehicle_insurance" },
  { key: "revenue_license", title: "Revenue License", kind: "document", documentType: "revenue_license" },
  {
    key: "vehicle_registration_document",
    title: "Vehicle Registration Document",
    kind: "document",
    documentType: "vehicle_registration_document"
  },
  { key: "vehicle_information", title: "Vehicle Information", kind: "vehicle" }
];

function splitName(name) {
  const value = String(name || "").trim();
  if (!value) return { firstName: "", lastName: "" };
  const parts = value.split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

export async function ensureDriverProfile(userOrId) {
  const user = typeof userOrId === "object" && userOrId?._id ? userOrId : await User.findById(userOrId);

  if (!user) {
    throw new Error("Driver user not found.");
  }

  if (user.role !== "driver") {
    throw new Error("User is not a driver.");
  }

  const derived = splitName(user.name);

  const profile = await DriverProfile.findOneAndUpdate(
    { user: user._id },
    {
      $setOnInsert: {
        user: user._id,
        firstName: derived.firstName,
        lastName: derived.lastName,
        phone: user.phone || "",
        city: user.city || "",
        onboardingStatus: "not_started",
        recommendedNextStep: "vehicle_information",
        progressPercent: 0
      }
    },
    { new: true, upsert: true }
  );

  return profile;
}

function buildStepState(step, { documentsByType, primaryVehicle }) {
  if (step.kind === "vehicle") {
    if (primaryVehicle) {
      return {
        key: step.key,
        title: step.title,
        state: "completed",
        subtitle: primaryVehicle.reviewStatus === "approved" ? "Approved" : "Completed",
        statusLabel: primaryVehicle.reviewStatus || "approved"
      };
    }

    return {
      key: step.key,
      title: step.title,
      state: "required",
      subtitle: "Get Started",
      statusLabel: "missing"
    };
  }

  const doc = documentsByType[step.documentType];

  if (!doc) {
    return {
      key: step.key,
      title: step.title,
      state: "required",
      subtitle: step.key === "profile_photo" ? "Recommended next step" : "Get Started",
      statusLabel: "missing"
    };
  }

  if (doc.status === "approved") {
    return {
      key: step.key,
      title: step.title,
      state: "completed",
      subtitle: "Approved",
      statusLabel: doc.status,
      document: doc
    };
  }

  if (doc.status === "submitted") {
    return {
      key: step.key,
      title: step.title,
      state: "submitted",
      subtitle: "In review",
      statusLabel: doc.status,
      document: doc
    };
  }

  return {
    key: step.key,
    title: step.title,
    state: "required",
    subtitle: doc.reviewNote || "Please re-submit",
    statusLabel: doc.status,
    document: doc
  };
}

export async function buildDriverOnboardingSummary(driverId) {
  const user = await User.findById(driverId);
  if (!user) throw new Error("Driver not found.");
  if (user.role !== "driver") throw new Error("User is not a driver.");

  const profile = await ensureDriverProfile(user);

  const [documents, primaryVehicle] = await Promise.all([
    DriverDocument.find({ driver: driverId }).sort({ updatedAt: -1 }),
    Vehicle.findOne({ driver: driverId }).sort({ isPrimary: -1, createdAt: -1 })
  ]);

  const documentsByType = Object.fromEntries(documents.map((doc) => [doc.documentType, doc]));
  const steps = DRIVER_ONBOARDING_STEPS.map((step) => buildStepState(step, { documentsByType, primaryVehicle }));

  const required = steps.filter((step) => step.state === "required");
  const submitted = steps.filter((step) => step.state === "submitted");
  const completed = steps.filter((step) => step.state === "completed");

  const allApprovedDocuments = DRIVER_DOCUMENT_TYPES.every((type) => documentsByType[type]?.status === "approved");
  const hasVehicleInfo = Boolean(primaryVehicle);
  const canAccessDashboard = allApprovedDocuments && hasVehicleInfo;

  let overallStatus = "not_started";
  if (canAccessDashboard) overallStatus = "approved";
  else if (submitted.length) overallStatus = "under_review";
  else if (completed.length || documents.length || hasVehicleInfo) overallStatus = "in_progress";

  if (documents.some((doc) => doc.status === "rejected")) {
    overallStatus = "rejected";
  }

  const recommendedNextStep = required[0]?.key || null;
  const progressPercent = Math.round((completed.length / DRIVER_ONBOARDING_STEPS.length) * 100);

  const update = {
    firstName: profile.firstName || splitName(user.name).firstName,
    lastName: profile.lastName || splitName(user.name).lastName,
    phone: profile.phone || user.phone || "",
    city: profile.city || user.city || "",
    onboardingStatus: overallStatus,
    recommendedNextStep: recommendedNextStep || "done",
    progressPercent,
    approvedAt: canAccessDashboard ? new Date() : null
  };

  await DriverProfile.updateOne({ user: driverId }, { $set: update });
  const freshProfile = await DriverProfile.findOne({ user: driverId });

  return {
    user,
    profile: freshProfile,
    primaryVehicle,
    documents,
    documentsByType,
    steps,
    required,
    submitted,
    completed,
    counts: {
      total: DRIVER_ONBOARDING_STEPS.length,
      required: required.length,
      submitted: submitted.length,
      completed: completed.length
    },
    recommendedNextStep,
    overallStatus,
    canAccessDashboard,
    progressPercent
  };
}
