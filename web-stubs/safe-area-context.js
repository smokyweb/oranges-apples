import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider = ({ children }) => React.createElement(View, { style: { flex: 1 } }, children);
export const SafeAreaView = ({ children, style }) => React.createElement(View, { style: [{ flex: 1 }, style] }, children);
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 375, height: 812 });
export const SafeAreaInsetsContext = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 });
export const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 375, height: 812 });
export const initialWindowMetrics = { insets: { top: 0, bottom: 0, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 375, height: 812 } };
export default { SafeAreaProvider, SafeAreaView, useSafeAreaInsets, useSafeAreaFrame };
