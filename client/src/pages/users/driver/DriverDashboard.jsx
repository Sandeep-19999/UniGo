import "../../../styles/driverRideDashboard.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Popup, useMap } from "react-leaflet";
import { api } from "../../../api/axios";
import RideStepProgress from "../../../components/driver/RideStepProgress";
import { useAuth } from "../../../context/AuthContext";

const FALLBACK_CENTER = [6.9068, 79.8706];

const driverCarIcon = L.divIcon({
  className: "",
  html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 6px 10px rgba(15,23,42,0.22));">🚗</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const passengerManIcon = L.divIcon({
  className: "",
  html: '<div style="font-size:26px;line-height:1;filter:drop-shadow(0 6px 10px rgba(15,23,42,0.22));">🧍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

function formatMoney(value) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDistance(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Distance unavailable";
  return `${numeric.toFixed(1)} km away`;
}

function initials(name = "Driver") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function DashboardMapBridge({ center, followMe, mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  useEffect(() => {
    if (center && followMe) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, followMe, map]);

  return null;
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        reject(new Error("Location access failed. Please allow browser location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  });
}

function computeRideMetrics(acceptedRequests, earningsSummary) {
  const completedRequests = acceptedRequests.filter((ride) => ride.status === "completed");
  const activeRequests = acceptedRequests.filter((ride) => ["accepted", "started"].includes(ride.status));

  const derivedTotal = completedRequests.reduce(
    (sum, ride) => sum + Number(ride.finalFare ?? ride.estimatedFare ?? ride.estimatedPrice ?? 0),
    0
  );

  return {
    totalEarnings: Number(earningsSummary?.totalEarnings ?? derivedTotal),
    availableBalance: Number(earningsSummary?.availableBalance ?? derivedTotal),
    totalCompletedRides: Number(earningsSummary?.completedRides ?? completedRequests.length),
    activeRideCount: activeRequests.length
  };
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastLocationSyncRef = useRef(0);

  const [isOnline, setIsOnline] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [profile, setProfile] = useState({
    driverCurrentDestination: "",
    driverCurrentDestinationUpdatedAt: null
  });
  const [destinationDraft, setDestinationDraft] = useState("");
  const [destinationModalOpen, setDestinationModalOpen] = useState(false);
  const [destinationBusy, setDestinationBusy] = useState(false);
  const [destinationError, setDestinationError] = useState("");
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [requestBusyId, setRequestBusyId] = useState("");
  const [progressBusy, setProgressBusy] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [actionError, setActionError] = useState("");

  const currentDestination = profile.driverCurrentDestination || "";

  const activeRide = useMemo(
    () => acceptedRequests.find((ride) => ["accepted", "started"].includes(ride.status)) || null,
    [acceptedRequests]
  );

  const passengerMarkerPosition = useMemo(() => {
    const live = activeRide?.passengerLiveLocation;
    if (live?.lat != null && live?.lng != null) return [live.lat, live.lng];
    const pickup = activeRide?.pickupCoords;
    if (pickup?.lat != null && pickup?.lng != null) return [pickup.lat, pickup.lng];
    return null;
  }, [activeRide]);

  const rideMetrics = useMemo(() => computeRideMetrics(acceptedRequests, earningsSummary), [acceptedRequests, earningsSummary]);

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingState(true);

    try {
      const [availabilityRes, matchesRes, acceptedRes, earningsRes] = await Promise.all([
        api.get("/driver/availability/me"),
        api.get("/driver/requests/matches").catch(() => ({ data: { items: [] } })),
        api.get("/driver/requests/accepted").catch(() => ({ data: { rideRequests: [] } })),
        api.get("/driver/earnings/summary").catch(() => ({ data: { earnings: null } }))
      ]);

      const availability = availabilityRes.data?.availability || null;
      const nextProfile = availabilityRes.data?.profile || {
        driverCurrentDestination: "",
        driverCurrentDestinationUpdatedAt: null
      };

      setProfile(nextProfile);
      setDestinationDraft((current) => current || nextProfile.driverCurrentDestination || "");
      setIsOnline(Boolean(availability?.isOnline));
      setMatchedRequests(matchesRes.data?.items || []);
      setAcceptedRequests(acceptedRes.data?.rideRequests || []);
      setEarningsSummary(earningsRes.data?.earnings || null);

      if (!nextProfile.driverCurrentDestination && !availability?.isOnline) {
        setDestinationModalOpen(true);
      }
    } catch (error) {
      setActionError(error?.response?.data?.message || "Failed to load driver dashboard.");
    } finally {
      if (!silent) setLoadingState(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const timer = setInterval(() => {
      loadDashboardData({ silent: true });
    }, 5000);

    return () => clearInterval(timer);
  }, [loadDashboardData]);

  const syncLiveLocation = useCallback(async (coords) => {
    const now = Date.now();
    if (now - lastLocationSyncRef.current < 8000) return;

    lastLocationSyncRef.current = now;

    try {
      await api.patch("/driver/availability/location", {
        currentLocation: { lat: coords[0], lng: coords[1] }
      });
    } catch {
      // Keep the UI responsive even if a sync call fails.
    }
  }, []);

  useEffect(() => {
    function stopTracking() {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    if (!isOnline) {
      stopTracking();
      return undefined;
    }

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return undefined;
    }

    setGeoError("");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        syncLiveLocation(coords);
      },
      () => {
        setGeoError("Location access failed. Please allow browser location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );

    return stopTracking;
  }, [isOnline, syncLiveLocation]);

  const center = position || passengerMarkerPosition || FALLBACK_CENTER;

  async function handleSaveDestination() {
    const cleaned = destinationDraft.trim();
    setDestinationError("");

    if (cleaned.length < 3) {
      setDestinationError("Destination must be at least 3 characters long.");
      return;
    }

    setDestinationBusy(true);

    try {
      const { data } = await api.patch("/driver/availability/destination", {
        destinationLabel: cleaned
      });

      const nextProfile = data?.profile || {
        driverCurrentDestination: cleaned,
        driverCurrentDestinationUpdatedAt: new Date().toISOString()
      };

      setProfile(nextProfile);
      setDestinationDraft(nextProfile.driverCurrentDestination || cleaned);
      setDestinationModalOpen(false);
      setActionError("");
      await loadDashboardData({ silent: true });
    } catch (error) {
      setDestinationError(error?.response?.data?.message || "Failed to save destination.");
    } finally {
      setDestinationBusy(false);
    }
  }

  async function handleToggleOnline() {
    setActionError("");
    setGeoError("");

    if (isOnline) {
      try {
        await api.patch("/driver/availability/go-offline");
        setIsOnline(false);
        await loadDashboardData({ silent: true });
      } catch (error) {
        setActionError(error?.response?.data?.message || "Failed to switch offline.");
      }
      return;
    }

    if (!currentDestination) {
      setDestinationModalOpen(true);
      setActionError("Save your current destination before going online.");
      return;
    }

    try {
      const current = position || (await getBrowserLocation());
      setPosition(current);

      await api.post("/driver/availability/go-online", {
        currentLocation: { lat: current[0], lng: current[1] }
      });

      setIsOnline(true);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setActionError(error?.response?.data?.message || error.message || "Failed to go online.");
    }
  }

  async function handleAcceptRequest(item) {
    setRequestBusyId(item?.rideRequest?._id || "");
    setActionError("");

    try {
      await api.patch(`/driver/requests/${item.rideRequest._id}/accept`);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setActionError(error?.response?.data?.message || "Failed to accept ride request.");
    } finally {
      setRequestBusyId("");
    }
  }

  async function handleRejectRequest(item) {
    setRequestBusyId(item?.rideRequest?._id || "");
    setActionError("");

    try {
      await api.patch(`/driver/requests/${item.rideRequest._id}/reject`);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setActionError(error?.response?.data?.message || "Failed to reject ride request.");
    } finally {
      setRequestBusyId("");
    }
  }

  async function handleAdvanceStep(nextStep) {
    if (!activeRide?._id) return;

    setProgressBusy(true);
    setActionError("");

    try {
      await api.patch(`/driver/requests/${activeRide._id}/step`, { step: nextStep });
      await loadDashboardData({ silent: true });
    } catch (error) {
      setActionError(error?.response?.data?.message || "Failed to update ride progress.");
    } finally {
      setProgressBusy(false);
    }
  }

  async function handleCancelActiveRide() {
    if (!activeRide?._id) return;
    setProgressBusy(true);
    setActionError("");

    try {
      await api.patch(`/driver/requests/${activeRide._id}/cancel`);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setActionError(error?.response?.data?.message || "Failed to cancel ride.");
    } finally {
      setProgressBusy(false);
    }
  }

  function recenterMap() {
    if (mapRef.current && center) {
      mapRef.current.flyTo(center, 14, { duration: 1.1 });
    }
  }

  if (loadingState) {
    return <div className="driver-home-loading">Loading driver dashboard...</div>;
  }

  return (
    <div className="driver-home-screen">
      <MapContainer center={center} zoom={8} scrollWheelZoom className="driver-home-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DashboardMapBridge center={center} followMe={followMe} mapRef={mapRef} />

        {position ? (
          <Marker position={position} icon={driverCarIcon}>
            <Popup>You are here</Popup>
          </Marker>
        ) : null}

        {passengerMarkerPosition ? (
          <Marker position={passengerMarkerPosition} icon={passengerManIcon}>
            <Popup>{activeRide?.passenger?.name || "Passenger"}</Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="driver-home-topbar">
        <div className="driver-home-avatar-pill">
          <div className="driver-home-avatar">{initials(user?.name || "Driver")}</div>
        </div>

        <div className="driver-home-earnings-pill">{formatMoney(rideMetrics.totalEarnings)}</div>
      </div>

      <div className="driver-home-destination-pill">
        <span className="driver-home-destination-label">Destination</span>
        <strong>{currentDestination || "Not saved yet"}</strong>
      </div>

      <div className="driver-home-right-buttons">
        <button type="button" className="driver-home-fab" onClick={() => setFollowMe((prev) => !prev)} title="Toggle follow mode">
          {followMe ? "◎" : "◌"}
        </button>

        <button type="button" className="driver-home-fab" onClick={recenterMap} title="Re-center">
          ⌖
        </button>
      </div>

      <div className="driver-home-go-wrap">
        <button type="button" className={`driver-home-go-btn ${isOnline ? "is-online" : ""}`} onClick={handleToggleOnline}>
          {isOnline ? "On" : "Go"}
        </button>
      </div>

      <div className="driver-home-sheet driver-home-sheet-expanded">
        <div className="driver-home-sheet-handle" />

        <div className={`driver-home-sheet-status ${isOnline ? "online" : "offline"}`}>
          <span className="driver-home-status-dot" />
          {isOnline ? "Online" : "Offline"}
        </div>

        <div className="driver-home-sheet-links driver-home-sheet-links-three">
          <Link to="/driver/dashboard" className="driver-home-sheet-link">Dashboard</Link>
          <Link to="/driver/history" className="driver-home-sheet-link">Ride History</Link>
          <Link to="/driver/cashout" className="driver-home-sheet-link">Cashout</Link>
        </div>

        <div className="driver-home-mini-stats driver-home-mini-stats-visible">
          <div className="driver-home-mini-card">
            <span>Active rides</span>
            <strong>{rideMetrics.activeRideCount}</strong>
          </div>
          <div className="driver-home-mini-card">
            <span>Completed</span>
            <strong>{rideMetrics.totalCompletedRides}</strong>
          </div>
          <div className="driver-home-mini-card">
            <span>Available</span>
            <strong>{formatMoney(rideMetrics.availableBalance)}</strong>
          </div>
        </div>

        <div className="driver-home-content-stack">
          <div className="driver-home-destination-card">
            <div>
              <div className="driver-home-card-kicker">Driver route</div>
              <strong>{currentDestination || "Destination not saved yet"}</strong>
              <p>The driver goes online only after the current destination is saved to the database.</p>
            </div>
            <button type="button" className="driver-btn-secondary" onClick={() => setDestinationModalOpen(true)}>
              Edit destination
            </button>
          </div>

          {activeRide ? (
            <div className="driver-home-active-ride-card">
              <div className="driver-home-active-ride-head">
                <div>
                  <div className="driver-home-card-kicker">Active trip</div>
                  <h3>{activeRide.passenger?.name || "Passenger"}</h3>
                  <p>{activeRide.pickupLocation} → {activeRide.dropLocation}</p>
                </div>
                <div className="driver-home-active-fare">{formatMoney(activeRide.finalFare ?? activeRide.estimatedFare ?? activeRide.estimatedPrice ?? 0)}</div>
              </div>

              <div className="driver-home-active-ride-meta">
                <div>
                  <span>Pickup</span>
                  <strong>{activeRide.pickupLocation}</strong>
                </div>
                <div>
                  <span>Drop</span>
                  <strong>{activeRide.dropLocation}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong className="capitalize">{activeRide.status}</strong>
                </div>
                <div>
                  <span>Distance</span>
                  <strong>{Number(activeRide.distanceKm || 0).toFixed(1)} km</strong>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
                Passenger marker is shown on the map with a little man icon. It uses live passenger location when available and falls back to the pickup point.
              </div>

              <RideStepProgress currentStep={activeRide.driverJourneyStep || "assigned"} busy={progressBusy} onAdvance={handleAdvanceStep} />

              {activeRide.status !== "completed" ? (
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="driver-btn-secondary" onClick={handleCancelActiveRide} disabled={progressBusy}>
                    {progressBusy ? "Updating..." : "Cancel ride"}
                  </button>
                  <Link to="/driver/cashout" className="driver-btn-primary">View earnings</Link>
                </div>
              ) : null}
            </div>
          ) : matchedRequests.length > 0 ? (
            <div className="driver-home-request-list">
              {matchedRequests.slice(0, 3).map((item) => (
                <div key={item.rideRequest._id} className="driver-home-request-card">
                  <div className="driver-home-request-card-head">
                    <div>
                      <div className="driver-home-card-kicker">Matched ride request</div>
                      <h3>{item.rideRequest.passenger?.name || "Passenger"}</h3>
                    </div>
                    <div className="driver-home-request-distance">{formatDistance(item.myMatch?.pickupDistanceKm)}</div>
                  </div>

                  <div className="driver-home-request-route">
                    <div>
                      <span>Pickup Location</span>
                      <strong>{item.rideRequest.pickupLocation}</strong>
                    </div>
                    <div>
                      <span>Drop Location</span>
                      <strong>{item.rideRequest.dropLocation}</strong>
                    </div>
                    <div>
                      <span>Estimated Fare</span>
                      <strong>{formatMoney(item.rideRequest.estimatedFare ?? item.rideRequest.estimatedPrice ?? 0)}</strong>
                    </div>
                    <div>
                      <span>Seat request</span>
                      <strong>{Number(item.rideRequest.numberOfSeats || 0) || "Any"}</strong>
                    </div>
                  </div>

                  <div className="driver-home-request-card-actions">
                    <button type="button" className="driver-btn-primary" disabled={requestBusyId === item.rideRequest._id} onClick={() => handleAcceptRequest(item)}>
                      {requestBusyId === item.rideRequest._id ? "Accepting..." : "Accept"}
                    </button>
                    <button type="button" className="driver-btn-secondary" disabled={requestBusyId === item.rideRequest._id} onClick={() => handleRejectRequest(item)}>
                      {requestBusyId === item.rideRequest._id ? "Updating..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="driver-home-empty-card">
              <div className="driver-home-card-kicker">Ride queue</div>
              <h3>No matched ride requests yet</h3>
              <p>Go online with your saved destination. Matching runs only when the passenger drop location matches your current destination.</p>
            </div>
          )}
        </div>

        {geoError ? <div className="driver-home-error">{geoError}</div> : null}
        {actionError ? <div className="driver-home-error">{actionError}</div> : null}
      </div>

      {destinationModalOpen ? (
        <div className="driver-home-modal-backdrop">
          <div className="driver-home-modal">
            <div className="driver-home-modal-kicker">Where are you going?</div>
            <h2>Save driver destination</h2>
            <p>Enter the destination you are heading to. This is saved as <strong>driverCurrentDestination</strong> and used for ride matching.</p>

            <input className="driver-home-modal-input" value={destinationDraft} onChange={(event) => setDestinationDraft(event.target.value)} placeholder="Example: Malabe" />

            {destinationError ? <div className="driver-home-modal-error">{destinationError}</div> : null}

            <div className="driver-home-modal-actions">
              <button type="button" className="driver-btn-secondary" onClick={() => setDestinationModalOpen(false)}>Close</button>
              <button type="button" className="driver-btn-primary" disabled={destinationBusy} onClick={handleSaveDestination}>
                {destinationBusy ? "Saving..." : "Save destination"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}