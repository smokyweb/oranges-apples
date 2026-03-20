// react-native-screens web stub
import React from 'react';
import { View, ScrollView } from 'react-native';

export const enableScreens = () => {};
export const Screen = ({ children, style }) => React.createElement(View, { style: [{ flex: 1 }, style] }, children);
export const ScreenContainer = ({ children, style }) => React.createElement(View, { style: [{ flex: 1 }, style] }, children);
export const ScreenStack = ({ children, style }) => React.createElement(View, { style: [{ flex: 1 }, style] }, children);
export const ScreenStackHeaderConfig = () => null;
export const NativeScreen = Screen;
export const NativeScreenContainer = ScreenContainer;
export const screensEnabled = () => false;
export default { enableScreens, Screen, ScreenContainer };
