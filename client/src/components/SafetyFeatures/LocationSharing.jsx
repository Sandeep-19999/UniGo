import { useEffect, useRef, useState } from "react";
import { api } from "../../api/axios";

export default function LocationSharing() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [showLocationActions, setShowLocationActions] = useState(false);
  const [locationUrl, setLocationUrl] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [lastSeenAt, setLastSeenAt] = useState("");
  const [accuracyMeters, setAccuracyMeters] = useState(null);

  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);

  function clearLiveTracking() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  }

  async function handlePositionUpdate(position, options = {}) {
    const { forceSend = false, showActions = true } = options;
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = Number.isFinite(position.coords.accuracy)
      ? Math.round(position.coords.accuracy)
      : null;

    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    setLocationUrl(mapsUrl);
    setLocationLabel(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    setLastSeenAt(new Date().toLocaleTimeString());
    setAccuracyMeters(accuracy);

    if (showActions) {
      setShowLocationActions(true);
    }

    const now = Date.now();
    const throttleMs = 10000;
    if (!forceSend && now - lastSentAtRef.current < throttleMs) {
      return;
    }

    await api.post("/safety/location/update", {
      latitude,
      longitude,
      address: "Live browser location",
    });
    lastSentAtRef.current = now;
    setStatus("Live location updated.");
  }

  function handleGeolocationError(error) {
    if (error?.code === 1) {
      setStatus("Location permission denied. Please allow location access.");
      return;
    }
    if (error?.code === 2 || error?.code === 3) {
      setStatus("Unable to access your location right now.");
      return;
    }
    setStatus("Failed to read current location.");
  }

  async function updateLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported in this browser.");
      return;
    }

    setBusy(true);
    setStatus("Reading current location...");

    try {
      const position = await getCurrentPosition();
      await handlePositionUpdate(position, { forceSend: true, showActions: true });
      setStatus("Current location captured.");
    } catch (e) {
      if (e?.response) {
        setStatus(e?.response?.data?.message || "Failed to update location.");
      } else {
        handleGeolocationError(e);
      }
    } finally {
      setBusy(false);
    }
  }

  async function startLiveTracking() {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported in this browser.");
      return;
    }

    clearLiveTracking();
    setStatus("Starting live location detection...");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handlePositionUpdate(position, { forceSend: false, showActions: true }).catch((err) => {
          setStatus(err?.response?.data?.message || "Failed to send live location update.");
        });
      },
      (error) => {
        handleGeolocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    try {
      const initialPosition = await getCurrentPosition();
      await handlePositionUpdate(initialPosition, { forceSend: true, showActions: true });
      setStatus("Live tracking enabled. Your real-time location is being shared.");
    } catch (e) {
      if (e?.response) {
        setStatus(e?.response?.data?.message || "Failed to send initial live location.");
      } else {
        handleGeolocationError(e);
      }
    }
  }

  async function copyLocationUrl() {
    if (!locationUrl) return;
    try {
      await navigator.clipboard.writeText(locationUrl);
      setStatus("Location URL copied to clipboard.");
    } catch {
      setStatus("Could not copy location URL. Please copy manually.");
    }
  }

  async function shareLocation() {
    if (!locationUrl) return;
    if (!navigator.share) {
      setStatus("Share is not supported in this browser. Use Copy URL instead.");
      return;
    }

    try {
      await navigator.share({
        title: "My Current Location",
        text: "Here is my live location.",
        url: locationUrl,
      });
      setStatus("Location shared successfully.");
    } catch {
      setStatus("Location sharing was cancelled or failed.");
    }
  }

  async function toggleSharing(nextEnabled) {
    setBusy(true);
    try {
      if (nextEnabled) {
        await api.post("/safety/location/sharing/enable", { shareWith: "Both" });
        setStatus("Location sharing enabled.");
      } else {
        await api.post("/safety/location/sharing/disable");
        clearLiveTracking();
        setStatus("Location sharing disabled.");
      }
      setEnabled(nextEnabled);
    } catch (e) {
      setStatus(e?.response?.data?.message || "Failed to change location sharing state.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!enabled) {
      clearLiveTracking();
      return;
    }

    startLiveTracking();
    return () => {
      clearLiveTracking();
    };
  }, [enabled]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">Location Sharing</h3>
      <p className="mt-1 text-sm text-slate-600">Enable live location updates for safer rides.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={busy || enabled}
          onClick={() => toggleSharing(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Enable Sharing
        </button>
        <button
          disabled={busy || !enabled}
          onClick={() => toggleSharing(false)}
          className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Disable Sharing
        </button>
        <button
          disabled={busy}
          onClick={updateLocation}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Send Current Location
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-700">Current state: {enabled ? "Enabled" : "Disabled"}</p>
      {status ? <p className="mt-2 text-sm text-slate-600">{status}</p> : null}
      {lastSeenAt ? (
        <p className="mt-1 text-xs text-slate-500">
          Last detected: {lastSeenAt}
          {accuracyMeters !== null ? ` (accuracy: ${accuracyMeters}m)` : ""}
        </p>
      ) : null}

      {showLocationActions ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Current location ready</p>
          <p className="mt-1 text-xs text-slate-600">{locationLabel}</p>
          <p className="mt-2 break-all text-xs text-slate-500">{locationUrl}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={copyLocationUrl}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Copy Location URL
            </button>
            <button
              onClick={shareLocation}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Share Location
            </button>
            <a
              href={locationUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Open Map
            </a>
            <button
              onClick={() => setShowLocationActions(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
