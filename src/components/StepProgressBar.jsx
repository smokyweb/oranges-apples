import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
// 1. Import LinearGradient
import LinearGradient from 'react-native-linear-gradient'; 
import { colors } from '../resources/colors';
import { moderateScale, moderateScaleVertical, textScale } from '../helper/responsiveSize';

const StepProgressBar = ({ currentStep = 1, totalSteps = 4 }) => {
  const progress = (currentStep / totalSteps) * 100;

  // Define gradient colors matching the image (yellowish-green to standard green)
  const gradientColors = ['#FF8C00', '#22C55E'];

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.stepText}>{`Step ${currentStep} of ${totalSteps}`}</Text>
        <Text style={styles.percentageText}>{`${Math.round(progress)}%`}</Text>
      </View>
      <View style={styles.barBackground}>
        {/* 2. Replace View with LinearGradient */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }} // Left
          end={{ x: 1, y: 0 }}   // Right
          style={[styles.barFill, { width: `${progress}%` }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScaleVertical(20),
    paddingHorizontal: moderateScale(20),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScaleVertical(8),
  },
  stepText: {
    fontSize: textScale(12),
    color: colors.black,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: textScale(12),
    color: 'gray',
  },
  barBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden', // Important to ensure gradient corner radius works
  },
  barFill: {
    height: 6,
    // backgroundColor: '#28C76F', // Removed solid color
    borderRadius: 10,
  },
});

export default StepProgressBar;