import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosRequest from '../../helper/axiosRequest';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import CustomInput from '../../components/CustomInput';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';

// Validation Schema for the Contact Form
const contactSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  message: Yup.string().required('Message is required'),
});

const ContactUs = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: { name: '', email: '', message: '' },
    validationSchema: contactSchema,
    onSubmit: async values => {
      try {
        setLoading(true);

        const response = await axiosRequest({
          url: 'contact-us',
          method: 'POST',
          data: values,
        });

        if (response) {
          Alert.alert('Success', 'Message sent successfully!');
          formik.resetForm();
        } else {
          Alert.alert('Error', response?.message || 'Something went wrong.');
        }
      } catch (error) {
        console.error('Submission Error:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <WrapperContainer>
      {/* Header section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon origin={ICON_TYPE.IONICONS} name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
      
          <View style={styles.supportCard}>
            <View style={styles.iconCircle}>
              <CustomIcon origin={ICON_TYPE.FEATHER} name="mail" size={20} color="#2563EB" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportLabel}>Email Support</Text>
              <Text style={styles.supportEmail}>support@email.com</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send us a message</Text>

            <CustomInput
              label="Name"
              placeholder="Your full name"
              value={formik.values.name}
              onChangeText={formik.handleChange('name')}
              error={formik.touched.name && formik.errors.name}
            />

            <CustomInput
              label="Email"
              placeholder="your@email.com"
              keyboardType="email-address"
              value={formik.values.email}
              onChangeText={formik.handleChange('email')}
              error={formik.touched.email && formik.errors.email}
            />

            <CustomInput
              label="Message"
              placeholder="How can we help you?"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              inputStyle={{ height: moderateScaleVertical(120), paddingTop: 12 }}
              value={formik.values.message}
              onChangeText={formik.handleChange('message')}
              error={formik.touched.message && formik.errors.message}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
              onPress={formik.handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
  },
  headerTitle: {
    fontSize: textScale(18),
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScaleVertical(30),
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: moderateScaleVertical(20),
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTextContainer: {
    marginLeft: moderateScale(12),
  },
  supportLabel: {
    fontSize: textScale(14),
    fontWeight: '700',
    color: '#1F2937',
  },
  supportEmail: {
    fontSize: textScale(13),
    color: '#6B7280',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  formTitle: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScaleVertical(20),
  },
  submitBtn: {
    backgroundColor: '#536DFE', // Blue shade as seen in the design
    height: moderateScaleVertical(50),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScaleVertical(10),
  },
  submitBtnText: {
    color: '#fff',
    fontSize: textScale(15),
    fontWeight: '600',
  },
});

export default ContactUs;