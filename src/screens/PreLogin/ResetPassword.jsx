import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFormik } from 'formik';
import WrapperContainer from '../../components/WrapperContainer';
import CustomInput from '../../components/CustomInput';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import { images } from '../../resources/images';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

const ResetPassword = () => {
  const formik = useFormik({
    initialValues: { email: '' },
    onSubmit: (values) => {
      console.log(values);
      // Handle reset password logic
    },
  });

  return (
    <WrapperContainer>
      <Header title={'Reset Password'} onBackPress={() => NavigationService.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
      >


        <View style={styles.formSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Reset Password</Text>
            <View style={styles.accentBar} />
          </View>

          <Text style={styles.description}>
            Enter your email address and we'll send you a code to reset your password.
          </Text>

          <CustomInput
            label="Email Address"
            placeholder="Enter Email Address"
            leftIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="mail" size={18} color="#9CA3AF" />}
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            containerStyle={styles.inputSpacing}
          />

          <TouchableOpacity style={styles.resetBtn} onPress={formik.handleSubmit}>
            <Text style={styles.resetBtnText}>Send Reset Link</Text>
          </TouchableOpacity>

          <View style={styles.backToLoginSection}>
            <Text style={styles.backToLoginLead}>Remember your password? </Text>
            <TouchableOpacity onPress={() => NavigationService.goBack()}>
              <Text style={styles.backToLoginAction}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({

  formSection: {
    paddingHorizontal: moderateScale(25),
    marginTop: moderateScaleVertical(10),
  },
  titleContainer: { marginBottom: 20 },
  titleText: { fontSize: textScale(20), fontWeight: '900', color: '#111827' },
  accentBar: {
    width: 35,
    height: 5,
    backgroundColor: '#1B4332',
    marginTop: 8,
    borderRadius: 10,
  },
  description: {
    fontSize: textScale(14),
    color: '#6B7280',
    marginBottom: 30,
    lineHeight: 20,
  },
  inputSpacing: { marginBottom: moderateScaleVertical(30) },
  resetBtn: {
    backgroundColor: '#1B4332',
    height: moderateScaleVertical(58),
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  resetBtnText: { color: 'white', fontSize: textScale(18), fontWeight: '700' },
  backToLoginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    paddingBottom: 30,
  },
  backToLoginLead: { color: '#6B7280', fontSize: textScale(14) },
  backToLoginAction: { color: '#1B4332', fontWeight: '900', textDecorationLine: 'underline' },
});

export default ResetPassword;