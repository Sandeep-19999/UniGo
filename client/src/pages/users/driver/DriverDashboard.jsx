// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { Link } from 'react-router-dom';
// import L from 'leaflet';
// import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
// import { api } from '../../../api/axios';
// import { useAuth } from '../../../context/AuthContext';
// import { geoJsonPointToLatLng } from '../../../utils/driverOnboarding';

// const FALLBACK_CENTER = [6.9068, 79.8706];

// const driverHomeIcon = L.divIcon({
//   className: 'driver-home-marker-wrap',
//   html: `
//     <div class="driver-home-marker-pin">
//       <div class="driver-home-marker-arrow"></div>
//     </div>
//   `,
//   iconSize: [56, 56],
//   iconAnchor: [28, 28]
// });

// function formatMoney(value) {
//   return `LKR ${Number(value || 0).toLocaleString('en-LK', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   })}`;
// }

// function initials(name = 'Driver') {
//   return name
//     .split(' ')
//     .slice(0, 2)
//     .map((part) => part[0]?.toUpperCase() || '')
//     .join('');
// }

// function DashboardMapBridge({ center, followMe, mapRef }) {
//   const map = useMap();

//   useEffect(() => {
//     mapRef.current = map;
//   }, [map, mapRef]);

//   useEffect(() => {
//     if (center && followMe) {
//       map.flyTo(center, 14, { duration: 1.2 });
//     }
//   }, [center, followMe, map]);

//   return null;
// }

// function getBrowserLocation() {
//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) {
//       reject(new Error('Geolocation is not supported in this browser.'));
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
//       },
//       () => reject(new Error('Location access failed. Please allow browser location.')),
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
//     );
//   });
// }

// export default function DriverDashboard() {
//   const { user } = useAuth();
//   const mapRef = useRef(null);
//   const watchIdRef = useRef(null);
//   const lastSyncRef = useRef(0);

//   const [isOnline, setIsOnline] = useState(false);
//   const [onlineBusy, setOnlineBusy] = useState(false);
//   const [followMe, setFollowMe] = useState(true);
//   const [position, setPosition] = useState(null);
//   const [geoError, setGeoError] = useState('');
//   const [earnings, setEarnings] = useState({ totalEarnings: 0, totalCompletedRides: 0 });
//   const [rides, setRides] = useState([]);

//   const syncLocation = useCallback(async (latLng, force = false) => {
//     if (!latLng) return;
//     if (!force && Date.now() - lastSyncRef.current < 5000) return;

//     try {
//       lastSyncRef.current = Date.now();
//       await api.patch('/driver/availability/location', {
//         currentLocation: { lat: latLng[0], lng: latLng[1] }
//       });
//     } catch {
//       // ignore background location sync failures to preserve dashboard UX
//     }
//   }, []);

//   useEffect(() => {
//     const controller = new AbortController();

//     (async () => {
//       try {
//         const [earningsRes, ridesRes, availabilityRes] = await Promise.all([
//           api.get('/driver/rides/earnings/summary', { signal: controller.signal }),
//           api.get('/driver/rides', { signal: controller.signal }),
//           api.get('/driver/availability/me', { signal: controller.signal })
//         ]);

//         setEarnings(earningsRes.data || { totalEarnings: 0, totalCompletedRides: 0 });
//         setRides(ridesRes.data?.rides || []);

//         const availability = availabilityRes.data?.availability;
//         if (availability?.isOnline) {
//           setIsOnline(true);
//         }

//         const backendPosition = geoJsonPointToLatLng(availability?.currentLocation);
//         if (backendPosition) setPosition(backendPosition);
//       } catch {
//         // keep UI alive even if dashboard stats fail
//       }
//     })();

//     return () => controller.abort();
//   }, []);

//   useEffect(() => {
//     function stopTracking() {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }
//     }

//     if (!isOnline) {
//       stopTracking();
//       return;
//     }

//     if (!navigator.geolocation) {
//       setGeoError('Geolocation is not supported in this browser.');
//       return;
//     }

