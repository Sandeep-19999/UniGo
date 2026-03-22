import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const FALLBACK_CENTER = [6.9068, 79.8706]; // Colombo/Kaduwela area fallback

const liveDriverIcon = L.divIcon({
  className: "driver-live-marker-wrapper",
  html: `<div class="driver-live-marker-core"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapBridge({ mapRef, center, followMe }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [mapRef, map]);

  useEffect(() => {
    if (center && followMe) {
      map.flyTo(center, 16, { duration: 1.2 });
    }
  }, [center, followMe, map]);

  return null;
}

function formatMoney(value) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(date) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("en-LK", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function initials(name = "Driver") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("");
}

export default function LiveDriverMap({
  driverName = "Driver",
  earningsTotal = 0,
}) {
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  const [isOnline, setIsOnline] = useState(true);
  const [followMe, setFollowMe] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [geoError, setGeoError] = useState("");

  const center = currentPosition || FALLBACK_CENTER;

  useEffect(() => {
    function stopTracking() {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    function startTracking() {
      if (!navigator.geolocation) {
        setGeoError("Geolocation is not supported in this browser.");
        return;
      }

      setGeoError("");

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setCurrentPosition([lat, lng]);
          setAccuracy(position.coords.accuracy || null);

          const rawSpeed = position.coords.speed;
          const kmh = rawSpeed && rawSpeed > 0 ? rawSpeed * 3.6 : 0;
          setSpeedKmh(kmh);

          setLastUpdated(new Date());
        },
        () => {
          setGeoError("Could not get live location. Please allow location access.");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    }

    stopTracking();

    if (isOnline) {
      startTracking();
    }

    return () => stopTracking();
  }, [isOnline]);

  const coordinateText = useMemo(() => {
    if (!currentPosition) return "Waiting for location...";
    return `${currentPosition[0].toFixed(5)}, ${currentPosition[1].toFixed(5)}`;
  }, [currentPosition]);

  function handleRecenter() {
    if (mapRef.current && currentPosition) {
      mapRef.current.flyTo(currentPosition, 16, { duration: 1.2 });
    }
  }

  return (
    <div className="driver-map-shell">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        className="driver-live-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBridge mapRef={mapRef} center={center} followMe={followMe} />

        {currentPosition ? (
          <>
            <Marker position={currentPosition} icon={liveDriverIcon} />
            <Circle
              center={currentPosition}
              radius={accuracy || 80}
              pathOptions={{
                color: "#facc15",
                fillColor: "#facc15",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          </>
        ) : null}
      </MapContainer>

      <div className="driver-map-fade" />

      <div className="driver-map-floating driver-map-top-left">
        <div className="driver-map-profile">
          <div className="driver-map-avatar">{initials(driverName)}</div>
          <div>
            <div className="driver-map-profile-name">{driverName}</div>
            <div className="driver-map-profile-sub">
              {isOnline ? "Online now" : "Offline"}
            </div>
          </div>
        </div>
      </div>

      <div className="driver-map-floating driver-map-top-center">
        <div className="driver-map-earnings">
          <div className="driver-map-earnings-amount">{formatMoney(earningsTotal)}</div>
          <div className="driver-map-earnings-sub">Today • {formatTime(lastUpdated)}</div>
        </div>
      </div>

      <div className="driver-map-floating driver-map-top-right">
        <button
          type="button"
          className="driver-map-round-btn"
          onClick={() => setFollowMe((v) => !v)}
          title="Toggle follow mode"
        >
          {followMe ? "◎" : "◌"}
        </button>
      </div>

      <div className="driver-map-floating driver-map-bottom-left">
        <div className="driver-map-info-card">
          <div className="driver-map-info-row">
            <span>Status</span>
            <strong>{isOnline ? "Tracking" : "Paused"}</strong>
          </div>
          <div className="driver-map-info-row">
            <span>Speed</span>
            <strong>{speedKmh ? `${Math.round(speedKmh)} km/h` : "0 km/h"}</strong>
          </div>
          <div className="driver-map-info-row">
            <span>Location</span>
            <strong className="driver-map-coords">{coordinateText}</strong>
          </div>
          {geoError ? <div className="driver-map-error">{geoError}</div> : null}
        </div>
      </div>

      <div className="driver-map-floating driver-map-bottom-right">
        <button type="button" className="driver-map-recenter-btn" onClick={handleRecenter}>
          Re-center
        </button>
      </div>

      <div className="driver-map-floating driver-map-bottom-center">
        <button
          type="button"
          className={`driver-map-online-btn ${isOnline ? "online" : "offline"}`}
          onClick={() => setIsOnline((v) => !v)}
        >
          <span className="driver-map-power-icon">⏻</span>
          {isOnline ? "Go offline" : "Go online"}
        </button>
      </div>
    </div>
  );
}