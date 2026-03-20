import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import CustomIcon, { ICON_TYPE } from './CustomIcon';
import { colors } from '../resources/colors';
import { moderateScale, moderateScaleVertical, textScale } from '../helper/responsiveSize';

const ImagePickerModal = ({ 
  visible, 
  onClose, 
  onTakePhoto, 
  onChooseFromGallery 
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Image Source</Text>

          <TouchableOpacity style={styles.modalOption} onPress={onTakePhoto}>
            <CustomIcon
              origin={ICON_TYPE.IONICONS}
              name="camera-outline"
              size={24}
              color="#28C76F"
            />
            <Text style={styles.modalOptionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalOption} onPress={onChooseFromGallery}>
            <CustomIcon
              origin={ICON_TYPE.IONICONS}
              name="image-outline"
              size={24}
              color="#28C76F"
            />
            <Text style={styles.modalOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelModalBtn} onPress={onClose}>
            <Text style={styles.cancelModalText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: moderateScale(20),
    paddingBottom: moderateScaleVertical(40),
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: textScale(18),
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1A1C1E',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: textScale(16),
    marginLeft: 15,
    color: '#4B5563',
  },
  cancelModalBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelModalText: {
    color: 'red',
    fontWeight: '600',
    fontSize: textScale(16),
  },
});

export default ImagePickerModal;