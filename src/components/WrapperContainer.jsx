//import liraries
import React, { Component } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WrapperContainer = ({ style = {}, children, statusBarColor = '#fff' }) => {
  return (
    <SafeAreaView style={[styles.container, style]}>

      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default WrapperContainer;
