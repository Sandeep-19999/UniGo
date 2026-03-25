import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default Leaflet marker icons in Vite/React builds.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [6.9271, 79.8612];
const DEFAULT_ZOOM = 15;

function MapClickHandler({ pickupCoords, dropCoords, setPickupCoords, setDropCoords }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      const clickedPoint = { lat, lng };

      if (!pickupCoords) {
        setPickupCoords(clickedPoint);
        return;
      }

      if (!dropCoords) {
        setDropCoords(clickedPoint);
        return;
      }

      // Third click clears both points; next click starts with pickup again.
      setPickupCoords(null);
      setDropCoords(null);
    },
  });

  return null;
}

function RoutingMachine({ pickupCoords, dropCoords, onRouteCalculated }) {
  const map = useMap();

  useEffect(() => {
    if (!pickupCoords || !dropCoords) {
      if (typeof onRouteCalculated === "function") {
        onRouteCalculated(null);
      }
      return undefined;
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickupCoords.lat, pickupCoords.lng),
        L.latLng(dropCoords.lat, dropCoords.lng),
      ],
      lineOptions: {
        styles: [{ color: "#2563eb", opacity: 0.9, weight: 6 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null,
    }).addTo(map);

    routingControl.on("routesfound", (event) => {
      const route = event.routes?.[0];
      const summary = route?.summary;

      if (!summary || typeof onRouteCalculated !== "function") {
        return;
      }

      const distanceKm = Number((summary.totalDistance / 1000).toFixed(2));
      const timeMin = Math.round(summary.totalTime / 60);

      onRouteCalculated({ distanceKm, timeMin });
    });

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, pickupCoords, dropCoords, onRouteCalculated]);

  return null;
}

function MapViewportUpdater({ pickupCoords, dropCoords }) {
  const map = useMap();

  useEffect(() => {
    if (pickupCoords && !dropCoords) {
      map.flyTo([pickupCoords.lat, pickupCoords.lng], DEFAULT_ZOOM);
      return;
    }

    if (!pickupCoords && dropCoords) {
      map.flyTo([dropCoords.lat, dropCoords.lng], DEFAULT_ZOOM);
    }
  }, [map, pickupCoords, dropCoords]);

  return null;
}

export default function RideMap({
  pickupCoords,
  dropCoords,
  setPickupCoords,
  setDropCoords,
  onRouteCalculated,
}) {
  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler
              pickupCoords={pickupCoords}
              dropCoords={dropCoords}
              setPickupCoords={setPickupCoords}
              setDropCoords={setDropCoords}
            />

            <RoutingMachine
              pickupCoords={pickupCoords}
              dropCoords={dropCoords}
              onRouteCalculated={onRouteCalculated}
            />

            <MapViewportUpdater pickupCoords={pickupCoords} dropCoords={dropCoords} />

            {pickupCoords && (
              <Marker position={[pickupCoords.lat, pickupCoords.lng]}>
                <Popup>Pickup Location</Popup>
              </Marker>
            )}

            {dropCoords && (
              <Marker position={[dropCoords.lat, dropCoords.lng]}>
                <Popup>Drop Location</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Instructions Overlay */}
          <div className="absolute top-3 left-3 bg-white rounded-lg shadow-md px-3 py-2 z-500 max-w-xs">
            <p className="text-xs text-gray-700 font-medium">
              {!dropCoords && pickupCoords && "Click map for drop location"}
              {dropCoords && "✓ Both locations set"}
              {!pickupCoords && "Set pickup location first"}
            </p>
          </div>
        </div>
      </div>

      {/* Drop Location Coordinates Display */}
      {dropCoords && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-indigo-700 uppercase font-semibold">Drop Location Selected</p>
          <p className="text-sm text-indigo-900 font-medium">
            {dropCoords.lat.toFixed(6)}, {dropCoords.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}
