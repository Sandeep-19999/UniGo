/**
 * Geocoding utilities using Nominatim OpenStreetMap API
 * Converts location names to coordinates and vice versa
 */

/**
 * Geocode a location name to coordinates
 * @param {string} query - Location name to geocode (e.g., "Colombo Fort")
 * @param {AbortSignal} abortSignal - Optional abort signal for cancellation
 * @returns {Promise<{lat: number, lng: number, name: string} | null>}
 */
export async function geocodeLocation(query, abortSignal) {
  if (!query.trim()) return null;

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "lk", // Sri Lanka
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        signal: abortSignal,
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) throw new Error("Geocoding request failed");

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    return {
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
      name: results[0].display_name,
    };
  } catch (err) {
    if (err.name === "AbortError") return null;
    console.error("Geocoding error:", err);
    throw err;
  }
}

/**
 * Reverse geocode coordinates to a readable address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {AbortSignal} abortSignal - Optional abort signal for cancellation
 * @returns {Promise<string>} - Human-readable address or coordinates string
 */
export async function reverseGeocodeLocation(lat, lng, abortSignal) {
  const params = new URLSearchParams({
    lat,
    lon: lng,
    format: "json",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        signal: abortSignal,
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) throw new Error("Reverse geocoding request failed");

    const result = await response.json();

    // Return the most specific address component available
    return (
      result.address?.road ||
      result.address?.suburb ||
      result.address?.city ||
      result.display_name ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    );
  } catch (err) {
    if (err.name === "AbortError") return null;
    // Fallback to coordinates if reverse geocoding fails
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Get user's current location using Browser Geolocation API
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        let errorMsg = "Unable to get location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable it in browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location unavailable. Please check your GPS.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Please try again.";
        }
        reject(new Error(errorMsg));
      }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
