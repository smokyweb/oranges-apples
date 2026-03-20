import React from 'react';
import { View } from 'react-native';

// Web stub for NativeStackView — renders the active screen as a plain View
export function NativeStackView({ state, descriptors, navigation }) {
  const activeRoute = state.routes[state.index];
  if (!activeRoute || !descriptors[activeRoute.key]) return null;
  const { render } = descriptors[activeRoute.key];
  return React.createElement(View, { style: { flex: 1 } }, render());
}

export default NativeStackView;
