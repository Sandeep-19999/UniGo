import "../../../styles/driverRideDashboard.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../../../api/axios";
import RideStepProgress from "../../../components/driver/RideStepProgress";
import { useAuth } from "../../../context/AuthContext";

const FALLBACK_CENTER = [6.9068, 79.8706];
const DESKTOP_BREAKPOINT = 1100;
const DESKTOP_PANEL_WIDTH = 470;
const DESKTOP_FOCUS_OFFSET_X = 110;

const driverCarIcon = L.divIcon({
  className: "",
  html: '<div style="font-size:29px;line-height:1;filter:drop-shadow(0 8px 14px rgba(15,23,42,0.24));">🚗</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const routePinIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:34px;height:46px;display:flex;align-items:flex-start;justify-content:center;filter:drop-shadow(0 10px 14px rgba(15,23,42,0.22));">
      <div style="width:30px;height:30px;border-radius:999px;background:#22c55e;border:3px solid #ffffff;"></div>
      <div style="position:absolute;top:23px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:14px solid #22c55e;"></div>
      <div style="position:absolute;top:11px;width:8px;height:8px;border-radius:999px;background:#ffffff;"></div>
    </div>
  `,
  iconSize: [34, 46],
  iconAnchor: [17, 43]
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

function isDesktopLayout() {
  return typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT;
}

function getDashboardZoom() {
  return isDesktopLayout() ? 11 : 12;
}

function getShiftedCenter(map, targetCenter, offsetX = 0, offsetY = 0) {
  if (!map || !targetCenter) return targetCenter;
  const zoom = map.getZoom() || getDashboardZoom();
  const projectedPoint = map.project(targetCenter, zoom);
  const shiftedPoint = projectedPoint.subtract([offsetX, offsetY]);
  return map.unproject(shiftedPoint, zoom);
}

function focusDashboardMap(map, { driverPosition, targetPosition, followMe = true, animate = true } = {}) {
  if (!map || !followMe) return;

  const primaryPoint = driverPosition || targetPosition || FALLBACK_CENTER;
  if (!primaryPoint) return;

  const hasRoute = Boolean(driverPosition && targetPosition);
  const options = animate ? { animate: true, duration: 1.1 } : { animate: false };

  if (hasRoute) {
    map.fitBounds([driverPosition, targetPosition], {
      paddingTopLeft: isDesktopLayout() ? [DESKTOP_PANEL_WIDTH + 54, 170] : [28, 160],
      paddingBottomRight: [90, 180],
      maxZoom: 12,
      ...options
    });
    return;
  }

  const shifted = isDesktopLayout()
    ? getShiftedCenter(map, primaryPoint, DESKTOP_FOCUS_OFFSET_X, 0)
    : primaryPoint;

  map.flyTo(shifted, getDashboardZoom(), { duration: animate ? 1.05 : 0 });
}

function DashboardMapBridge({ driverPosition, targetPosition, followMe, mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;

    const handleResize = () => {
      map.invalidateSize();
      focusDashboardMap(map, { driverPosition, targetPosition, followMe, animate: false });
    };

    window.addEventListener("resize", handleResize);

    setTimeout(() => {
      map.invalidateSize();
      focusDashboardMap(map, { driverPosition, targetPosition, followMe, animate: false });
    }, 140);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [map, mapRef, driverPosition, targetPosition, followMe]);

  useEffect(() => {
    focusDashboardMap(map, { driverPosition, targetPosition, followMe });
  }, [driverPosition, targetPosition, followMe, map]);

  return null;
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.latitude, position.coords.longitude]),
      () => reject(new Error("Location access failed. Please allow browser location.")),
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

function extractAvailabilityLocation(availability) {
  const point = availability?.currentLocation;
  if (point?.lat == null || point?.lng == null) return null;
  return [Number(point.lat), Number(point.lng)];
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastLocationSyncRef = useRef(0);

  const [isOnline, setIsOnline] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [profile, setProfile] = useState({
    driverCurrentDestination: "",
    driverCurrentDestinationUpdatedAt: null
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
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

  useEffect(() => {
    setProfilePhotoFailed(false);
  }, [profilePhotoUrl]);


  const activeRide = useMemo(
    () => acceptedRequests.find((ride) => ["accepted", "started"].includes(ride.status)) || null,
    [acceptedRequests]
  );

  const targetMarkerPosition = useMemo(() => {
    const live = activeRide?.passengerLiveLocation;
    if (live?.lat != null && live?.lng != null) return [live.lat, live.lng];
    const pickup = activeRide?.pickupCoords;
    if (pickup?.lat != null && pickup?.lng != null) return [pickup.lat, pickup.lng];
    const drop = activeRide?.dropCoords;
    if (drop?.lat != null && drop?.lng != null) return [drop.lat, drop.lng];
    return null;
  }, [activeRide]);

  const routeLinePoints = useMemo(() => {
    if (!position || !targetMarkerPosition) return [];
    return [position, targetMarkerPosition];
  }, [position, targetMarkerPosition]);

  const rideMetrics = useMemo(
    () => computeRideMetrics(acceptedRequests, earningsSummary),
    [acceptedRequests, earningsSummary]
  );

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

      const serverLocation = extractAvailabilityLocation(availability);
      if (serverLocation) {
        setPosition((current) => current || serverLocation);
      }

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
    }, 8000);

    return () => clearInterval(timer);
  }, [loadDashboardData]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { data } = await api.get("/driver/onboarding/detail");
        if (!isMounted) return;

        const documents = Array.isArray(data?.documents) ? data.documents : [];
        const profilePhoto = documents.find((item) => item.documentType === "profile_photo");
        setProfilePhotoUrl(profilePhoto?.fileUrl || "");
      } catch {
        if (isMounted) setProfilePhotoUrl("");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const mapCenter = position || targetMarkerPosition || FALLBACK_CENTER;

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
    if (toggleBusy) return;

    setActionError("");
    setGeoError("");
    setToggleBusy(true);

    try {
      if (isOnline) {
        await api.patch("/driver/availability/go-offline");
        setIsOnline(false);
        await loadDashboardData({ silent: true });
        return;
      }

      if (!currentDestination) {
        setDestinationModalOpen(true);
        setActionError("Save your current destination before going online.");
        return;
      }

      const current = position || (await getBrowserLocation());
      setPosition(current);

      await api.post("/driver/availability/go-online", {
        currentLocation: { lat: current[0], lng: current[1] }
      });

      setIsOnline(true);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setActionError(error?.response?.data?.message || error.message || "Failed to update online status.");
    } finally {
      setToggleBusy(false);
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
    focusDashboardMap(mapRef.current, {
      driverPosition: position,
      targetPosition: targetMarkerPosition,
      followMe: true
    });
  }

  const powerLabel = toggleBusy
    ? isOnline
      ? "Going offline..."
      : "Going online..."
    : isOnline
      ? "Tap to go offline"
      : "Tap to go online";

  if (loadingState) {
    return <div className="driver-v2-loading">Loading driver dashboard...</div>;
  }

  return (
    <div className="driver-v2-screen">
      <MapContainer
        center={mapCenter}
        zoom={getDashboardZoom()}
        scrollWheelZoom
        zoomControl={false}
        className="driver-v2-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DashboardMapBridge
          driverPosition={position}
          targetPosition={targetMarkerPosition}
          followMe={followMe}
          mapRef={mapRef}
        />

        {routeLinePoints.length === 2 ? (
          <Polyline
            positions={routeLinePoints}
            pathOptions={{ color: "#d946ef", weight: 7, opacity: 0.56, lineCap: "round" }}
          />
        ) : null}

        {position ? (
          <Marker position={position} icon={driverCarIcon}>
            <Popup>You are here</Popup>
          </Marker>
        ) : null}

        {targetMarkerPosition ? (
          <Marker position={targetMarkerPosition} icon={routePinIcon}>
            <Popup>{activeRide?.passenger?.name || "Ride target"}</Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="driver-v2-map-glow" />

      <div className="driver-v2-topbar">
        <div className="driver-v2-avatar-pill">
          <div className="driver-v2-avatar">
            {profilePhotoUrl && !profilePhotoFailed ? (
              <img
                src={profilePhotoUrl}
                alt={user?.name || "Driver"}
                className="driver-v2-avatar-image"
                onError={() => setProfilePhotoFailed(true)}
              />
            ) : (
              initials(user?.name || "Driver")
            )}
          </div>
        </div>

        <div className="driver-v2-earnings-pill">
          <span className="driver-v2-earnings-label">Total earnings</span>
          <strong>{formatMoney(rideMetrics.totalEarnings)}</strong>
        </div>
      </div>

      <div className="driver-v2-destination-pill">
        <span className="driver-v2-destination-label">Destination</span>
        <strong>{currentDestination || "Not saved yet"}</strong>
      </div>

      <div className="driver-v2-fab-stack">
        <button
          type="button"
          className={`driver-v2-fab ${followMe ? "is-active" : ""}`}
          onClick={() => setFollowMe((prev) => !prev)}
          title={followMe ? "Follow mode on" : "Follow mode off"}
        >
          {followMe ? "◎" : "◌"}
        </button>

        <button type="button" className="driver-v2-fab" onClick={recenterMap} title="Re-center map">
          ⌖
        </button>
      </div>

      <div className="driver-v2-panel">
        <div className="driver-v2-panel-handle" />

        <div className={`driver-v2-status-row ${isOnline ? "online" : "offline"}`}>
          <div className="driver-v2-status-main">
            <span className="driver-v2-status-dot" />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
          <button type="button" className="driver-v2-edit-chip" onClick={() => setDestinationModalOpen(true)}>
            Edit route
          </button>
        </div>

        <div className="driver-v2-nav-grid">
          <Link to="/driver/dashboard" className="driver-v2-nav-card is-active">
            <span className="driver-v2-nav-icon">⌂</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/driver/history" className="driver-v2-nav-card">
            <span className="driver-v2-nav-icon">◔</span>
            <span>Ride History</span>
          </Link>
          <Link to="/driver/cashout" className="driver-v2-nav-card">
            <span className="driver-v2-nav-icon">₨</span>
            <span>Cashout</span>
          </Link>
        </div>

        <div className="driver-v2-stats-grid">
          <div className="driver-v2-stat-card">
            <span>Active rides</span>
            <strong>{rideMetrics.activeRideCount}</strong>
          </div>
          <div className="driver-v2-stat-card">
            <span>Completed</span>
            <strong>{rideMetrics.totalCompletedRides}</strong>
          </div>
          <div className="driver-v2-stat-card is-strong">
            <span>Available</span>
            <strong>{formatMoney(rideMetrics.availableBalance)}</strong>
          </div>
        </div>

        <div className="driver-v2-card-stack">
          <section className="driver-v2-card">
            <div className="driver-v2-card-head">
              <div>
                <div className="driver-v2-kicker">Driver route</div>
                <h3>{currentDestination || "Destination not saved yet"}</h3>
                <p>Your destination is used to match only the rides that align with your current route.</p>
              </div>
            </div>
          </section>

          {activeRide ? (
            <section className="driver-v2-card">
              <div className="driver-v2-card-head">
                <div>
                  <div className="driver-v2-kicker">Active trip</div>
                  <h3>{activeRide.passenger?.name || "Passenger"}</h3>
                  <p>
                    {activeRide.pickupLocation} → {activeRide.dropLocation}
                  </p>
                </div>
                <div className="driver-v2-fare-pill">
                  {formatMoney(activeRide.finalFare ?? activeRide.estimatedFare ?? activeRide.estimatedPrice ?? 0)}
                </div>
              </div>

              <div className="driver-v2-info-grid">
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

              <div className="driver-v2-progress-wrap">
                <RideStepProgress
                  currentStep={activeRide.driverJourneyStep || "assigned"}
                  busy={progressBusy}
                  onAdvance={handleAdvanceStep}
                />
              </div>

              {activeRide.status !== "completed" ? (
                <div className="driver-v2-actions">
                  <button
                    type="button"
                    className="driver-btn-secondary"
                    onClick={handleCancelActiveRide}
                    disabled={progressBusy}
                  >
                    {progressBusy ? "Updating..." : "Cancel ride"}
                  </button>
                  <Link to="/driver/cashout" className="driver-btn-primary">
                    View earnings
                  </Link>
                </div>
              ) : null}
            </section>
          ) : matchedRequests.length > 0 ? (
            <div className="driver-v2-request-list">
              {matchedRequests.slice(0, 2).map((item) => (
                <section key={item.rideRequest._id} className="driver-v2-card">
                  <div className="driver-v2-card-head">
                    <div>
                      <div className="driver-v2-kicker">Matched ride request</div>
                      <h3>{item.rideRequest.passenger?.name || "Passenger"}</h3>
                    </div>
                    <div className="driver-v2-distance-pill">{formatDistance(item.myMatch?.pickupDistanceKm)}</div>
                  </div>

                  <div className="driver-v2-info-grid">
                    <div>
                      <span>Pickup</span>
                      <strong>{item.rideRequest.pickupLocation}</strong>
                    </div>
                    <div>
                      <span>Drop</span>
                      <strong>{item.rideRequest.dropLocation}</strong>
                    </div>
                    <div>
                      <span>Estimated fare</span>
                      <strong>{formatMoney(item.rideRequest.estimatedFare ?? item.rideRequest.estimatedPrice ?? 0)}</strong>
                    </div>
                    <div>
                      <span>Seats</span>
                      <strong>{Number(item.rideRequest.numberOfSeats || 0) || "Any"}</strong>
                    </div>
                  </div>

                  <div className="driver-v2-actions">
                    <button
                      type="button"
                      className="driver-btn-primary"
                      disabled={requestBusyId === item.rideRequest._id}
                      onClick={() => handleAcceptRequest(item)}
                    >
                      {requestBusyId === item.rideRequest._id ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      className="driver-btn-secondary"
                      disabled={requestBusyId === item.rideRequest._id}
                      onClick={() => handleRejectRequest(item)}
                    >
                      {requestBusyId === item.rideRequest._id ? "Updating..." : "Reject"}
                    </button>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <section className="driver-v2-card">
              <div className="driver-v2-kicker">Ride queue</div>
              <h3 className="driver-v2-empty-title">No matched ride requests yet</h3>
              <p className="driver-v2-empty-copy">
                Go online with your saved destination. Matching runs only when the passenger drop location matches your current destination.
              </p>
            </section>
          )}
        </div>

        {geoError ? <div className="driver-v2-error">{geoError}</div> : null}
        {actionError ? <div className="driver-v2-error">{actionError}</div> : null}
      </div>

      <div className="driver-v2-power-wrap">
        <div className={`driver-v2-power-hint ${isOnline ? "online" : "offline"}`}>
          <span className="driver-v2-power-hint-dot" />
          <span>{powerLabel}</span>
        </div>

        <button
          type="button"
          className={`driver-v2-power-btn ${isOnline ? "is-online" : "is-offline"} ${toggleBusy ? "is-busy" : ""}`}
          onClick={handleToggleOnline}
          disabled={toggleBusy}
          title={isOnline ? "Go offline" : "Go online"}
        >
          <span className="driver-v2-power-btn-main">{toggleBusy ? "..." : isOnline ? "Off" : "Go"}</span>
          <span className="driver-v2-power-btn-sub">{isOnline ? "Online now" : "Offline now"}</span>
        </button>
      </div>

      {destinationModalOpen ? (
        <div className="driver-v2-modal-backdrop">
          <div className="driver-v2-modal">
            <div className="driver-v2-modal-kicker">Where are you going?</div>
            <h2>Save driver destination</h2>
            <p>
              Enter the destination you are heading to. This is saved as <strong>driverCurrentDestination</strong> and used for ride matching.
            </p>

            <input
              className="driver-v2-modal-input"
              value={destinationDraft}
              onChange={(event) => setDestinationDraft(event.target.value)}
              placeholder="Example: Malabe"
            />

            {destinationError ? <div className="driver-v2-modal-error">{destinationError}</div> : null}

            <div className="driver-v2-modal-actions">
              <button type="button" className="driver-btn-secondary" onClick={() => setDestinationModalOpen(false)}>
                Close
              </button>
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
