// CustomAlert.js
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, moderateScaleVertical, textScale } from '../helper/responsiveSize';
import CustomIcon, { ICON_TYPE } from './CustomIcon';

const CustomAlert = ({ visible, message, onClose , setVisible}) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.iconContainer}>
            <CustomIcon 
              origin={ICON_TYPE.IONICONS} 
              name="alert-circle" 
              size={40} 
              color="#DC2626" 
            />
          </View>
          <Text style={styles.alertTitle}>Error</Text>
          <Text style={styles.alertMessage}>{message || 'Something went wrong'}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={()=> setVisible(false)}>
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: 'white',
    paddingHorizontal: moderateScale(25),
    paddingVertical: moderateScaleVertical(30),
    borderRadius: 20,
    width: moderateScale(300),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    marginBottom: moderateScaleVertical(15),
  },
  alertTitle: {
    fontSize: textScale(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScaleVertical(10),
  },
  alertMessage: {
    fontSize: textScale(14),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: textScale(20),
    marginBottom: moderateScaleVertical(25),
  },
  closeButton: {
    backgroundColor: '#1B4332',
    paddingVertical: moderateScaleVertical(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: 25,
    width: '100%',
    elevation: 3,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  closeButtonText: {
    color: 'white',
    fontSize: textScale(16),
    fontWeight: '600',
    textAlign:'center'
  },
});

export default CustomAlert;
