import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import CustomIcon, { ICON_TYPE } from './CustomIcon';
import { colors } from '../resources/colors';
import { textScale, moderateScale, moderateScaleVertical } from '../helper/responsiveSize';
import { fonts } from '../resources/fonts';

const Header = ({
  title,
  onBackPress = () => { },
  rightIcon,
  onRightPress = () => { },
  hideLeft = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Left Section */}
        <View style={styles.sideContainer}>
          {!hideLeft && (
            <Pressable
              style={styles.backButton}
              onPress={onBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomIcon
                name={'arrow-back'} // Changed to match common back icons
                origin={ICON_TYPE.IONICONS}
                size={24}
                color={colors.black}
              />
            </Pressable>
          )}
        </View>

        {/* Center Section */}
        <Text style={styles.titleStyle}>
          {title}
        </Text>

        {/* Right Section - Keeps title centered even if empty */}
        <View style={styles.sideContainer}>
          {rightIcon ? (
            <Pressable
              onPress={onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ alignItems: 'flex-end' }}
            >
              {rightIcon}
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Subtle Divider to match image */}
      <View style={styles.divider} />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginTop: 5
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    height: moderateScaleVertical(56), // Standard header height
  },
  sideContainer: {
    minWidth: moderateScale(40),
    justifyContent: 'center',
  },
  backButton: {
    alignItems: 'flex-start',
  },
  titleStyle: {
    flex: 1,
    textAlign: 'center',
    fontSize: textScale(18),
    fontWeight: '700', // Bold as seen in the image
    color: '#1A1C1E', // Darker charcoal color
    fontFamily: fonts.outfitMedium,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6', // Light gray divider as seen in image
  },
});