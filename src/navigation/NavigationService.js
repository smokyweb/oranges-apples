import {
  CommonActions,
  createNavigationContainerRef,
  DrawerActions,
  StackActions,
} from '@react-navigation/native';
import React from 'react';
export const navigationRef = createNavigationContainerRef();
export const isMountedRef = React.createRef();

/**
 * Call this function when you want to navigate to a specific route.
 *
 * @param routeName The name of the route to navigate to. Routes are defined in RootScreen using createStackNavigator()
 * @param params Route parameters.
 */
function navigate(routeName, params) {
  if (navigationRef.isReady()) {
    // Perform navigation if the app has mounted
    navigationRef.navigate(routeName, params);
  } else {
    // You can decide what to do if the app hasn't mounted
    // You can ignore this, or add these actions to a queue you can call later
  }
}

function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    // Perform navigation if the app has mounted
    navigationRef.goBack(null);
  }
}

function resetRoot(params = {index: 0, routes: []}) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(params);
  }
}

/**
 * Call this function when you want to replace route.
 *
 * @param routeName The name of the route to navigate to. Routes are defined in RootScreen using createStackNavigator()
 * @param params Route parameters.
 */
function replace(name, param) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.replace(name, {
        param,
      }),
    );
  }
}

/**
 * Call this function when you want to navigate to a specific route AND reset the navigation history.
 *
 * That means the user cannot go back. This is useful for example to redirect from a splashscreen to
 * the main screen: the user should not be able to go back to the splashscreen.
 *
 * @param routeName The name of the route to navigate to. Routes are defined in RootScreen using createStackNavigator()
 * @param params Route parameters.
 */
function navigateAndReset(routeName, params) {
  navigationRef.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{name: routeName, params: params}],
    }),
  );
}

function toggleDrawer() {
  navigationRef.dispatch(DrawerActions.toggleDrawer());
}

function openDrawer() {
  navigationRef.dispatch(DrawerActions.openDrawer());
}

function closeDrawer() {
  navigationRef.dispatch(DrawerActions.closeDrawer());
}

const NavigationService = {
  navigate,
  replace,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  navigateAndReset,
  goBack,
  resetRoot,
};

export default NavigationService;
