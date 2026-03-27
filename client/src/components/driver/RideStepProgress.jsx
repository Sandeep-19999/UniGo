const STEP_META = {
  assigned: {
    number: 1,
    label: "Accepted",
    description: "Passenger is assigned to you and ready for pickup.",
    cta: "Start ride"
  },
  arrived_at_pickup: {
    number: 1,
    label: "Arrived at Pickup",
    description: "You have reached the pickup point.",
    cta: "Start ride"
  },
  rider_notified: {
    number: 1,
    label: "Rider Notified",
    description: "The passenger has been notified for pickup.",
    cta: "Start ride"
  },
  trip_started: {
    number: 2,
    label: "Trip Started",
    description: "Ride is in progress now.",
    cta: "Complete ride"
  },
  dropping_off: {
    number: 2,
    label: "Dropping Off",
    description: "You are close to the destination.",
    cta: "Complete ride"
  },
  completed: {
    number: 3,
    label: "Completed",
    description: "The ride finished successfully and earnings were added.",
    cta: null
  }
};

const ORDER = ["assigned", "trip_started", "completed"];

function normalizeStep(step) {
  if (["assigned", "arrived_at_pickup", "rider_notified"].includes(step)) return "assigned";
  if (["trip_started", "dropping_off"].includes(step)) return "trip_started";
  if (step === "completed") return "completed";
  return "assigned";
}

export default function RideStepProgress({ currentStep = "assigned", busy = false, onAdvance }) {
  const safeStep = normalizeStep(currentStep);
  const currentIndex = ORDER.indexOf(safeStep);
  const currentMeta = STEP_META[safeStep];
  const nextStep = ORDER[currentIndex + 1] || null;

  return (
    <div className="driver-ride-progress">
      <div className="driver-ride-progress-header">
        <div>
          <div className="driver-ride-progress-kicker">Trip progress</div>
          <div className="driver-ride-progress-title">Step {currentMeta.number} of 3</div>
        </div>
        <div className="driver-ride-progress-current">{currentMeta.label}</div>
      </div>

      <div className="driver-ride-progress-grid">
        {ORDER.map((stepKey, index) => {
          const step = STEP_META[stepKey];
          const completed = index < currentIndex;
          const active = index === currentIndex;

          return (
            <div
              key={stepKey}
              className={[
                "driver-ride-step-card",
                completed ? "is-complete" : "",
                active ? "is-active" : ""
              ].join(" ")}
            >
              <div className="driver-ride-step-number">{step.number}</div>
              <div className="driver-ride-step-copy">
                <strong>{step.label}</strong>
                <span>{step.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="driver-ride-progress-footer">
        <div>
          <div className="driver-ride-progress-status">Current stage: {currentMeta.label}</div>
          <div className="driver-ride-progress-hint">
            Use the ride action buttons in order so the trip flow and earnings stay correct.
          </div>
        </div>

        {nextStep ? (
          <button
            type="button"
            className="driver-btn-primary"
            onClick={() => onAdvance?.(nextStep)}
            disabled={busy}
          >
            {busy ? "Updating..." : currentMeta.cta}
          </button>
        ) : (
          <div className="driver-ride-progress-complete">Ride completed</div>
        )}
      </div>
    </div>
  );
}