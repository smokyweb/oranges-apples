import React from 'react';
import { View } from 'react-native';
const WebView = ({ source, style }) => (
  <View style={style}>
    <iframe src={source?.uri || source} style={{ width: '100%', height: '100%', border: 'none' }} />
  </View>
);
export default WebView;
