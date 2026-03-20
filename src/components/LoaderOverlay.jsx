import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '../resources/colors'

const LoaderOverlay = ({ visible = false, size = 'large', color = colors.primary }) => {
  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

export default LoaderOverlay

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})