import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { logoutAction } from '../../../store/auth/auth.action';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import CustomConfirm from '../../components/CustomConfirm';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import LinearGradient from 'react-native-linear-gradient';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';

const More = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dispatch = useDispatch();
  const menuItems = [
    {
      id: 1,
      title: 'About Us',
      icon: 'information-circle',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#FF8A65',
      backgroundColor: '#FFF3E0',
onPress: () => NavigationService.navigate(RouteName.ABOUT_US),
    },
    {
      id: 2,
      title: 'Contact Us',
      icon: 'mail',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#4CAF50',
      backgroundColor: '#E8F5E9',
      onPress: () => NavigationService.navigate(RouteName.CONTACT_US),
    },
    {
      id: 3,
      title: 'F.A.Q',
      icon: 'help-circle',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#FF8A65',
      backgroundColor: '#FFF3E0',
      onPress: () => NavigationService.navigate(RouteName.FAQ),
    },
    {
      id: 4,
      title: 'News (Blog)',
      icon: 'newspaper',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#4CAF50',
      backgroundColor: '#E8F5E9',
      onPress: () => NavigationService.navigate(RouteName.NEWS),
    },
    {
      id: 5,
      title: 'Privacy Policy',
      icon: 'shield-checkmark',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#FF8A65',
      backgroundColor: '#FFF3E0',
      onPress: () => NavigationService.navigate(RouteName.PRIVACY_POLICY),
    },
    {
      id: 6,
      title: 'Terms of Service',
      icon: 'document-text',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#4CAF50',
      backgroundColor: '#E8F5E9',
      onPress: () => NavigationService.navigate(RouteName.TERMS_AND_CONDITIONS),
    },
    {
      id: 7,
      title: 'Logout',
      icon: 'log-out',
      iconType: ICON_TYPE.IONICONS,
      iconColor: '#EF4444',
      backgroundColor: '#FEF2F2',
      onPress: () => setShowLogoutConfirm(true),
    },
  ];



  return (
    <WrapperContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#FF6B35', '#4CAF50']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.logoIcon}
          >
            <CustomIcon name={'apple-alt'} origin={ICON_TYPE.FONT_AWESOME5} color={'#fff'} size={20} />
          </LinearGradient>
          <Text style={styles.logoText}>Oranges to Apples</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <CustomIcon origin={ICON_TYPE.FONT_AWESOME} name="bell" size={22} color={'#4B5563'} />
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>More</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
                <CustomIcon
                  origin={item.iconType}
                  name={item.icon}
                  size={20}
                  color={item.iconColor}
                />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <CustomIcon
              origin={ICON_TYPE.IONICONS}
              name="chevron-forward"
              size={16}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ))}

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
      
      <CustomConfirm
        visible={showLogoutConfirm}
        title="Logout"
        description="Are you sure you want to logout?"
        okButtonText="Logout"
        cancelButtonText="Cancel"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          try {
            await dispatch(logoutAction()).unwrap();
            NavigationService.navigateAndReset(RouteName.LOGIN);
          } catch (error) {
            console.log('Logout error:', error);
            NavigationService.navigateAndReset(RouteName.LOGIN);
          }
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </WrapperContainer>
  );
};

export default More;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
 
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#1A1C1E',
  },
  notifBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  mainTitle: {
    fontSize: textScale(22),
    fontWeight: '800',
    textAlign: 'center',
    color: '#1A1C1E',
    marginVertical: moderateScaleVertical(10),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: textScale(16),
    fontWeight: '500',
    color: '#1A1C1E',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(40),
  },
  versionText: {
    fontSize: textScale(12),
    color: '#9CA3AF',
  },
});