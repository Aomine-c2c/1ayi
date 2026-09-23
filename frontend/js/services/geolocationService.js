/**
 * AYIS Geolocation Service
 * Wraps the browser Geolocation API in Promises with proper error handling.
 * Used for: auto-filling farm GPS coordinates, getting user's current location
 * for localised weather, and validating coordinate inputs.
 */

// Default Zimbabwe center (used as fallback when GPS is unavailable)
export const ZIMBABWE_CENTER = { lat: -19.0154, lon: 29.1549 };

// Zimbabwe bounding box for validation
const ZIM_BOUNDS = { minLat: -22.5, maxLat: -15.6, minLon: 25.2, maxLon: 33.1 };

/**
 * Get the user's current GPS position as a Promise.
 * @param {PositionOptions} options - Optional geolocation options
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>}
 */
export async function getCurrentPosition(options = {}) {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lon: parseFloat(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          altitude: position.coords.altitude ?? null,
          timestamp: position.timestamp
        });
      },
      (error) => {
        const messages = {
          1: 'Location access denied. Please allow location permission in your browser settings.',
          2: 'Location unavailable. Check your GPS signal.',
          3: 'Location request timed out. Try again.'
        };
        reject(new Error(messages[error.code] || `Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        ...options
      }
    );
  });
}

/**
 * Watch the user's position continuously.
 * @param {Function} onSuccess - Called with position data on each update
 * @param {Function} onError - Called with error on failure
 * @returns {number} watchId — pass to stopWatching() to cancel
 */
export function watchPosition(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported.'));
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => onSuccess({
      lat: parseFloat(position.coords.latitude.toFixed(6)),
      lon: parseFloat(position.coords.longitude.toFixed(6)),
      accuracy: Math.round(position.coords.accuracy)
    }),
    (error) => onError(new Error(error.message)),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
}

/**
 * Stop watching the position.
 * @param {number} watchId
 */
export function stopWatching(watchId) {
  if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
}

/**
 * Validate that coordinates are within or near Zimbabwe.
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
export function isInZimbabwe(lat, lon) {
  return (
    lat >= ZIM_BOUNDS.minLat && lat <= ZIM_BOUNDS.maxLat &&
    lon >= ZIM_BOUNDS.minLon && lon <= ZIM_BOUNDS.maxLon
  );
}

/**
 * Format coordinates for display.
 * @param {number} lat
 * @param {number} lon
 * @returns {string}
 */
export function formatCoordinates(lat, lon) {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

/**
 * Calculate distance between two GPS points (Haversine formula).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometres
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get a human-readable description of GPS accuracy.
 * @param {number} accuracyMeters
 * @returns {string}
 */
export function describeAccuracy(accuracyMeters) {
  if (accuracyMeters <= 10) return 'Excellent (GPS)';
  if (accuracyMeters <= 50) return 'Good';
  if (accuracyMeters <= 200) return 'Moderate (Wi-Fi)';
  if (accuracyMeters <= 2000) return 'Low (Cell tower)';
  return 'Very low';
}

/**
 * AccuWeather icon number → emoji + label mapping.
 * AccuWeather uses icon numbers 1–44.
 */
export const ACCUWEATHER_ICON_MAP = {
  1: { emoji: '☀️', label: 'Sunny' },
  2: { emoji: '🌤️', label: 'Mostly Sunny' },
  3: { emoji: '⛅', label: 'Partly Sunny' },
  4: { emoji: '🌥️', label: 'Intermittent Clouds' },
  5: { emoji: '🌫️', label: 'Hazy Sunshine' },
  6: { emoji: '🌥️', label: 'Mostly Cloudy' },
  7: { emoji: '☁️', label: 'Cloudy' },
  8: { emoji: '☁️', label: 'Dreary (Overcast)' },
  11: { emoji: '🌫️', label: 'Fog' },
  12: { emoji: '🌧️', label: 'Showers' },
  13: { emoji: '🌦️', label: 'Mostly Cloudy w/ Showers' },
  14: { emoji: '🌦️', label: 'Partly Sunny w/ Showers' },
  15: { emoji: '⛈️', label: 'T-Storms' },
  16: { emoji: '⛈️', label: 'Mostly Cloudy w/ T-Storms' },
  17: { emoji: '🌩️', label: 'Partly Sunny w/ T-Storms' },
  18: { emoji: '🌧️', label: 'Rain' },
  19: { emoji: '🌨️', label: 'Flurries' },
  20: { emoji: '🌨️', label: 'Mostly Cloudy w/ Flurries' },
  21: { emoji: '🌨️', label: 'Partly Sunny w/ Flurries' },
  22: { emoji: '❄️', label: 'Snow' },
  23: { emoji: '❄️', label: 'Mostly Cloudy w/ Snow' },
  24: { emoji: '🌨️', label: 'Ice' },
  25: { emoji: '🌨️', label: 'Sleet' },
  26: { emoji: '🌧️', label: 'Freezing Rain' },
  29: { emoji: '🌧️', label: 'Rain and Snow' },
  30: { emoji: '🌡️', label: 'Hot' },
  31: { emoji: '🥶', label: 'Cold' },
  32: { emoji: '💨', label: 'Windy' },
  33: { emoji: '🌙', label: 'Clear (Night)' },
  34: { emoji: '🌙', label: 'Mostly Clear (Night)' },
  35: { emoji: '⛅', label: 'Partly Cloudy (Night)' },
  36: { emoji: '🌥️', label: 'Intermittent Clouds (Night)' },
  37: { emoji: '🌫️', label: 'Hazy Moonlight' },
  38: { emoji: '🌥️', label: 'Mostly Cloudy (Night)' },
  39: { emoji: '🌧️', label: 'Partly Cloudy w/ Showers (Night)' },
  40: { emoji: '🌧️', label: 'Mostly Cloudy w/ Showers (Night)' },
  41: { emoji: '⛈️', label: 'Partly Cloudy w/ T-Storms (Night)' },
  42: { emoji: '⛈️', label: 'Mostly Cloudy w/ T-Storms (Night)' },
  43: { emoji: '🌨️', label: 'Mostly Cloudy w/ Flurries (Night)' },
  44: { emoji: '🌨️', label: 'Mostly Cloudy w/ Snow (Night)' }
};

/**
 * Get emoji and label for an AccuWeather icon number.
 * @param {number} iconNum
 * @returns {{emoji: string, label: string}}
 */
export function getWeatherIcon(iconNum) {
  return ACCUWEATHER_ICON_MAP[iconNum] ?? { emoji: '🌤️', label: 'Partly Cloudy' };
}
