import React from 'react';
import { View } from 'react-native';
const LinearGradient = ({ children, style, ...props }) => (
  <View style={style}>{children}</View>
);
export default LinearGradient;
