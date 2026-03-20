import { StyleSheet, View, Text, Platform } from 'react-native';
import React from 'react';

import LinearGradient from 'react-native-linear-gradient';

const CustomText = ({ text, style }) => {
  return (
    <View>
      <Text
        style={{
          ...style,
          fontSize: 23,
          fontWeight: Platform.OS === 'android' ? '400' : '800',
          color: '#fff',
          marginBottom: 8,
        }}
      >
        {text}
      </Text>

      <LinearGradient
        colors={['#9333EA', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: 50, height: 4, marginBottom: 10 }}
      ></LinearGradient>
    </View>
  );
};

export default CustomText;
