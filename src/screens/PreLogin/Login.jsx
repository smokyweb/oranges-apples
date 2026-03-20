import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { signInAction, userAccountAction } from '../../../store/auth/auth.action';
import { LoadingStatus } from '../../helper/strings';
import WrapperContainer from '../../components/WrapperContainer';
import CustomInput from '../../components/CustomInput';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import CustomAlert from '../../components/CustomAlert';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import { images } from '../../resources/images';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Spacer from '../../components/Spacer';
import SharedPreference from '../../helper/SharedPreference';
const { width } = Dimensions.get('window');

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const dispatch = useDispatch();
  const { signInLoadingStatus, signInError } = useSelector(state => state.authReducer);
  const isLoading = signInLoadingStatus === LoadingStatus.LOADING;

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    const savedData = await SharedPreference.getItem(SharedPreference.keys.USER_DATA);
    console.log('SavedData===>>>>>', savedData)
    if (savedData) {
      const res = JSON.parse(savedData);
      formik.setFieldValue('email', res.username);
      formik.setFieldValue('password', res.password);
      setRememberMe(true);
    }
  };

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const normalizedValues = {
          ...values,
          password: values.password.toLowerCase(),
        };
        const result = await dispatch(signInAction(normalizedValues));
        console.log('signInResp====>>>', result);

        if (result.type.endsWith('/fulfilled')) {
          dispatch(userAccountAction());
          if (rememberMe) {
            const userCred = {
              username: values.email,
              password: normalizedValues.password,
            };
            SharedPreference.setItem(SharedPreference.keys.USER_DATA, JSON.stringify(userCred));
          } else {
            SharedPreference.removeItem(SharedPreference.keys.USER_DATA);
          }
        }
        else {
          setShowAlert(true);
        }
      } catch (error) {
        console.log('Login error:', error);
        setShowAlert(true);
      }
    },
  });

  const isWeb = Platform.OS === 'web';

  // Shared form JSX used in both mobile and web layouts
  const formContent = (
    <View style={isWeb ? styles.webFormSection : styles.formSection}>
      <View style={styles.titleContainer}>
        <Text style={isWeb ? styles.webTitleText : styles.titleText}>Hello Healthy.</Text>
        <View style={styles.accentBar} />
        {isWeb && <Text style={styles.webSubtitle}>Sign in to your account</Text>}
      </View>

      <CustomInput
        label="Email Address"
        placeholder="Enter Email Address"
        leftIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="mail" size={18} color="#9CA3AF" />}
        value={formik.values.email}
        onChangeText={formik.handleChange('email')}
        onBlur={formik.handleBlur('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        error={formik.touched.email && formik.errors.email}
        errorText={formik.errors.email}
        containerStyle={styles.inputSpacing}
      />

      <CustomInput
        label="Password"
        placeholder="Enter Password"
        secureTextEntry={true}
        autoCapitalize="none"
        leftIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="lock" size={18} color="#9CA3AF" />}
        rightIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="eye" size={18} color="#9CA3AF" />}
        value={formik.values.password}
        onChangeText={formik.handleChange('password')}
        onBlur={formik.handleBlur('password')}
        error={formik.touched.password && formik.errors.password}
        errorText={formik.errors.password}
        containerStyle={styles.inputSpacing}
      />

      <View style={styles.optionsRow}>
        <TouchableOpacity style={styles.rememberBtn} onPress={() => setRememberMe(!rememberMe)}>
          <CustomIcon
            origin={ICON_TYPE.IONICONS}
            name={rememberMe ? "checkbox" : "square-outline"}
            size={22}
            color="#1B4332"
          />
          <Text style={styles.optionText}>Remember Me</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => NavigationService.navigate(RouteName.RESET_PASSWORD)}>
          <Text style={styles.resetText}>Reset Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
        onPress={formik.handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.signInText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.createAccountSection}>
        <Text style={styles.createAccountLead}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => NavigationService.navigate(RouteName.SIGNUP)}>
          <Text style={styles.createAccountAction}>Create Account</Text>
        </TouchableOpacity>
      </View>
      <Spacer height={verticalScale(10)} />
    </View>
  );

  if (isWeb) {
    return (
      <WrapperContainer statusBarColor="transparent">
        <View style={styles.webContainer}>
          {/* Left panel — branding */}
          <ImageBackground source={images.login} style={styles.webHeroPanel} resizeMode="contain">
            <View style={styles.webHeroOverlay}>
              <Text style={styles.webBrandTagline}>Healthy eating made simple.</Text>
            </View>
          </ImageBackground>

          {/* Right panel — form */}
          <ScrollView
            style={styles.webFormPanel}
            contentContainerStyle={styles.webFormPanelContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {formContent}
          </ScrollView>
        </View>
      </WrapperContainer>
    );
  }

  return (
    <WrapperContainer statusBarColor="transparent">
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >

        <ImageBackground source={images.login} style={styles.heroBackground}>
          <View style={styles.svgWrapper}>
            <Svg height="60" width={width} viewBox={`0 0 ${width} 60`}>
              <Path
                d={`M0 35 C${width * 0.1} 0 ${width * 0.4} 60 ${width} 60 L${width} 60 L0 60 Z`}
                fill="white"
              />
            </Svg>
          </View>
        </ImageBackground>

        <View style={styles.formSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Hello Healthy.</Text>
            <View style={styles.accentBar} />
          </View>

          <CustomInput
            label="Email Address"
            placeholder="Enter Email Address"
            leftIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="mail" size={18} color="#9CA3AF" />}
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            error={formik.touched.email && formik.errors.email}
            errorText={formik.errors.email}
            containerStyle={styles.inputSpacing}
          />

          <CustomInput
            label="Password"
            placeholder="Enter Password"
            secureTextEntry={true}
            autoCapitalize="none"
            leftIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="lock" size={18} color="#9CA3AF" />}
            rightIcon={<CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="eye" size={18} color="#9CA3AF" />}
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            error={formik.touched.password && formik.errors.password}
            errorText={formik.errors.password}
            containerStyle={styles.inputSpacing}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberBtn}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name={rememberMe ? "checkbox" : "square-outline"}
                size={22}
                color="#1B4332"
              />
              <Text style={styles.optionText}>Remember Me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => NavigationService.navigate(RouteName.RESET_PASSWORD)}>
              <Text style={styles.resetText}>Reset Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
            onPress={formik.handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.createAccountSection}>
            <Text style={styles.createAccountLead}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => NavigationService.navigate(RouteName.SIGNUP)}>
              <Text style={styles.createAccountAction}>Create Account</Text>
            </TouchableOpacity>
          </View>
          <Spacer height={verticalScale(10)} />
        </View>
      </KeyboardAwareScrollView>

      <CustomAlert
        visible={showAlert}
        message={typeof signInError === 'string' ? signInError : signInError?.message || 'Login failed'}
        setVisible={setShowAlert}
      />
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({
  // ── Web two-column layout ──────────────────────────────────────────
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  webHeroPanel: {
    flex: 1,
    justifyContent: 'flex-end',
    // Shrink image so the full logo + "Oranges to Apples" text is visible
    backgroundSize: '48%',
    backgroundPosition: 'center 38%',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#1a4a2e',
  },
  webHeroOverlay: {
    // Thin strip at the very bottom — doesn't cover the logo area
    backgroundColor: 'rgba(10, 35, 20, 0.72)',
    paddingHorizontal: 36,
    paddingTop: 18,
    paddingBottom: 28,
  },
  webBrandTagline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  webFormPanel: {
    width: 420,
    backgroundColor: '#fff',
  },
  webFormPanelContent: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  webFormSection: {
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  webTitleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },
  webSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },
  // ── Mobile layout ──────────────────────────────────────────────────
  container: { backgroundColor: 'white' },
  heroBackground: {
    width: '100%',
    // Decreased height to 320 to show more content above the curve
    height: moderateScaleVertical(330),
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgWrapper: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 60,
  },
  formSection: {
    paddingHorizontal: moderateScale(25),
    marginTop: moderateScaleVertical(20),
  },
  titleContainer: { marginBottom: 30 },
  titleText: { fontSize: textScale(20), fontWeight: '900', color: '#111827' },
  accentBar: {
    width: 35,
    height: 5,
    backgroundColor: '#1B4332',
    marginTop: 8,
    borderRadius: 10,
  },
  inputSpacing: { marginBottom: moderateScaleVertical(15) },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 35,
  },
  rememberBtn: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: textScale(14), color: '#4B5563', marginLeft: 8, fontWeight: '500' },
  resetText: { fontSize: textScale(14), color: '#1B4332', fontWeight: '800', textDecorationLine: 'underline' },
  signInBtn: {
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
  signInBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signInText: { color: 'white', fontSize: textScale(18), fontWeight: '700' },
  errorText: {
    color: '#DC2626',
    fontSize: textScale(14),
    textAlign: 'center',
    marginBottom: moderateScaleVertical(15),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerLead: { color: '#6B7280', fontSize: textScale(14) },
  footerAction: { color: '#1B4332', fontWeight: '900', textDecorationLine: 'underline' },
  createAccountSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,

  },
  createAccountLead: { color: '#6B7280', fontSize: textScale(14) },
  createAccountAction: { color: '#1B4332', fontWeight: '900', textDecorationLine: 'underline' },
});

export default Login;