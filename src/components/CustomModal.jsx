import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import CustomIcon, { ICON_TYPE } from './CustomIcon'
import { Button } from 'react-native-paper'
import GradientButton from './GradientButton'

const CustomModal = ({ visible, setVisible, title = 'Success !', message, onPress, navigation, subText, image, btnText , loading, disabled, gradient,cross,icon}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <Pressable style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          {/* Close Button */}
       {cross &&   <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setVisible(false)}
          >
            <CustomIcon
              name={'close'}
              origin={ICON_TYPE.MATERIAL_ICONS}
              color={colors.white}
              size={25}
            />
          </TouchableOpacity>}

          {/* Modal content */}
          {image ? 
            <Image source={{uri:image}} style={styles.modalImage} />
            :
            <View style={[styles.iconContainer, { backgroundColor: '#22C55E', borderColor: '#22C55E' }]}>
              <CustomIcon
                name={icon ?? 'check'}
                origin={ICON_TYPE.MATERIAL_ICONS}
                color={colors.white}
                size={35}
              />
            </View>
          }

          <View style={{ height: 20 }} />
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ height: 10 }} />
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={{ height: 10 }} />
          <Text style={styles.modalMessage}>{subText}</Text>

          <View style={{ height: 25 }} />
{gradient ? 
<GradientButton text={btnText} onPress={onPress} style={{width:'100%'}}/> :

<Button 
mode='contained'
onPress={onPress}
style={styles.confirmButton}
loading={loading}
textColor={colors.white}
disabled={disabled}
>
  {btnText || "Okay"}
</Button>
}
        </View>
      </Pressable>
    </Modal>
  )
}

export default CustomModal

const colors = {
  white: '#FFFFFF',
  borderColor: '#475569',
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    padding: 25,
    borderRadius: 20,
    width: '85%',
    borderWidth: 1,
    borderColor: colors.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    height: '50%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,  // Ensure the close button is on top of other content
  },
  iconContainer: {
    alignSelf: 'center',
    height: 80,
    width: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#1E3F40',
   width:'100%',
   paddingVertical:2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
})
