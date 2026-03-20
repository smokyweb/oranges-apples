import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../helper/responsiveSize';

const CustomButton = ({
  title,
  onPress,
  style,
  labelStyle,
  disabled = false,
  loading = false,
  mode = 'contained',
  useGradient = true,
  icon,
}) => {
  // Updated colors to match the bright, punchy green gradient in the images
  const gradientColors = ['#11998E','#28C76F']; 

  if (useGradient && mode === 'contained' && !disabled) {
    return (
      <View style={[styles.shadowContainer, style]}>
        <View style={styles.gradientWrapper}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Button
            mode="text" // Using 'text' mode here prevents Paper from applying its own background/shadows
            onPress={onPress}
            loading={loading}
            disabled={disabled}
            icon={icon}
            style={styles.paperButtonGradient}
            contentStyle={styles.contentStyle}
            labelStyle={[styles.labelStyle, labelStyle]}
            textColor={colors.white}
          >
            {title}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      style={[styles.standardButton, style]}
      contentStyle={styles.contentStyle}
      labelStyle={[styles.labelStyle, labelStyle]}
      // Defaulting to the brand green for the standard button
      buttonColor={mode === 'contained' ? '#28C76F' : undefined}
      textColor={mode === 'contained' ? colors.white : '#28C76F'}
    >
      {title}
    </Button>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  // New container to handle the soft shadow shown in the screenshots
  shadowContainer: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#28C76F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  gradientWrapper: {
    height: moderateScaleVertical(50),
    borderRadius: 16, // Matches the rounded corners in the design
    overflow: 'hidden',
  },
  paperButtonGradient: {
    height: '100%',
    borderRadius: 16,
  },
  standardButton: {
    height: moderateScaleVertical(30),
    borderRadius: 16,
    justifyContent: 'center',
  },
  contentStyle: {
    height: moderateScaleVertical(54),
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelStyle: {
    fontSize: textScale(16),
    fontWeight: '700',
    textTransform: 'none',
    letterSpacing: 0.5,
  },
});