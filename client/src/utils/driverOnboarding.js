// export const DRIVER_DOCUMENT_META = {
//   profile_photo: {
//     key: 'profile_photo',
//     title: 'Profile Photo',
//     route: '/driver/onboarding/document/profile_photo',
//     helperTitle: 'Take your profile photo',
//     helperText:
//       'Face the camera directly. Keep your full face visible, well lit, and without heavy filters or glare.',
//     tips: [
//       'Face the camera directly with your eyes and mouth clearly visible.',
//       'Make sure the photo is well lit, free of glare, and in focus.',
//       'Do not upload a photo of a photo, screenshot, or heavily edited image.'
//     ],
//     accepts: 'image/*'
//   },
//   driving_license: {
//     key: 'driving_license',
//     title: 'Driving License',
//     route: '/driver/onboarding/document/driving_license',
//     helperTitle: 'Upload your driving license',
//     helperText: 'Submit a clear image or PDF of your valid driving license. All text and the expiry date must be readable.',
//     tips: [
//       'Upload the front side clearly. Add the back side in notes only if your license requires it.',
//       'Keep all corners visible and avoid blur or reflections.',
//       'Use a recent, valid license only.'
//     ],
//     accepts: 'image/*,.pdf'
//   },
//   vehicle_insurance: {
//     key: 'vehicle_insurance',
//     title: 'Vehicle Insurance',
//     route: '/driver/onboarding/document/vehicle_insurance',
//     helperTitle: 'Upload your vehicle insurance',
//     helperText: 'Submit the current insurance document for the vehicle you will use for rides.',
//     tips: [
//       'Policy number should be visible.',
//       'Expiry date must be readable.',
//       'The vehicle details should match your registered vehicle.'
//     ],
//     accepts: 'image/*,.pdf'
//   },
//   revenue_license: {
//     key: 'revenue_license',
//     title: 'Revenue License',
//     route: '/driver/onboarding/document/revenue_license',
//     helperTitle: 'Upload your revenue license',
//     helperText: 'Submit a clear copy of the active revenue license for the same vehicle.',
//     tips: [
//       'Keep the document fully visible.',
//       'Check that year and registration details are clear.',
//       'Avoid dark shadows and extreme compression.'
//     ],
//     accepts: 'image/*,.pdf'
//   },
//   vehicle_registration_document: {
//     key: 'vehicle_registration_document',
//     title: 'Vehicle Registration Document',
//     route: '/driver/onboarding/document/vehicle_registration_document',
//     helperTitle: 'Upload your vehicle registration document',
//     helperText: 'Submit the official registration document that matches the vehicle entered in onboarding.',
//     tips: [
//       'Owner and vehicle details must be readable.',
//       'Do not crop the edges of the document.',
//       'Use the same vehicle that you plan to keep as your primary vehicle.'
//     ],
//     accepts: 'image/*,.pdf'
//   }
// };

// export const STEP_ROUTE_BY_KEY = {
//   profile_account: '/driver/onboarding/account',
//   vehicle_information: '/driver/onboarding/vehicle',
//   profile_photo: DRIVER_DOCUMENT_META.profile_photo.route,
//   driving_license: DRIVER_DOCUMENT_META.driving_license.route,
//   vehicle_insurance: DRIVER_DOCUMENT_META.vehicle_insurance.route,
//   revenue_license: DRIVER_DOCUMENT_META.revenue_license.route,
//   vehicle_registration_document: DRIVER_DOCUMENT_META.vehicle_registration_document.route
// };

// export function isDriverProfileComplete(profile) {
//   return Boolean(
//     profile &&
//       String(profile.firstName || '').trim() &&
//       String(profile.lastName || '').trim() &&
//       String(profile.phone || '').trim() &&
//       String(profile.city || '').trim()
//   );
// }

// export function canDriverAccessDashboard(onboarding) {
//   return Boolean(onboarding?.canAccessDashboard && isDriverProfileComplete(onboarding?.profile));
// }

// export function getDriverStepRoute(stepOrKey) {
//   const key = typeof stepOrKey === 'string' ? stepOrKey : stepOrKey?.key;
//   return STEP_ROUTE_BY_KEY[key] || '/driver/onboarding';
// }

// export function getDriverNextRoute(onboarding) {
//   if (!onboarding || !isDriverProfileComplete(onboarding.profile)) {
//     return '/driver/onboarding/account';
//   }

//   if (canDriverAccessDashboard(onboarding)) {
//     return '/driver/dashboard';
//   }

//   const key = onboarding?.recommendedNextStep || onboarding?.required?.[0]?.key || 'vehicle_information';
//   return getDriverStepRoute(key);
// }

// export function formatOnboardingBadge(step) {
//   if (!step) return 'Get Started';
//   if (step.state === 'completed') return 'Approved';
//   if (step.state === 'submitted') return 'In review';
//   return step.subtitle || 'Get Started';
// }

// export function documentMetaFromRouteParam(documentType) {
//   return DRIVER_DOCUMENT_META[documentType] || null;
// }

// export function geoJsonPointToLatLng(point) {
//   if (!point?.coordinates || point.coordinates.length !== 2) return null;
//   return [Number(point.coordinates[1]), Number(point.coordinates[0])];
// }




