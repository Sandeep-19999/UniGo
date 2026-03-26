import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import DriverLayout from '../../components/driver/DriverLayout';
import { api } from '../../api/axios';
import { geoJsonPointToLatLng } from '../../utils/driverOnboarding';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      () => reject(new Error('Location access failed.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

export default function DirectionalHire() {
  const watchIdRef = useRef(null);
  const lastSyncRef = useRef(0);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLabel, setDestinationLabel] = useState('');
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [seatCapacity, setSeatCapacity] = useState(4);
  const [matchItems, setMatchItems] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [actionError, setActionError] = useState('');
  const [busyRequestId, setBusyRequestId] = useState('');

  const refreshAvailabilityAndData = useCallback(async () => {
    const [availabilityRes, vehiclesRes, matchesRes, acceptedRes] = await Promise.all([
      api.get('/driver/availability/me'),
      api.get('/driver/vehicles'),
      api.get('/driver/requests/matches').catch(() => ({ data: { items: [] } })),
      api.get('/driver/requests/accepted').catch(() => ({ data: { rideRequests: [] } }))
    ]);

    const availability = availabilityRes.data?.availability;
    const list = vehiclesRes.data?.vehicles || [];
    const backendCurrent = geoJsonPointToLatLng(availability?.currentLocation);
    const backendDestination = geoJsonPointToLatLng(availability?.destination);

    setVehicles(list);
    setSelectedVehicleId(availability?.vehicle?._id || list[0]?._id || '');
    setSeatCapacity(Number(availability?.seatsAvailable || availability?.vehicle?.seatCapacity || list[0]?.seatCapacity || 4));
    setIsOnline(Boolean(availability?.isOnline));
    if (backendCurrent) setCurrentLocation(backendCurrent);
    if (backendDestination) setDestinationPoint(backendDestination);
    if (availability?.destinationLabel) setDestinationLabel(availability.destinationLabel);
    setMatchItems(matchesRes.data?.items || []);
    setAcceptedRequests(acceptedRes.data?.rideRequests || []);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await refreshAvailabilityAndData();
        if (active && !currentLocation) {
          const coords = await getBrowserLocation();
          setCurrentLocation(coords);
        }
      } catch (err) {
        if (active) {
          setGeoError(err?.response?.data?.message || err.message || 'Location access failed. Showing fallback map area.');
        }
      } finally {
        if (active) setLoadingLocation(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshAvailabilityAndData]);

  useEffect(() => {
    if (!isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const nextLocation = [position.coords.latitude, position.coords.longitude];
        setCurrentLocation(nextLocation);

        if (Date.now() - lastSyncRef.current < 6000) return;
        lastSyncRef.current = Date.now();

        try {
          await api.patch('/driver/availability/location', {
            currentLocation: { lat: nextLocation[0], lng: nextLocation[1] },
            destination: destinationPoint ? { lat: destinationPoint[0], lng: destinationPoint[1] } : null,
            destinationLabel,
            seatsAvailable: Number(seatCapacity)
          });
        } catch {
          // silent background sync failure
        }
      },
      () => {
        setGeoError('Location access failed. Showing the last known point.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline, destinationLabel, destinationPoint, seatCapacity]);

  useEffect(() => {
    if (!isOnline) return undefined;

    const timer = window.setInterval(() => {
      setLoadingMatches(true);
      Promise.all([
        api.get('/driver/requests/matches').then((res) => setMatchItems(res.data?.items || [])),
        api.get('/driver/requests/accepted').then((res) => setAcceptedRequests(res.data?.rideRequests || []))
      ])
        .catch(() => {})
        .finally(() => setLoadingMatches(false));
    }, 12000);

    return () => window.clearInterval(timer);
  }, [isOnline]);

  const routePoints = useMemo(() => {
    if (!currentLocation || !destinationPoint) return [];
    return [currentLocation, destinationPoint];
  }, [currentLocation, destinationPoint]);

  const distanceKm = useMemo(() => calcDistanceKm(currentLocation, destinationPoint), [currentLocation, destinationPoint]);

  const roughEtaMinutes = useMemo(() => {
    if (!distanceKm) return 0;
    return Math.max(6, Math.round((distanceKm / 28) * 60));
  }, [distanceKm]);

  const focusCenter = destinationPoint || currentLocation || FALLBACK_CENTER;

  async function locateDriver() {
    setLoadingLocation(true);
    setGeoError('');

    try {
      const coords = await getBrowserLocation();
      setCurrentLocation(coords);
    } catch (err) {
      setGeoError(err.message || 'Location access failed. Showing fallback map area.');
    } finally {
      setLoadingLocation(false);
    }
  }

  async function publishDirectionalHire() {
    setSaving(true);
    setActionError('');

    try {
      const latestLocation = currentLocation || (await getBrowserLocation());
      setCurrentLocation(latestLocation);

      const payload = {
        vehicleId: selectedVehicleId || undefined,
        currentLocation: { lat: latestLocation[0], lng: latestLocation[1] },
        destination: destinationPoint ? { lat: destinationPoint[0], lng: destinationPoint[1] } : null,
        destinationLabel,
        seatsAvailable: Number(seatCapacity)
      };

      if (isOnline) {
        await api.patch('/driver/availability/location', payload);
      } else {
        await api.post('/driver/availability/go-online', payload);
        setIsOnline(true);
      }

      await refreshAvailabilityAndData();
    } catch (err) {
      setActionError(err?.response?.data?.message || err.message || 'Failed to publish directional hire.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGoOffline() {
    setSaving(true);
    setActionError('');
    try {
      await api.patch('/driver/availability/go-offline');
      setIsOnline(false);
      setMatchItems([]);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to switch offline.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestAction(item, action) {
    setBusyRequestId(item.rideRequest?._id || '');
    setActionError('');
    try {
      if (action === 'accept') {
        await api.patch(`/driver/requests/${item.rideRequest._id}/accept`, {
          vehicleId: selectedVehicleId || undefined
        });
      } else {
        await api.patch(`/driver/requests/${item.rideRequest._id}/reject`);
      }
      await refreshAvailabilityAndData();
    } catch (err) {
      setActionError(err?.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setBusyRequestId('');
    }
  }

  return (
    <DriverLayout
      title="Directional Hire"
      subtitle="Go online with a live route, sync your location, and accept or reject matched passenger requests without changing the passenger-side flow."
      actions={
        <>
          <button type="button" onClick={locateDriver} className="driver-btn-secondary">
            Refresh my location
          </button>
          {isOnline ? (
            <button type="button" onClick={handleGoOffline} className="driver-btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Go offline'}
            </button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Location status</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">{loadingLocation ? 'Detecting...' : currentLocation ? 'Live' : 'Fallback'}</div>
          <div className="mt-2 text-sm text-slate-500">{currentLocation ? 'Driver marker is active on the map.' : 'Waiting for permission or using default center.'}</div>
        </div>

        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Directional hire</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">{isOnline ? 'Published' : 'Draft'}</div>
          <div className="mt-2 text-sm text-slate-500">{isOnline ? 'Matching is now active for this route.' : 'Set your route and publish when ready.'}</div>
        </div>

        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preview distance</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">{distanceKm ? `${distanceKm.toFixed(1)} km` : '--'}</div>
          <div className="mt-2 text-sm text-slate-500">Straight-line preview until live routing is connected.</div>
        </div>

        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pending matches</div>
          <div className="mt-3 text-2xl font-extrabold text-slate-950">{matchItems.length}</div>
          <div className="mt-2 text-sm text-slate-500">Matched requests currently waiting for your response.</div>
        </div>
      </div>

      {geoError ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{geoError}</div> : null}
      {actionError ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <section className="driver-card overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-bold text-slate-950">Live route map</div>
              <div className="text-sm text-slate-500">Click anywhere on the map to place the destination marker and draw a route preview.</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">OpenStreetMap + Leaflet</div>
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
                  <Circle center={currentLocation} radius={120} pathOptions={{ color: '#10b981', fillColor: '#6ee7b7', fillOpacity: 0.25 }} />
                </>
              ) : null}

              {destinationPoint ? (
                <Marker position={destinationPoint}>
                  <Popup>{destinationLabel || 'Selected destination'}</Popup>
                </Marker>
              ) : null}

              {destinationPoint ? <Circle center={destinationPoint} radius={160} pathOptions={{ color: '#0f172a', fillColor: '#cbd5e1', fillOpacity: 0.16 }} /> : null}

              {routePoints.length === 2 ? <Polyline positions={routePoints} pathOptions={{ color: '#16a34a', weight: 5, opacity: 0.85, dashArray: '10, 10' }} /> : null}
            </MapContainer>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="driver-card p-5">
            <div className="text-lg font-bold text-slate-950">Route controls</div>
            <div className="mt-1 text-sm text-slate-500">This panel is now connected to the driver availability and request matching backend.</div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Destination label</label>
                <input className="driver-input" value={destinationLabel} onChange={(e) => setDestinationLabel(e.target.value)} placeholder="Ex: Kaduwela, Nugegoda, City Center" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Vehicle</span>
                  <select className="driver-select" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} · {vehicle.type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Seats available</span>
                  <input className="driver-input" type="number" min="1" max="60" value={seatCapacity} onChange={(e) => setSeatCapacity(e.target.value)} />
                </label>
              </div>

              <div className="driver-card-soft p-4">
                <div className="text-sm font-semibold text-slate-900">Map instruction</div>
                <div className="mt-1 text-sm text-slate-500">Click on the map to drop the destination marker. The route line will render automatically.</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current point</div>
                  <div className="mt-2 text-sm text-slate-700">{currentLocation ? `${currentLocation[0].toFixed(5)}, ${currentLocation[1].toFixed(5)}` : 'Not available'}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Destination point</div>
                  <div className="mt-2 text-sm text-slate-700">{destinationPoint ? `${destinationPoint[0].toFixed(5)}, ${destinationPoint[1].toFixed(5)}` : 'Click map to set'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Estimated route ETA: <span className="font-semibold text-slate-900">{roughEtaMinutes ? `${roughEtaMinutes} min` : '--'}</span>
              </div>

              <button type="button" className="driver-btn-accent w-full" onClick={publishDirectionalHire} disabled={saving}>
                {saving ? 'Publishing...' : isOnline ? 'Update directional hire' : 'Publish directional hire'}
              </button>
            </div>
          </section>

          <section className="driver-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-slate-950">Matched passengers</div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{loadingMatches ? 'Refreshing...' : `${matchItems.length} live`}</span>
            </div>

            <div className="mt-4 space-y-3">
              {matchItems.map((item) => {
                const request = item.rideRequest;
                const passenger = request?.passenger;
                const score =Number.isFinite(item?.myMatch?.score) ? `${Math.round(item.myMatch.score)}%` : 'Match';
                return (
                  <div key={request?._id} className="rounded-[24px] border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">{passenger?.name || 'Passenger'}</div>
                        <div className="mt-1 text-sm text-slate-500">{request?.pickupLocation} → {request?.dropLocation}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{score}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Seats</div>
                        <div className="mt-1 font-semibold text-slate-900">{request?.seats || request?.numberOfSeats || 1}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Fare</div>
                        <div className="mt-1 font-semibold text-slate-900">LKR {Number(request?.estimatedFare || 0).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Status</div>
                        <div className="mt-1 font-semibold text-emerald-700">Pending</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button type="button" className="driver-btn-primary flex-1" onClick={() => handleRequestAction(item, 'accept')} disabled={busyRequestId === request?._id}>
                        {busyRequestId === request?._id ? 'Working...' : 'Accept'}
                      </button>
                      <button type="button" className="driver-btn-secondary flex-1" onClick={() => handleRequestAction(item, 'reject')} disabled={busyRequestId === request?._id}>
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}

              {!matchItems.length ? <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No matched passengers yet. Publish the route and keep location access enabled.</div> : null}
            </div>
          </section>

          <section className="driver-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-slate-950">Accepted requests</div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{acceptedRequests.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {acceptedRequests.slice(0, 3).map((request) => (
                <div key={request._id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-950">{request?.passenger?.name || 'Passenger'}</div>
                  <div className="mt-1">{request.pickupLocation} → {request.dropLocation}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">Accepted</div>
                </div>
              ))}

              {!acceptedRequests.length ? <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No accepted directional hire requests yet.</div> : null}
            </div>
          </section>
        </aside>
      </div>
    </DriverLayout>
  );
}
