/**
 * locationService.js
 *
 * Handles location permission + caching for both platforms:
 *  - Web PWA:  navigator.geolocation triggers the browser permission prompt
 *  - Android:  PermissionsAndroid shows the OS dialog; then uses navigator.geolocation
 *              (available on Android via RN's built-in binding when permission is granted)
 *
 * Results are cached in AsyncStorage for 30 minutes so we don't re-prompt constantly.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'ota_user_location';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Android: request OS-level permission dialog ────────────────────────────
const requestAndroidPermission = async () => {
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Access',
        message:
          'Oranges to Apples uses your location to find nearby store prices. ' +
          'Your location is never stored or shared.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

// ─── Cross-platform: get current position via navigator.geolocation ─────────
const fetchPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        err => reject(err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
      );
    } else {
      reject(new Error('navigator.geolocation not available'));
    }
  });

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Call once at app startup.
 * - Web: navigator.geolocation.getCurrentPosition → triggers browser permission popup
 * - Android: PermissionsAndroid dialog → then navigator.geolocation
 * Caches {lat, lng} in AsyncStorage. Returns null silently on any failure.
 */
export const requestAndCacheLocation = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await requestAndroidPermission();
      if (!granted) return null;
    }
    const loc = await fetchPosition();
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...loc, ts: Date.now() }),
    );
    return loc;
  } catch {
    return null; // silent — prices just won't use location
  }
};

/**
 * Returns cached {lat, lng} if fresh (< 30 min), otherwise null.
 * Use this inside Kroger requests — never blocks the UI.
 */
export const getCachedLocation = async () => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return { lat, lng };
  } catch {
    return null;
  }
};
