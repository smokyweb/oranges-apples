import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NavigationService from './NavigationService';
import CustomIcon, { ICON_TYPE } from '../components/CustomIcon';
import { RouteName } from '../helper/strings';
import { moderateScale, textScale } from '../helper/responsiveSize';
import { colors } from '../resources/colors';
import Home from '../screens/PostLogin/Home';
import Recipes from '../screens/PostLogin/Recipes';
import Profile from '../screens/PostLogin/Profile';
import More from '../screens/PostLogin/More';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const MainTabNavigator = () => {
      const insets = useSafeAreaInsets();
    return (
        <Tab.Navigator
          lazy={false}
        tabBarOptions={{
          animationEnabled: false,
        }}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: colors.textColor,
           tabBarStyle: {
          backgroundColor: '#fff',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
           
          }}>
          <Tab.Screen
            name={RouteName.HOME}
            component={Home}
            options={{
              tabBarLabelStyle: {
                fontSize: textScale(11),
                marginBottom: moderateScale(10),
             
              },
              tabBarLabel: 'Home',
              tabBarIcon: ({ focused, size, color }) => {
                return (
                  <CustomIcon
                    name={'home'}
                    origin={ICON_TYPE.FONT_AWESOME}
                    color={color}
                  />
                );
              },
            }}
          />
    
    <Tab.Screen
            name={RouteName.RECIPES}
            component={Recipes}
            options={{
              tabBarLabelStyle: {
                fontSize: textScale(11),
                paddingBottom: moderateScale(3),
              
              },
              tabBarLabel: 'Recipes',
              tabBarIcon: ({ focused, size, color }) => {
                return (
                  <CustomIcon
                    name={'silverware-fork-knife'}
                    origin={ICON_TYPE.MATERIAL_COMMUNITY}
                    color={color}
                  />
                );
              },
            }}
          />

          <Tab.Screen
            name={RouteName.PROFILE}
            component={Profile}
            options={{
              tabBarLabelStyle: {
                fontSize: textScale(11),
                paddingBottom: moderateScale(3),
             
              },
              tabBarLabel: 'Profile',
              tabBarIcon: ({ focused, size, color }) => {
                return (
                  <CustomIcon
                    name={'user-alt'}
                    origin={ICON_TYPE.FONT_AWESOME5}
                    color={color}
                  />
                );
              },
            }}
          />
    
      
          <Tab.Screen
            name={RouteName.MORE}
            component={More}
            options={{
              tabBarLabel: 'More',
                 tabBarLabelStyle: {
                fontSize: textScale(11),
                paddingBottom: moderateScale(3),
             
              },
              tabBarIcon: ({ focused, size, color }) => {
                return (
                  <CustomIcon
                    name={'dots-three-horizontal'}
                    origin={ICON_TYPE.ENTYPO}
                    color={color}
                  />
                );
              },
            }}
       
          />
        </Tab.Navigator>
      );
}

export default MainTabNavigator

const styles = StyleSheet.create({})