export const DRIVER_DOCUMENT_META = {
  profile_photo: {
    key: 'profile_photo',
    title: 'Profile Photo',
    route: '/driver/onboarding/document/profile_photo',
    helperTitle: 'Take your profile photo',
    helperText:
      'Face the camera directly. Keep your full face visible, well lit, and without heavy filters or glare.',
    tips: [
      'Face the camera directly with your eyes and mouth clearly visible.',
      'Make sure the photo is well lit, free of glare, and in focus.',
      'Do not upload a photo of a photo, screenshot, or heavily edited image.'
    ],
    accepts: 'image/*'
  },
  driving_license: {
    key: 'driving_license',
    title: 'Driving License',
    route: '/driver/onboarding/document/driving_license',
    helperTitle: 'Upload your driving license',
    helperText:
      'Submit a clear image or PDF of your valid driving license. All text and the expiry date must be readable.',
    tips: [
      'Upload the front side clearly. Add the back side in notes only if your license requires it.',
      'Keep all corners visible and avoid blur or reflections.',
      'Use a recent, valid license only.'
    ],
    accepts: 'image/*,.pdf'
  },
  vehicle_insurance: {
    key: 'vehicle_insurance',
    title: 'Vehicle Insurance',
    route: '/driver/onboarding/document/vehicle_insurance',
    helperTitle: 'Upload your vehicle insurance',
    helperText:
      'Submit the current insurance document for the vehicle you will use for rides.',
    tips: [
      'Policy number should be visible.',
      'Expiry date must be readable.',
      'The vehicle details should match your registered vehicle.'
    ],
    accepts: 'image/*,.pdf'
  },
  revenue_license: {
    key: 'revenue_license',
    title: 'Revenue License',
    route: '/driver/onboarding/document/revenue_license',
    helperTitle: 'Upload your revenue license',
    helperText:
      'Submit a clear copy of the active revenue license for the same vehicle.',
    tips: [
      'Keep the document fully visible.',
      'Check that year and registration details are clear.',
      'Avoid dark shadows and extreme compression.'
    ],
    accepts: 'image/*,.pdf'
  },
  vehicle_registration_document: {
    key: 'vehicle_registration_document',
    title: 'Vehicle Registration Document',
    route: '/driver/onboarding/document/vehicle_registration_document',
    helperTitle: 'Upload your vehicle registration document',
    helperText:
      'Submit the official registration document that matches the vehicle entered in onboarding.',
    tips: [
      'Owner and vehicle details must be readable.',
      'Do not crop the edges of the document.',
      'Use the same vehicle that you plan to keep as your primary vehicle.'
    ],
    accepts: 'image/*,.pdf'
  }
};

export const DRIVER_REVIEW_PENDING_ROUTE = '/driver/onboarding/review-pending';

export const STEP_ROUTE_BY_KEY = {
  profile_account: '/driver/onboarding/account',
  vehicle_information: '/driver/onboarding/vehicle',
  profile_photo: DRIVER_DOCUMENT_META.profile_photo.route,
  driving_license: DRIVER_DOCUMENT_META.driving_license.route,
  vehicle_insurance: DRIVER_DOCUMENT_META.vehicle_insurance.route,
  revenue_license: DRIVER_DOCUMENT_META.revenue_license.route,
  vehicle_registration_document: DRIVER_DOCUMENT_META.vehicle_registration_document.route
};

export function isDriverProfileComplete(profile) {
  return Boolean(
    profile &&
      String(profile.firstName || '').trim() &&
      String(profile.lastName || '').trim() &&
      String(profile.phone || '').trim() &&
      String(profile.city || '').trim()
  );
}

export function canDriverAccessDashboard(onboarding) {
  return Boolean(
    onboarding?.canAccessDashboard && isDriverProfileComplete(onboarding?.profile)
  );
}

export function isDriverAwaitingReview(onboarding) {
  if (!onboarding || canDriverAccessDashboard(onboarding)) return false;

  const requiredCount = Array.isArray(onboarding?.required)
    ? onboarding.required.length
    : 0;

  const submittedCount = Array.isArray(onboarding?.submitted)
    ? onboarding.submitted.length
    : 0;

  return (
    onboarding?.overallStatus === 'under_review' &&
    requiredCount === 0 &&
    submittedCount > 0
  );
}

export function getDriverStepRoute(stepOrKey) {
  const key = typeof stepOrKey === 'string' ? stepOrKey : stepOrKey?.key;
  return STEP_ROUTE_BY_KEY[key] || '/driver/onboarding';
}

export function getDriverNextRoute(onboarding) {
  if (!onboarding || !isDriverProfileComplete(onboarding.profile)) {
    return '/driver/onboarding/account';
  }

  if (canDriverAccessDashboard(onboarding)) {
    return '/driver/dashboard';
  }

  if (isDriverAwaitingReview(onboarding)) {
    return DRIVER_REVIEW_PENDING_ROUTE;
  }

  const key =
    onboarding?.recommendedNextStep ||
    onboarding?.required?.[0]?.key ||
    'vehicle_information';

  return getDriverStepRoute(key);
}

export function formatOnboardingBadge(step) {
  if (!step) return 'Get Started';
  if (step.state === 'completed') return 'Approved';
  if (step.state === 'submitted') return 'In review';
  return step.subtitle || 'Get Started';
}

export function documentMetaFromRouteParam(documentType) {
  return DRIVER_DOCUMENT_META[documentType] || null;
}

export function geoJsonPointToLatLng(point) {
  if (!point?.coordinates || point.coordinates.length !== 2) return null;
  return [Number(point.coordinates[1]), Number(point.coordinates[0])];
}