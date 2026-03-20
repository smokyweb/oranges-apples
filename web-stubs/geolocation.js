// Web stub for @react-native-community/geolocation
// On web, use the browser's native Geolocation API
const Geolocation = {
  getCurrentPosition: (success, error, options) => {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
      error && error({ code: 1, message: 'Geolocation not supported' });
    }
  },
  watchPosition: (success, error, options) => {
    if (navigator && navigator.geolocation) {
      return navigator.geolocation.watchPosition(success, error, options);
    }
    return 0;
  },
  clearWatch: (watchId) => {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
  stopObserving: () => {},
  requestAuthorization: () => {},
  setRNConfiguration: () => {},
};

export default Geolocation;
