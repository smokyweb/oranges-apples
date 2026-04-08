import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { sendVerificationCodeAction } from '../../../store/auth/auth.action';
import { LoadingStatus } from '../../helper/strings';

import WrapperContainer from '../../components/WrapperContainer';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput'; // Adjust path
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import StepProgressBar from '../../components/StepProgressBar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
const SignUp = ({ navigation }) => {
  const dispatch = useDispatch();
  const { sendVerificationCodeLoadingStatus, sendVerificationCodeError } = useSelector(state => state.authReducer);

  const isLoading = sendVerificationCodeLoadingStatus === LoadingStatus.LOADING;


  const [selectedGender, setSelectedGender] = useState('');
  const [genderError, setGenderError] = useState('');

  const signupSchema = Yup.object().shape({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    age: Yup.number()
      .min(1, 'Enter a valid age')
      .max(120, 'Enter a valid age')
      .required('Age is required'),
  });


  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: '',
    },
    validationSchema: signupSchema,
    onSubmit: async (values) => {
      if (!selectedGender) {
        setGenderError('Please select your gender');
        return;
      }
      setGenderError('');
      try {
        const normalizedValues = {
          ...values,
          password: values.password.toLowerCase(),
          confirmPassword: values.confirmPassword.toLowerCase(),
          gender: selectedGender,
        };
        await dispatch(sendVerificationCodeAction({ email: values.email })).unwrap();
        NavigationService.navigate(RouteName.VERIFY_EMAIL, {
          formData: normalizedValues
        });
      } catch (error) {
        console.log('Send verification code error:', error);
        Alert.alert(
          'Alert',
          error?.error || 'Failed to send verification code. Please try again.',
          [{ text: 'OK' }]
        );
      }
    },
  });

  return (
    <WrapperContainer>
      <Header title={'Sign Up'}
        onBackPress={() => NavigationService.goBack()}
      />
      <StepProgressBar currentStep={1} totalSteps={4} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >


        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Enter your details to get started</Text>
        </View>

        {/* Form Fields */}
        <CustomInput
          label="Full Name"
          placeholder="Enter your full name"
          value={formik.values.fullName}
          onChangeText={formik.handleChange('fullName')}
          onBlur={formik.handleBlur('fullName')}
          error={formik.touched.fullName && formik.errors.fullName}
          errorText={formik.errors.fullName}

        />

        <CustomInput
          label="Email Address"
          placeholder="Enter your email address"
          keyboardType={"email-address"}
          autoCapitalize="none"
          value={formik.values.email}
          onChangeText={formik.handleChange('email')}
          onBlur={formik.handleBlur('email')}
          error={formik.touched.email && formik.errors.email}
          errorText={formik.errors.email}

        />

        <CustomInput
          label="Password"
          placeholder="Enter password"
          secureTextEntry={true}
          autoCapitalize="none"
          value={formik.values.password}
          onChangeText={formik.handleChange('password')}
          onBlur={formik.handleBlur('password')}
          error={formik.touched.password && formik.errors.password}
          errorText={formik.errors.password}

        />

        <CustomInput
          label="Confirm Password"
          placeholder="Re-enter password"
          secureTextEntry={true}
          autoCapitalize="none"
          value={formik.values.confirmPassword}
          onChangeText={formik.handleChange('confirmPassword')}
          onBlur={formik.handleBlur('confirmPassword')}
          error={formik.touched.confirmPassword && formik.errors.confirmPassword}
          errorText={formik.errors.confirmPassword}

        />

        <CustomInput
          label="Age"
          placeholder="Enter your age"
          keyboardType="numeric"
          value={formik.values.age}
          onChangeText={formik.handleChange('age')}
          onBlur={formik.handleBlur('age')}
          error={formik.touched.age && formik.errors.age}
          errorText={formik.errors.age}
        />

        {/* Gender selector */}
        <View style={styles.genderSection}>
          <Text style={styles.genderLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, selectedGender === g && styles.genderBtnActive]}
                onPress={() => { setSelectedGender(g); setGenderError(''); }}
              >
                <Text style={[styles.genderBtnText, selectedGender === g && styles.genderBtnTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.btnStyle, isLoading && styles.btnDisabled]}
          onPress={formik.handleSubmit}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.btnText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => NavigationService.navigate(RouteName.LOGIN)}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </WrapperContainer>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScaleVertical(30),
  },
  progressContainer: {
    marginTop: moderateScaleVertical(10),
    marginBottom: moderateScaleVertical(30),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScaleVertical(8),
  },
  stepText: {
    fontSize: textScale(12),
    color: colors.textColor,
    fontWeight: '500',
  },
  percentageText: {
    fontSize: textScale(12),
    color: 'gray',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#28C76F',
    borderRadius: 10,
  },
  titleSection: {
    marginBottom: moderateScaleVertical(20),
  },
  title: {
    fontSize: textScale(24),
    fontWeight: 'bold',
    color: colors.black || '#1A1A1A',
  },
  subtitle: {
    fontSize: textScale(14),
    color: 'gray',
    marginTop: moderateScaleVertical(4),
  },
  btnStyle: {
    backgroundColor: '#28C76F',
    height: moderateScaleVertical(54),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScaleVertical(10),
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  btnText: {
    color: colors.white,
    fontSize: textScale(16),
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: textScale(14),
    textAlign: 'center',
    marginBottom: moderateScaleVertical(10),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScaleVertical(20),
  },
  footerText: {
    fontSize: textScale(14),
    color: 'gray',
  },
  loginText: {
    fontSize: textScale(14),
    color: '#28C76F',
    fontWeight: 'bold',
  },
  genderSection: {
    marginBottom: moderateScaleVertical(12),
  },
  genderLabel: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: colors.black || '#1A1A1A',
    marginBottom: moderateScaleVertical(8),
  },
  genderRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  genderBtn: {
    flex: 1,
    paddingVertical: moderateScaleVertical(12),
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  genderBtnActive: {
    borderColor: '#28C76F',
    backgroundColor: '#ECFDF5',
  },
  genderBtnText: {
    fontSize: textScale(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  genderBtnTextActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});