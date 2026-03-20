// react-native-gesture-handler web stub
// Re-export all gesture components as simple View/Touchable pass-throughs
import React from 'react';
import { View, ScrollView, FlatList, TouchableOpacity, TouchableHighlight, TouchableNativeFeedback, TouchableWithoutFeedback, Switch, TextInput } from 'react-native';

export { ScrollView, FlatList, Switch, TextInput };
export const GestureHandlerRootView = ({ children, style }) => React.createElement(View, { style }, children);
export const PanGestureHandler = ({ children }) => React.createElement(View, null, children);
export const TapGestureHandler = ({ children }) => React.createElement(View, null, children);
export const LongPressGestureHandler = ({ children }) => React.createElement(View, null, children);
export const PinchGestureHandler = ({ children }) => React.createElement(View, null, children);
export const RotationGestureHandler = ({ children }) => React.createElement(View, null, children);
export const FlingGestureHandler = ({ children }) => React.createElement(View, null, children);
export const State = { BEGAN: 2, FAILED: 1, CANCELLED: 3, ACTIVE: 4, END: 5, UNDETERMINED: 0 };
export const Directions = { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 };
export const RectButton = TouchableOpacity;
export const BorderlessButton = TouchableOpacity;
export const BaseButton = TouchableOpacity;
export const Swipeable = ({ children }) => React.createElement(View, null, children);
export const DrawerLayout = ({ children }) => React.createElement(View, null, children);
export const NativeViewGestureHandler = ({ children }) => React.createElement(View, null, children);
export { TouchableOpacity, TouchableHighlight, TouchableNativeFeedback, TouchableWithoutFeedback };
export default { GestureHandlerRootView };
