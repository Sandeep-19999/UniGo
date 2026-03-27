const STEP_META = {
  assigned: {
    number: 1,
    label: "Assigned",
    description: "The ride is now assigned to you.",
    cta: "Mark arrived at pickup"
  },
  arrived_at_pickup: {
    number: 2,
    label: "Arrived at Pickup",
    description: "You have reached the pickup location.",
    cta: "Notify rider"
  },
  rider_notified: {
    number: 3,
    label: "Rider Notified",
    description: "The passenger has been notified.",
    cta: "Start trip"
  },
  trip_started: {
    number: 4,
    label: "Trip Started",
    description: "The ride is officially in progress.",
    cta: "Mark dropping off"
  },
  dropping_off: {
    number: 5,
    label: "Dropping Off",
    description: "You are heading to the destination.",
    cta: "Complete ride"
  },
  completed: {
    number: 6,
    label: "Completed",
    description: "The ride was completed successfully.",
    cta: null
  }
};

const ORDER = [
  "assigned",
  "arrived_at_pickup",
  "rider_notified",
  "trip_started",
  "dropping_off",
  "completed"
];

export default function RideStepProgress({ currentStep = "assigned", busy = false, onAdvance }) {
  const safeStep = ORDER.includes(currentStep) ? currentStep : "assigned";
  const currentIndex = ORDER.indexOf(safeStep);
  const currentMeta = STEP_META[safeStep];
  const nextStep = ORDER[currentIndex + 1] || null;

  return (
    <div className="driver-ride-progress">
      <div className="driver-ride-progress-header">
        <div>
          <div className="driver-ride-progress-kicker">Trip progress</div>
          <div className="driver-ride-progress-title">Step {currentMeta.number} of 6</div>
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
            Update the ride only in order so the trip timeline stays consistent.
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