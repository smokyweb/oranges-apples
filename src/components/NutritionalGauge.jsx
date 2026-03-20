import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { textScale, moderateScale } from '../helper/responsiveSize';

const NutritionalGauge = ({ value = 80 }) => {
  const size = moderateScale(150);
  const strokeWidth = 20;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Path for a semi-circle (180 degrees)
  const dialPath = `M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`;

  // Calculate the strokeDasharray for the fill level
  const arcLength = Math.PI * radius;
  const progress = (value / 100) * arcLength;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size / 2 + 20}>
        <G>
          {/* Background Path (Light Grey) */}
          <Path
            d={dialPath}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Path (Green) */}
          <Path
            d={dialPath}
            fill="none"
            stroke="#28C76F"
            strokeWidth={strokeWidth}
            strokeDasharray={`${progress}, ${arcLength}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      
      {/* Percentage Labels based on the design */}
      <View style={[styles.labelRow, { width: size }]}>
        <Text style={styles.labelText}>0</Text>
        <Text style={styles.labelText}>100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5, // Pull labels closer to the gauge base
    paddingHorizontal: 10
  },
  labelText: {
    fontSize: textScale(12),
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default NutritionalGauge;