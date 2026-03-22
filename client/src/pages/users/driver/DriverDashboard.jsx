import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { api } from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

const FALLBACK_CENTER = [6.9068, 79.8706];

const driverHomeIcon = L.divIcon({
  className: "driver-home-marker-wrap",
  html: `
    <div class="driver-home-marker-pin">
      <div class="driver-home-marker-arrow"></div>
    </div>
  `,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

function formatMoney(value) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

export default function DriverDashboard() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  const [isOnline, setIsOnline] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalCompletedRides: 0 });
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const [earningsRes, ridesRes] = await Promise.all([
          api.get("/driver/rides/earnings/summary", { signal: controller.signal }),
          api.get("/driver/rides", { signal: controller.signal }),
        ]);

        setEarnings(earningsRes.data || { totalEarnings: 0, totalCompletedRides: 0 });
        setRides(ridesRes.data?.rides || []);
      } catch {
        // keep UI alive even if dashboard stats fail
      }
    })();

    return () => controller.abort();
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
      return;
    }

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoError("");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setGeoError("Location access failed. Please allow browser location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return stopTracking;
  }, [isOnline]);

  const center = position || FALLBACK_CENTER;

  const activeRideCount = useMemo(
    () => rides.filter((ride) => ["pending", "ongoing"].includes(ride.status)).length,
    [rides]
  );

  function recenterMap() {
    if (mapRef.current && position) {
      mapRef.current.flyTo(position, 14, { duration: 1.1 });
    }
  }

  return (
    <div className="driver-home-screen">
      <MapContainer center={center} zoom={8} scrollWheelZoom className="driver-home-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DashboardMapBridge center={center} followMe={followMe} mapRef={mapRef} />

        {position ? <Marker position={position} icon={driverHomeIcon} /> : null}
      </MapContainer>

      <div className="driver-home-topbar">
        <div className="driver-home-avatar-pill">
          <div className="driver-home-avatar">{initials(user?.name || "Driver")}</div>
        </div>

        <div className="driver-home-earnings-pill">{formatMoney(earnings.totalEarnings || 0)}</div>
      </div>

      <div className="driver-home-right-buttons">
        <button
          type="button"
          className="driver-home-fab"
          onClick={() => setFollowMe((prev) => !prev)}
          title="Toggle follow mode"
        >
          {followMe ? "◎" : "◌"}
        </button>

        <button
          type="button"
          className="driver-home-fab"
          onClick={recenterMap}
          title="Re-center"
        >
          ⌖
        </button>
      </div>

      <div className="driver-home-go-wrap">
        <button
          type="button"
          className={`driver-home-go-btn ${isOnline ? "is-online" : ""}`}
          onClick={() => setIsOnline((prev) => !prev)}
        >
          {isOnline ? "On" : "Go"}
        </button>
      </div>

      <div className="driver-home-sheet">
        <div className="driver-home-sheet-handle" />

        <div className={`driver-home-sheet-status ${isOnline ? "online" : "offline"}`}>
          <span className="driver-home-status-dot" />
          {isOnline ? "Online" : "Offline"}
        </div>

        <div className="driver-home-sheet-links">
          <Link to="/driver/rides" className="driver-home-sheet-link">
            Rides
          </Link>
          <Link to="/driver/vehicles" className="driver-home-sheet-link">
            Vehicles
          </Link>
          <Link to="/driver/history" className="driver-home-sheet-link">
            History
          </Link>
          <Link to="/driver/directional-hire" className="driver-home-sheet-link">
            Hire
          </Link>
        </div>

        <div className="driver-home-mini-stats">
          <div className="driver-home-mini-card">
            <span>Active rides</span>
            <strong>{activeRideCount}</strong>
          </div>
          <div className="driver-home-mini-card">
            <span>Completed</span>
            <strong>{earnings.totalCompletedRides || 0}</strong>
          </div>
        </div>

        {geoError ? <div className="driver-home-error">{geoError}</div> : null}
      </div>
    </div>
  );
}