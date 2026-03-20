import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import RootNavigation from './src/navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import store from './store';
import { requestAndCacheLocation } from './src/helper/locationService';

const App = () => {
  useEffect(() => {
    // Request location permission + cache result for Kroger price lookups.
    // Fire-and-forget — failure is silent, prices just won't use location.
    requestAndCacheLocation();
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <RootNavigation />
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({});