//     setGeoError('');

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => {
//         const nextPosition = [pos.coords.latitude, pos.coords.longitude];
//         setPosition(nextPosition);
//         syncLocation(nextPosition);
//       },
//       () => {
//         setGeoError('Location access failed. Please allow browser location.');
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 5000,
//         timeout: 15000
//       }
//     );

//     return stopTracking;
//   }, [isOnline, syncLocation]);

//   const center = position || FALLBACK_CENTER;

//   const activeRideCount = useMemo(
//     () => rides.filter((ride) => ['pending', 'ongoing'].includes(ride.status)).length,
//     [rides]
//   );

//   async function handleToggleOnline() {
//     if (onlineBusy) return;

//     setOnlineBusy(true);
//     setGeoError('');

//     try {
//       if (isOnline) {
//         await api.patch('/driver/availability/go-offline');
//         setIsOnline(false);
//         return;
//       }

//       let coords = position ? { lat: position[0], lng: position[1] } : null;
//       if (!coords) {
//         coords = await getBrowserLocation();
//         setPosition([coords.lat, coords.lng]);
//       }

//       await api.post('/driver/availability/go-online', {
//         currentLocation: coords
//       });
//       setIsOnline(true);
//       await syncLocation([coords.lat, coords.lng], true);
//     } catch (err) {
//       setGeoError(err?.response?.data?.message || err.message || 'Failed to change online status.');
//     } finally {
//       setOnlineBusy(false);
//     }
//   }

//   function recenterMap() {
//     if (mapRef.current && position) {
//       mapRef.current.flyTo(position, 14, { duration: 1.1 });
//     }
//   }

//   return (
//     <div className="driver-home-screen">
//       <MapContainer center={center} zoom={8} scrollWheelZoom className="driver-home-map">
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />

//         <DashboardMapBridge center={center} followMe={followMe} mapRef={mapRef} />

//         {position ? <Marker position={position} icon={driverHomeIcon} /> : null}
//       </MapContainer>

//       <div className="driver-home-topbar">
//         <div className="driver-home-avatar-pill">
//           <div className="driver-home-avatar">{initials(user?.name || 'Driver')}</div>
//         </div>

//         <div className="driver-home-earnings-pill">{formatMoney(earnings.totalEarnings || 0)}</div>
//       </div>

//       <div className="driver-home-right-buttons">
//         <button
//           type="button"
//           className="driver-home-fab"
//           onClick={() => setFollowMe((prev) => !prev)}
//           title="Toggle follow mode"
//         >
//           {followMe ? '◎' : '◌'}
//         </button>

//         <button type="button" className="driver-home-fab" onClick={recenterMap} title="Re-center">
//           ⌖
//         </button>
//       </div>

//       <div className="driver-home-go-wrap">
//         <button
//           type="button"
//           className={`driver-home-go-btn ${isOnline ? 'is-online' : ''}`}
//           onClick={handleToggleOnline}
//           disabled={onlineBusy}
//         >
//           {onlineBusy ? '...' : isOnline ? 'On' : 'Go'}
//         </button>
//       </div>

//       <div className="driver-home-sheet">
//         <div className="driver-home-sheet-handle" />

//         <div className={`driver-home-sheet-status ${isOnline ? 'online' : 'offline'}`}>
//           <span className="driver-home-status-dot" />
//           {isOnline ? 'Online' : 'Offline'}
//         </div>

//         <div className="driver-home-sheet-links">
//           <Link to="/driver/rides" className="driver-home-sheet-link">
//             Rides
//           </Link>
//           <Link to="/driver/vehicles" className="driver-home-sheet-link">
//             Vehicles
//           </Link>
//           <Link to="/driver/history" className="driver-home-sheet-link">
//             History
//           </Link>
//           <Link to="/driver/directional-hire" className="driver-home-sheet-link">
//             Hire
//           </Link>
//         </div>

//         <div className="driver-home-mini-stats">
//           <div className="driver-home-mini-card">
//             <span>Active rides</span>
//             <strong>{activeRideCount}</strong>
//           </div>
//           <div className="driver-home-mini-card">
//             <span>Completed</span>
//             <strong>{earnings.totalCompletedRides || 0}</strong>
//           </div>
//         </div>

//         {geoError ? <div className="driver-home-error">{geoError}</div> : null}
//       </div>
//     </div>
//   );
// }



import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { api } from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { geoJsonPointToLatLng } from '../../../utils/driverOnboarding';

const FALLBACK_CENTER = [6.9068, 79.8706];

const driverHomeIcon = L.divIcon({
  className: 'driver-home-marker-wrap',
  html: `
    <div class="driver-home-marker-pin">
      <div class="driver-home-marker-arrow"></div>
    </div>
  `,
  iconSize: [56, 56],
  iconAnchor: [28, 28]
});

function formatMoney(value) {
  return `LKR ${Number(value || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function initials(name = 'Driver') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
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
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => reject(new Error('Location access failed. Please allow browser location.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSyncRef = useRef(0);

  const [isOnline, setIsOnline] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalCompletedRides: 0 });
  const [rides, setRides] = useState([]);
  const [matchItems, setMatchItems] = useState([]);

  const syncLocation = useCallback(async (latLng, force = false) => {
    if (!latLng) return;
    if (!force && Date.now() - lastSyncRef.current < 5000) return;

    try {
      lastSyncRef.current = Date.now();
      await api.patch('/driver/availability/location', {
        currentLocation: { lat: latLng[0], lng: latLng[1] }
      });
    } catch {
      // ignore background location sync failures
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    try {
      const res = await api.get('/driver/requests/matches');
      setMatchItems(res.data?.items || []);
    } catch {
      setMatchItems([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const [earningsRes, ridesRes, availabilityRes, matchesRes] = await Promise.all([
          api.get('/driver/rides/earnings/summary', { signal: controller.signal }),
          api.get('/driver/rides', { signal: controller.signal }),
          api.get('/driver/availability/me', { signal: controller.signal }),
          api.get('/driver/requests/matches', { signal: controller.signal })
        ]);

        setEarnings(earningsRes.data || { totalEarnings: 0, totalCompletedRides: 0 });
        setRides(ridesRes.data?.rides || []);
        setMatchItems(matchesRes.data?.items || []);

        const availability = availabilityRes.data?.availability;
        if (availability?.isOnline) {
          setIsOnline(true);
        }

        const backendPosition = geoJsonPointToLatLng(availability?.currentLocation);
        if (backendPosition) setPosition(backendPosition);
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
      setGeoError('Geolocation is not supported in this browser.');
      return;
    }

    setGeoError('');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextPosition = [pos.coords.latitude, pos.coords.longitude];
        setPosition(nextPosition);
        syncLocation(nextPosition);
      },
      () => {
        setGeoError('Location access failed. Please allow browser location.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );

    return stopTracking;
  }, [isOnline, syncLocation]);

  useEffect(() => {
    if (!isOnline) {
      setMatchItems([]);
      return undefined;
    }

    const timer = window.setInterval(() => {
      refreshMatches();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [isOnline, refreshMatches]);

  const center = position || FALLBACK_CENTER;

  const activeRideCount = useMemo(
    () => rides.filter((ride) => ['pending', 'ongoing'].includes(ride.status)).length,
    [rides]
  );

  const latestMatch = matchItems[0]?.rideRequest || null;

  async function handleToggleOnline() {
    if (onlineBusy) return;

    setOnlineBusy(true);
    setGeoError('');

    try {
      if (isOnline) {
        await api.patch('/driver/availability/go-offline');
        setIsOnline(false);
        setMatchItems([]);
        return;
      }

      let coords = position ? { lat: position[0], lng: position[1] } : null;
      if (!coords) {
        coords = await getBrowserLocation();
        setPosition([coords.lat, coords.lng]);
      }

      await api.post('/driver/availability/go-online', {
        currentLocation: coords
      });

      setIsOnline(true);
      await syncLocation([coords.lat, coords.lng], true);
      await refreshMatches();
    } catch (err) {
      setGeoError(err?.response?.data?.message || err.message || 'Failed to change online status.');
    } finally {
      setOnlineBusy(false);
    }
  }

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
          <div className="driver-home-avatar">{initials(user?.name || 'Driver')}</div>
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
          {followMe ? '◎' : '◌'}
        </button>

        <button type="button" className="driver-home-fab" onClick={recenterMap} title="Re-center">
          ⌖
        </button>
      </div>

      <div className="driver-home-go-wrap">
        <button
          type="button"
          className={`driver-home-go-btn ${isOnline ? 'is-online' : ''}`}
          onClick={handleToggleOnline}
          disabled={onlineBusy}
        >
          {onlineBusy ? '...' : isOnline ? 'On' : 'Go'}
        </button>
      </div>

      <div className="driver-home-sheet">
        <div className="driver-home-sheet-handle" />

        <div className={`driver-home-sheet-status ${isOnline ? 'online' : 'offline'}`}>
          <span className="driver-home-status-dot" />
          {isOnline ? 'Online' : 'Offline'}
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

        {matchItems.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-bold text-emerald-900">
              New passenger request notification
            </div>
            <div className="mt-1 text-sm text-emerald-800">
              {matchItems.length} passenger request(s) match your current route.
            </div>

            {latestMatch ? (
              <div className="mt-3 text-sm text-emerald-900">
                <span className="font-semibold">
                  {latestMatch.passenger?.name || 'Passenger'}
                </span>{' '}
                • {latestMatch.pickupLocation} → {latestMatch.dropLocation}
              </div>
            ) : null}

            <div className="mt-3">
              <Link
                to="/driver/directional-hire"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View / Accept / Reject
              </Link>
            </div>
          </div>
        ) : null}

        {geoError ? <div className="driver-home-error">{geoError}</div> : null}
      </div>
    </div>
  );
}