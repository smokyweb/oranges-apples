import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import axiosRequest from '../../helper/axiosRequest';
import { signUpAction, sendVerificationCodeAction, signInActionForToken } from '../../../store/auth/auth.action';

import WrapperContainer from '../../components/WrapperContainer';
import CustomButton from '../../components/CustomButton';
import Header from '../../components/Header';
import StepProgressBar from '../../components/StepProgressBar';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import { moderateScale, moderateScaleVertical, textScale } from '../../helper/responsiveSize';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';

const VerifyEmail = ({ navigation, route }) => {
  const { formData } = route?.params || {};
  const email = formData?.email || "xxx@example.com";
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const dispatch = useDispatch();


  const gradientColors = ['#FF8C00', '#22C55E'];


  const formik = useFormik({
    initialValues: { otp: ['', '', '', '', '', ''] },
    validationSchema: Yup.object().shape({
      otp: Yup.array().of(Yup.string().required('')).min(6),
    }),
    onSubmit: async (values) => {
      const otpCode = values.otp.join('');
      setLoading(true);
      setError('');
      try {
        // First verify email
        const verifyResponse = await axiosRequest({
          url: 'verify-email',
          method: 'POST',
          data: { email, code: otpCode },
        });
        
        // Only call signup if email verification was successful
        if (verifyResponse) {
          await dispatch(signUpAction({
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.confirmPassword,
          })).unwrap();
          
          // Call signInActionForToken after successful signup
          await dispatch(signInActionForToken({
            email: formData.email,
            password: formData.password,
          })).unwrap();

          // Save age + gender if collected during signup
          if (formData.age || formData.gender) {
            try {
              await axiosRequest({
                method: 'POST',
                url: 'update-profile',
                data: {
                  name: formData.fullName,
                  age: formData.age ? String(formData.age) : undefined,
                  gender: formData.gender || undefined,
                },
              });
            } catch (profileErr) {
              console.log('Profile save error (non-fatal):', profileErr);
            }
          }

          console.log('Account created and logged in successfully');
          NavigationService.navigate(RouteName.SETUP_HOUSEHOLD);
        }
      } catch (error) {
        console.log('Error:', error.response);
        setError(error?.response?.data?.error || error?.message || 'Verification failed. Please try again.');
        // Reset OTP fields on error
        formik.setFieldValue('otp', ['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setSuccessMessage('')
      } finally {
        setLoading(false);
      }
    },
  });
  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await dispatch(sendVerificationCodeAction({ email: formData.email }));
      setSuccessMessage('Verification code sent successfully!');
      console.log('Verification code resent');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...formik.values.otp];
    newOtp[index] = value;
    formik.setFieldValue('otp', newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !formik.values.otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };


  return (
    <WrapperContainer>
      <Header title="Verify Email" onBackPress={() => navigation.goBack()} />
     <ScrollView 
        
        showsVerticalScrollIndicator={false}
      >
      <StepProgressBar currentStep={2} totalSteps={4} />

      <View style={styles.mainContent}>
    
        <LinearGradient
           colors={gradientColors}
           start={{ x: 0, y: 0 }} 
           end={{ x: 1, y: 1 }}   
           style={styles.iconCircle}
        >
           <CustomIcon 
             origin={ICON_TYPE.IONICONS} 
             name="mail" 
             size={40} 
             color={colors.white} 
           />
        </LinearGradient>

        <Text style={styles.title}>Verify Your Email</Text>
        
        <Text style={styles.subtitle}>
          We sent a verification code to{'\n'}
          <Text style={styles.emailBold}>{email}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {formik.values.otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={[
                styles.otpInput,
                formik.values.otp[index] ? styles.activeInput : styles.inactiveInput
              ]}
              maxLength={1}
              keyboardType="number-pad"
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              value={digit}
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.noCodeText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResendCode} disabled={resendLoading}>
            {resendLoading ? (
              <ActivityIndicator size="small" color="#28C76F" />
            ) : (
              <Text style={styles.resendText}>Resend code</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null} */}

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <TouchableOpacity 
          style={[styles.btnStyle, { opacity: formik.values.otp.join('').length === 6 && !loading ? 1 : 0.5 }]} 
          onPress={formik.handleSubmit}
          disabled={formik.values.otp.join('').length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.btnText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.changeEmailBtn}>
          <Text style={styles.changeEmailText}>Change email address</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      
    </WrapperContainer>
  );
};

export default VerifyEmail;

const styles = StyleSheet.create({

  mainContent: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  iconCircle: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScaleVertical(20),
    marginBottom: moderateScaleVertical(24),
  },

  title: {
    fontSize: textScale(22),
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginBottom: moderateScaleVertical(8),
  },
  subtitle: {
    fontSize: textScale(14),
    color: 'gray',
    textAlign: 'center',
    lineHeight: textScale(20),
  },
  emailBold: {
    color: '#1A1C1E',
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: moderateScaleVertical(30),
    marginBottom: moderateScaleVertical(20),
  },
  otpInput: {
    width: moderateScale(45),
    height: moderateScale(55),
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: textScale(18),
    fontWeight: 'bold',
    color: colors.black,
  },
  inactiveInput: {
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
  },
  activeInput: {
    borderColor: '#28C76F',
    backgroundColor: colors.white,
  },
  resendRow: {
    flexDirection: 'row',
    marginBottom: moderateScaleVertical(40),
  },
  noCodeText: {
    color: 'gray',
    fontSize: textScale(13),
  },
  resendText: {
    color: '#28C76F',
    fontWeight: 'bold',
    fontSize: textScale(13),
  },
  btnStyle: {
    backgroundColor: '#28C76F',
    width: '100%',
    height: moderateScaleVertical(54),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: textScale(16),
    fontWeight: '600',
  },
  changeEmailBtn: {
    marginTop: moderateScaleVertical(20),
  },
  changeEmailText: {
    color: 'gray',
    fontSize: textScale(14),
  },
  errorText: {
    color: '#DC2626',
    fontSize: textScale(14),
    textAlign: 'center',
    marginBottom: moderateScaleVertical(15),
  },
  successText: {
    color: '#28C76F',
    fontSize: textScale(14),
    textAlign: 'center',
    marginBottom: moderateScaleVertical(15),
  },
});