import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import CustomIcon, { ICON_TYPE } from './CustomIcon';
import Spacer from './Spacer';
import { colors } from '../resources/colors';

const CustomConfirm = ({
  visible,
  onCancel,
  onConfirm,
  isLoading,
  title,
  description,
  okButtonText,
  cancelButtonText,
}) => (
  <Modal animationType="fade" transparent={true} visible={visible}>
    <Pressable style={styles.modalBackdrop}>
      <View style={styles.modalContent}>
        <View
          style={[
            styles.iconContainer,
            {
              alignSelf: 'center',
              backgroundColor: '#FB923C4D',
              height: 80,
              width: 80,
              borderRadius: 40,
              borderWidth: 1.5,
              borderColor: '#FB923C',
            },
          ]}
        >
          <CustomIcon
            name={'alert-circle'}
            origin={ICON_TYPE.IONICONS}
            color={'#FB923C'}
            size={35}
          />
        </View>
        <Spacer height={20} />
        <Text style={styles.modalTitle}>{title || 'Sign Out?'}</Text>
        <Spacer height={10} />
        <Text style={styles.modalMessage}>
          {description ||
            "Are you sure you want to sign out of your account? You'll need to sign in again to access the app."}
        </Text>
        <Spacer height={20} />

        <TouchableOpacity
          style={[styles.modalButton, styles.confirmButton]}
          onPress={onConfirm}
          disabled={isLoading}
        >
          <Text style={styles.confirmButtonText}>{okButtonText || 'OK'}</Text>
        </TouchableOpacity>

        {cancelButtonText && (
          <>
            <Spacer height={20} />

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>
                {cancelButtonText || 'Cancel'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1A1C1E',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomConfirm;
