import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import WrapperContainer from '../../components/WrapperContainer';
import Header from '../../components/Header';
import StepProgressBar from '../../components/StepProgressBar';
import CustomButton from '../../components/CustomButton';
import Spacer from '../../components/Spacer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';

const SetupHousehold = ({ navigation }) => {
  
  // 1. Validation Schema
  const householdSchema = Yup.object().shape({
    memberCount: Yup.number().min(1, 'At least 1 person required').required(),
  });

  // 2. Formik Logic
  const formik = useFormik({
    initialValues: { memberCount: 1 },
    validationSchema: householdSchema,
    onSubmit: (values) => {
      console.log('Household Members:', values.memberCount);
      NavigationService.navigate(RouteName.ADD_FAMILY_MEMBER,{
        memberCount: values.memberCount
      })
   
    },
  });


  const memberCountHoldIntervalRef = useRef(null);
  const memberCountDidHoldRef = useRef(false);
  const memberCountValueRef = useRef(1);

  useEffect(() => {
    memberCountValueRef.current = formik.values.memberCount;
  }, [formik.values.memberCount]);

  useEffect(() => () => {
    if (memberCountHoldIntervalRef.current) clearInterval(memberCountHoldIntervalRef.current);
  }, []);

  const clearMemberCountHoldRepeat = () => {
    if (memberCountHoldIntervalRef.current) {
      clearInterval(memberCountHoldIntervalRef.current);
      memberCountHoldIntervalRef.current = null;
    }
  };

  const startMemberCountHoldRepeat = (delta) => {
    memberCountDidHoldRef.current = true;
    const INITIAL_MS = 120;
    const FAST_MS = 60;
    const ACCELERATE_AFTER_MS = 1200;
    const startTime = Date.now();
    const MIN = 1;
    const MAX = 30;

    const step = () => {
      const current = memberCountValueRef.current;
      const next = Math.max(MIN, Math.min(MAX, current + delta));
      memberCountValueRef.current = next;
      formik.setFieldValue('memberCount', next);
    };

    step();

    memberCountHoldIntervalRef.current = setInterval(() => {
      if (Date.now() - startTime > ACCELERATE_AFTER_MS) {
        clearInterval(memberCountHoldIntervalRef.current);
        memberCountHoldIntervalRef.current = setInterval(step, FAST_MS);
      } else {
        step();
      }
    }, INITIAL_MS);
  };

  const increment = () => formik.setFieldValue('memberCount', Math.min(30, formik.values.memberCount + 1));
  const decrement = () => {
    if (formik.values.memberCount > 1) {
      formik.setFieldValue('memberCount', formik.values.memberCount - 1);
    }
  };

  return (
    <WrapperContainer>
      <Header title="Setup Household" onBackPress={() => navigation.goBack()} />
      
      <StepProgressBar currentStep={3} totalSteps={4} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Tell us about your household</Text>
          <Text style={styles.subtitle}>
            This helps us create personalized shopping lists
          </Text>

          <Text style={styles.questionText}>How many people in your household?</Text>

          {/* Counter UI Component */}
          <View style={styles.counterWrapper}>
            <Pressable
              style={styles.counterBtn}
              delayLongPress={400}
              onLongPress={() => startMemberCountHoldRepeat(-1)}
              onPressOut={clearMemberCountHoldRepeat}
              onPress={() => {
                if (memberCountDidHoldRef.current) {
                  memberCountDidHoldRef.current = false;
                  return;
                }
                decrement();
              }}
            >
              <View style={styles.iconCircleGray}>
                <CustomIcon 
                    origin={ICON_TYPE.IONICONS} 
                    name="remove" 
                    size={24} 
                    color="#1A1C1E" 
                />
              </View>
            </Pressable>

            <Text style={styles.countText}>{formik.values.memberCount}</Text>

            <Pressable
              style={styles.counterBtn}
              delayLongPress={400}
              onLongPress={() => startMemberCountHoldRepeat(1)}
              onPressOut={clearMemberCountHoldRepeat}
              onPress={() => {
                if (memberCountDidHoldRef.current) {
                  memberCountDidHoldRef.current = false;
                  return;
                }
                increment();
              }}
            >
              <View style={styles.iconCircleGreen}>
                <CustomIcon 
                    origin={ICON_TYPE.IONICONS} 
                    name="add" 
                    size={24} 
                    color={colors.white} 
                />
              </View>
            </Pressable>
          </View>

          <Text style={styles.footerNote}>
            You will fill their information in on the following screens.
          </Text>
        </View>

        {/* Using the CustomButton created earlier */}
        <View style={styles.buttonFooter}>
          <CustomButton 
            title="Continue" 
            useGradient={true}
            onPress={formik.handleSubmit}
          />
          
          <TouchableOpacity 
            style={styles.skipBtn} 
            onPress={() =>     NavigationService.navigate(RouteName.LOGIN)}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
        <Spacer height={verticalScale(40)}/>
    </WrapperContainer>
  );
};

export default SetupHousehold;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(20),
    justifyContent: 'space-between',
    paddingBottom: moderateScaleVertical(20),
  },
  content: {
    marginTop: moderateScaleVertical(10),
  },
  title: {
    fontSize: textScale(24),
    fontWeight: 'bold',
    color: '#1A1C1E',
  },
  subtitle: {
    fontSize: textScale(14),
    color: '#6B7280',
    marginTop: moderateScaleVertical(8),
    lineHeight: textScale(20),
  },
  questionText: {
    fontSize: textScale(16),
    fontWeight: '600',
    color: '#1A1C1E',
    marginTop: moderateScaleVertical(30),
    marginBottom: moderateScaleVertical(15),
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: moderateScale(15),
    height: moderateScaleVertical(80),
  },
  counterBtn: {
    padding: moderateScale(5),
  },
  iconCircleGray: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleGreen: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: 24,
    backgroundColor: '#28C76F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: textScale(28),
    fontWeight: 'bold',
    color: '#1A1C1E',
  },
  footerNote: {
    fontSize: textScale(14),
    color: '#6B7280',
    marginTop: moderateScaleVertical(20),
    lineHeight: textScale(20),
  },
  buttonFooter: {
    marginTop: moderateScaleVertical(40),
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: moderateScaleVertical(15),
  },
  skipText: {
    fontSize: textScale(14),
    color: '#6B7280',
    fontWeight: '500',
  },
});