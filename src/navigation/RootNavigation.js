import { Platform, StatusBar, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { isMountedRef, navigationRef } from './NavigationService';
import { useSelector } from 'react-redux';

import Splash from '../screens/PreLogin/Splash';
import PostLoginNavigation from './PostLoginNavigation';
import PreLoginNavigation from './PreLoginNavigation';

const RootNavigation = () => {
  const [isSplash, setIsSplash] = useState(true);
  const { isAuthenticated } = useSelector(store => store.authReducer);

  console.log('isAuthenticated===>>>', isAuthenticated);
  

  useEffect(() => {
    isMountedRef.current = true;
    return () => (isMountedRef.current = false);
  }, []);

  // Hide splash after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) setIsSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const navigator = isAuthenticated ? <PostLoginNavigation /> : <PreLoginNavigation />; 
  //  const navigator =<PreLoginNavigation />;

  return (
    <NavigationContainer ref={navigationRef}>
 <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {isSplash ? <Splash /> : navigator}
    </NavigationContainer>
  );
};

export default RootNavigation;
