import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";

import DriverLayout from "../../components/driver/DriverLayout";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const FALLBACK_CENTER = [6.9068, 79.8706];

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);

  return null;
}

function calcDistanceKm(a, b) {
  if (!a || !b) return 0;

  const toRad = (value) => (value * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function DirectionalHire() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLabel, setDestinationLabel] = useState("");
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    locateDriver();
  }, []);

  function locateDriver() {
    setLoadingLocation(true);
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser. Showing fallback map area.");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        setLoadingLocation(false);
      },
      () => {
        setGeoError("Location access failed. Showing fallback map area.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const routePoints = useMemo(() => {
    if (!currentLocation || !destinationPoint) return [];
    return [currentLocation, destinationPoint];
  }, [currentLocation, destinationPoint]);

  const distanceKm = useMemo(
    () => calcDistanceKm(currentLocation, destinationPoint),
    [currentLocation, destinationPoint]
  );

  const roughEtaMinutes = useMemo(() => {
    if (!distanceKm) return 0;
    return Math.max(6, Math.round((distanceKm / 28) * 60));
  }, [distanceKm]);

  const matchedPassengers = useMemo(() => {
    const destinationName = destinationLabel || "your selected route";

    return [
      {
        id: "mp1",
        name: "Kavindu",
        pickup: "Malabe Campus Gate",
        drop: destinationName,
        seats: 1,
        fare: "LKR 280",
        match: "92%"
      },
      {
        id: "mp2",
        name: "Ayesha",
        pickup: "Kaduwela Junction",
        drop: destinationName,
        seats: 2,
        fare: "LKR 450",
        match: "88%"
      },
      {
        id: "mp3",
        name: "Dineth",
        pickup: "Town bus stand",
        drop: destinationName,
        seats: 1,
        fare: "LKR 240",
        match: "81%"
      }
    ];
  }, [destinationLabel]);

  const focusCenter = destinationPoint || currentLocation || FALLBACK_CENTER;

  return (
    <DriverLayout
      title="Directional Hire"
      subtitle="Set a destination, pin it on the map, preview a route line, and view matched passenger requests without changing your backend."
      actions={
        <>
          <button type="button" onClick={locateDriver} className="driver-btn-secondary">
            Refresh my location
          </button>
          <button
            type="button"
            onClick={() => {
              setDestinationLabel("");
              setDestinationPoint(null);
            }}
            className="driver-btn-primary"
          >
            Clear route
          </button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location status</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">
            {loadingLocation ? "Detecting..." : currentLocation ? "Live" : "Fallback"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {currentLocation ? "Driver marker is active on the map." : "Waiting for permission or using default center."}
          </div>
        </div>

        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Destination pin</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">
            {destinationPoint ? "Placed" : "Not set"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Click on the map to place the route endpoint.
          </div>
        </div>

        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preview distance</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">
            {distanceKm ? `${distanceKm.toFixed(1)} km` : "--"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Straight-line preview until live routing is connected.
          </div>
        </div>

        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Estimated ETA</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">
            {roughEtaMinutes ? `${roughEtaMinutes} min` : "--"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Based on a simple UI estimate only.
          </div>
        </div>
      </div>

      {geoError ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {geoError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <section className="driver-card overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-bold text-slate-950">Live route map</div>
              <div className="text-sm text-slate-500">
                Click anywhere on the map to place the destination marker and draw a preview line.
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              OpenStreetMap + Leaflet
            </div>
          </div>

          <div className="directional-map">
            <MapContainer center={focusCenter} zoom={13} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler onPick={setDestinationPoint} />
              <RecenterMap center={focusCenter} />

              {currentLocation ? (
                <>
                  <Marker position={currentLocation}>
                    <Popup>You are here</Popup>
                  </Marker>
                  <Circle
                    center={currentLocation}
                    radius={120}
                    pathOptions={{ color: "#10b981", fillColor: "#6ee7b7", fillOpacity: 0.25 }}
                  />
                </>
              ) : null}

              {destinationPoint ? (
                <Marker position={destinationPoint}>
                  <Popup>{destinationLabel || "Selected destination"}</Popup>
                </Marker>
              ) : null}

              {destinationPoint ? (
                <Circle
                  center={destinationPoint}
                  radius={160}
                  pathOptions={{ color: "#0f172a", fillColor: "#cbd5e1", fillOpacity: 0.16 }}
                />
              ) : null}

              {routePoints.length === 2 ? (
                <Polyline
                  positions={routePoints}
                  pathOptions={{ color: "#16a34a", weight: 5, opacity: 0.85, dashArray: "10, 10" }}
                />
              ) : null}
            </MapContainer>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="driver-card p-5">
            <div className="text-lg font-bold text-slate-950">Route controls</div>
            <div className="mt-1 text-sm text-slate-500">
              Keep the backend untouched and use this as a frontend-only planning screen.
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Destination label</label>
                <input
                  className="driver-input"
                  value={destinationLabel}
                  onChange={(e) => setDestinationLabel(e.target.value)}
                  placeholder="Ex: Kaduwela, Nugegoda, City Center"
                />
              </div>

              <div className="driver-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">Map instruction</div>
                <div className="mt-1 text-sm text-slate-500">
                  Click on the map to drop the destination marker. The route line will render automatically.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current point</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {currentLocation ? `${currentLocation[0].toFixed(5)}, ${currentLocation[1].toFixed(5)}` : "Not available"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Destination point</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {destinationPoint ? `${destinationPoint[0].toFixed(5)}, ${destinationPoint[1].toFixed(5)}` : "Click map to set"}
                  </div>
                </div>
              </div>

              <button type="button" className="driver-btn-accent w-full">
                Publish directional hire
              </button>
            </div>
          </section>

          <section className="driver-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-slate-950">Matched passengers</div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                UI placeholder
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {matchedPassengers.map((passenger) => (
                <div key={passenger.id} className="rounded-[24px] border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{passenger.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {passenger.pickup} → {passenger.drop}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {passenger.match}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Seats</div>
                      <div className="mt-1 font-semibold text-slate-900">{passenger.seats}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Fare</div>
                      <div className="mt-1 font-semibold text-slate-900">{passenger.fare}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Status</div>
                      <div className="mt-1 font-semibold text-emerald-700">Ready</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button type="button" className="driver-btn-primary flex-1">
                      View
                    </button>
                    <button type="button" className="driver-btn-secondary flex-1">
                      Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </DriverLayout>
  );
}