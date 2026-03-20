import React from 'react';
import { Text } from 'react-native';
const Ionicons = ({ name, size = 20, color = '#000', style }) => (
  <Text style={[{ fontSize: size, color, fontFamily: 'system-ui' }, style]}>{name ? '●' : ''}</Text>
);
export default Ionicons;
