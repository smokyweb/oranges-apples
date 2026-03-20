import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { addFamilyMember, getFamilyMembers } from '../../../store/home/home.action';
import axios from 'axios';

import WrapperContainer from '../../components/WrapperContainer';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import ImagePickerModal from '../../components/ImagePickerModal';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import NavigationService from '../../navigation/NavigationService';
import { LoadingStatus, RouteName } from '../../helper/strings';
import axiosRequest from '../../helper/axiosRequest';

const AddMember = ({ navigation, route }) => {
  const { memberData } = route?.params || {};
  console.log('MemberData--->>', memberData)
  const dispatch = useDispatch();
  const { addMemberLoading } = useSelector(state => state.homeReducer);
  const [isCustomModalVisible, setCustomModalVisible] = useState(false);
  const [customAllergyName, setCustomAllergyName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [allergyOptions, setAllergyOptions] = useState([
    'Peanuts',
    'Tree Nuts',
    'Dairy',
    'Eggs',
    'Soy',
    'Wheat/Gluten',
    'Shellfish',
    'Fish',
    'Sesame',
  ]);

  const activityLevels = [
    {
      id: 'sedentary',
      title: 'Sedentary',
      sub: 'Little to no exercise',
      icon: 'bed-outline',
    },
    {
      id: 'lightly',
      title: 'Lightly Active',
      sub: 'Exercise 1-3 days/week',
      icon: 'walk-outline',
    },
    {
      id: 'moderately',
      title: 'Moderately Active',
      sub: 'Exercise 3-5 days/week',
      icon: 'fitness-outline',
    },
    {
      id: 'very',
      title: 'Very Active',
      sub: 'Exercise 6-7 days/week',
      icon: 'barbell-outline',
    },
    {
      id: 'extremely',
      title: 'Extremely Active',
      sub: 'Intense daily exercise',
      icon: 'stopwatch-outline',
    },
  ];
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    sex: Yup.string().required('Sex is required'),
    age: Yup.number().min(0, 'Age must be at least 0').max(200, 'Age must be at most 200').required('Age is required'),
  });

  const formik = useFormik({
    initialValues: {
      profileImage: memberData?.profile_image || null,
      name: memberData?.name || '',
      sex: memberData?.gender || 'Male',
      age: parseInt(memberData?.age) || 25,
      heightFeet: memberData?.height_feet || '',
      heightInches: memberData?.height_inches || '',
      weight: memberData?.weight || '',
      activityLevel: memberData?.physical_activity_level || 'moderately',
      allergies: memberData?.allergies || [],
    },
    validationSchema,
    onSubmit: async values => {
      try {
        console.log('Submitting values:', values);
        if (memberData?.id) {
          // Update existing member
          setIsUpdating(true);
          await updateFamilyMemberLocal(values);
          setIsUpdating(false);
        } else {
          // Add new member
          const result = await dispatch(addFamilyMember(values));
          console.log('Add member result:', result);
        }
        // Refresh family members list
        dispatch(getFamilyMembers());
        NavigationService.goBack();
      } catch (error) {
        setIsUpdating(false);
        console.log('Add/Update member error:', error);
        console.log('Error details:', error.response?.data || error.message);
      }
    },
  });

  const updateFamilyMemberLocal = async (values) => {
    const formData = new FormData();
    
    if (values.profileImage) {
      formData.append('profile_image', {
        uri: values.profileImage,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
    }
    
    formData.append('name', values.name);
    formData.append('gender', values.sex);
    formData.append('age', values.age.toString());
    formData.append('height_feet', values.heightFeet || '');
    formData.append('height_inches', values.heightInches || '');
    formData.append('weight', values.weight || '');
    formData.append('physical_activity_level', values.activityLevel);  
    formData.append('_method', 'PUT');
    
    values.allergies.forEach(allergy => {
      formData.append('allergies[]', allergy);
    });

    const response = await axiosRequest({
      url: `family-members/${memberData.id}`,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  };





  const longPressIntervalRef = useRef(null);
  const ageValueRef = useRef(formik.values.age);

  const startDecrementLongPress = () => {
    ageValueRef.current = formik.values.age;
    longPressIntervalRef.current = setInterval(() => {
      ageValueRef.current = Math.max(0, ageValueRef.current - 1);
      formik.setFieldValue('age', ageValueRef.current);
    }, 100);
  };

  const startIncrementLongPress = () => {
    ageValueRef.current = formik.values.age;
    longPressIntervalRef.current = setInterval(() => {
      ageValueRef.current = Math.min(200, ageValueRef.current + 1);
      formik.setFieldValue('age', ageValueRef.current);
    }, 100);
  };

  const stopLongPress = () => {
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
  };



  const chooseFromGallery = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.7,
    })
      .then(image => {
        formik.setFieldValue('profileImage', image.path);
        setModalVisible(false);
      })
      .catch(err => console.log(err));
  };

  const takePhoto = () => {
    ImagePicker.openCamera({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.7,
    })
      .then(image => {
        formik.setFieldValue('profileImage', image.path);
        setModalVisible(false);
      })
      .catch(err => console.log(err));
  };

  const toggleAllergy = item => {
    const current = [...formik.values.allergies];
    const index = current.indexOf(item);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(item);
    }
    formik.setFieldValue('allergies', current);
  };

  const handleAddCustomAllergy = () => {
    if (customAllergyName.trim().length > 0) {
      const newAllergy = customAllergyName.trim();

      if (!allergyOptions.includes(newAllergy)) {
        setAllergyOptions([...allergyOptions, newAllergy]);
      }

      if (!formik.values.allergies.includes(newAllergy)) {
        formik.setFieldValue('allergies', [
          ...formik.values.allergies,
          newAllergy,
        ]);
      }

   
      setCustomAllergyName('');
      setCustomModalVisible(false);
    }
  };

  return (
    <WrapperContainer>
      {(addMemberLoading === LoadingStatus.LOADING || isUpdating) && (
        <Modal transparent={true} visible={true}>
          <View style={styles.loaderContainer}>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loaderText}>
                {isUpdating ? 'Updating...' : 'Saving...'}
              </Text>
            </View>
          </View>
        </Modal>
      )}
      
      <Header
        title={memberData ? 'Edit Family Member' : 'Add Family Member'}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Upload Section */}
        <View style={styles.photoContainer}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.photoCircle}>
              {formik.values.profileImage ? (
                <Image
                  source={{ uri: formik.values.profileImage }}
                  style={styles.selectedImage}
                />
              ) : (
                <CustomIcon
                  origin={ICON_TYPE.IONICONS}
                  name="camera"
                  size={30}
                  color="gray"
                />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addPhotoText}>
              {formik.values.profileImage ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Basic Information</Text>
        <CustomInput
          label="Name *"
          placeholder="Enter name"
          value={formik.values.name}
          onChangeText={formik.handleChange('name')}
          onBlur={formik.handleBlur('name')}
          error={formik.touched.name && formik.errors.name}
          errorText={formik.errors.name}
        />
        <Text style={styles.subLabel}>Sex *</Text>
        <View style={styles.row}>
          {['Male', 'Female', 'Other'].map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.tab,
                formik.values.sex === item && styles.activeTab,
              ]}
              onPress={() => formik.setFieldValue('sex', item)}
            >
              <Text
                style={[
                  styles.tabText,
                  formik.values.sex === item && styles.activeTabText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>Age *</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => formik.setFieldValue('age', Math.max(0, formik.values.age - 1))}
            onLongPress={startDecrementLongPress}
            onPressOut={stopLongPress}
            delayLongPress={500}
          >
            <CustomIcon
              origin={ICON_TYPE.IONICONS}
              name="remove"
              size={20}
              color="#1A1C1E"
            />
          </TouchableOpacity>

          <View style={styles.ageValueContainer}>
            <Text style={styles.ageText}>{formik.values.age}</Text>
          </View>

          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => formik.setFieldValue('age', Math.min(200, formik.values.age + 1))}
            onLongPress={startIncrementLongPress}
            onPressOut={stopLongPress}
            delayLongPress={500}
          >
            <CustomIcon
              origin={ICON_TYPE.IONICONS}
              name="add"
              size={20}
              color="#1A1C1E"
            />
          </TouchableOpacity>
        </View>

        {/* Physical Details Section */}
        <Text style={styles.sectionTitle}>Physical Details</Text>

        <Text style={styles.subLabel}>Height</Text>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, marginRight: moderateScale(12) }}>
            <CustomInput
              placeholder="5"
              keyboardType="number-pad"
              value={formik.values.heightFeet}
              onChangeText={formik.handleChange('heightFeet')}
            />
            <Text style={styles.unitText}>feet</Text>
          </View>
          <View style={{ flex: 1 }}>
            <CustomInput
              placeholder="8"
              keyboardType="number-pad"
              value={formik.values.heightInches}
              onChangeText={formik.handleChange('heightInches')}
            />
            <Text style={styles.unitText}>inches</Text>
          </View>
        </View>

        <Text style={styles.subLabel}>Weight</Text>
        <CustomInput
          placeholder="150"
          keyboardType="number-pad"
          value={formik.values.weight}
          onChangeText={formik.handleChange('weight')}
        />
        <Text style={styles.unitText}>Pounds</Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <CustomIcon
            origin={ICON_TYPE.IONICONS}
            name="information-circle"
            size={20}
            color="#2196F3"
          />
          <Text style={styles.infoText}>
            Height and weight help us provide accurate nutrition calculations
            and personalized recommendations.
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Physical Activity Level</Text>
        {activityLevels.map(item => {
          const isActive = formik.values.activityLevel === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.activityItem,
                isActive && styles.activeActivityItem,
              ]}
              onPress={() => formik.setFieldValue('activityLevel', item.id)}
            >
              <View style={styles.iconContainer}>
                <CustomIcon
                  origin={ICON_TYPE.IONICONS}
                  name={item.icon}
                  size={24}
                  color={isActive ? '#28C76F' : '#6B7280'}
                />
              </View>
              <View style={styles.activityTextContent}>
                <Text
                  style={[
                    styles.activityTitle,
                    isActive && styles.activeGreenText,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.activitySub}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* --- ALLERGIES SECTION --- */}
        <Text style={styles.sectionTitle}>
          Allergies & Dietary Restrictions
        </Text>
        <Text style={styles.subLabel}>Select any allergies</Text>

        <View style={styles.chipContainer}>
          {allergyOptions.map(item => {
            const isSelected = formik.values.allergies.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => toggleAllergy(item)}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.activeChipText]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.addCustomBtn}
          onPress={() => setCustomModalVisible(true)}
        >
          <Text style={styles.addCustomText}>+ Add Custom</Text>
        </TouchableOpacity>
        <CustomButton
          title={memberData ? 'Update Family Member' : 'Add Family Member'}
          useGradient
          onPress={formik.handleSubmit}
          style={{ marginTop: verticalScale(30) }}
        />
        {/* <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => NavigationService.navigate(RouteName.LOGIN)}
        >
          <Text style={styles.skipText}>Cancel</Text>
        </TouchableOpacity> */}
      </ScrollView>

      <ImagePickerModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onTakePhoto={takePhoto}
        onChooseFromGallery={chooseFromGallery}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCustomModalVisible}
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCustomModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Allergy</Text>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. Strawberries"
              value={customAllergyName}
              onChangeText={setCustomAllergyName}
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCustomAllergyName('');
                  setCustomModalVisible(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleAddCustomAllergy}
              >
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </WrapperContainer>
  );
};

export default AddMember;

const styles = StyleSheet.create({
  container: { padding: moderateScale(20), paddingBottom: 50 },
  photoContainer: { alignItems: 'center', marginVertical: 20 },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedImage: { width: '100%', height: '100%' },
  addPhotoText: { color: '#28C76F', marginTop: 10, fontWeight: '600' },
  sectionTitle: {
    fontSize: textScale(16),
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginTop: 25,
    marginBottom: 15,
  },

  // Modal Styles for custom allergy modal only
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    padding: moderateScale(20),
    paddingBottom: moderateScaleVertical(40),
  },
  sectionTitle: {
    fontSize: textScale(18),
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginTop: moderateScaleVertical(25),
    marginBottom: moderateScaleVertical(15),
  },
  subLabel: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: moderateScaleVertical(8),
    marginTop: moderateScaleVertical(12),
  },
  row: {
    flexDirection: 'row',
    marginBottom: moderateScaleVertical(10),
  },
  tab: {
    flex: 1,
    height: moderateScaleVertical(48),
    borderWidth: 1,
    borderColor: colors.textColor,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  activeTab: {
    borderColor: '#1A1C1E',
  },
  tabText: {
    color: '#6B7280',
    fontSize: textScale(14),
  },
  activeTabText: {
    color: '#1A1C1E',
    fontWeight: 'bold',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: moderateScaleVertical(54),
    backgroundColor: '#F9FAFB',
  },
  counterBtn: {
    width: moderateScale(50),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageValueContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
  },
  ageText: {
    fontWeight: 'bold',
    fontSize: textScale(16),
    color: '#1A1C1E',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitText: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginTop: moderateScaleVertical(-8),
    marginBottom: moderateScaleVertical(15),
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: moderateScale(12),
    borderRadius: 8,
    marginTop: moderateScaleVertical(10),
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: textScale(12),
    color: '#1976D2',
    marginLeft: moderateScale(8),
    lineHeight: textScale(18),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: moderateScaleVertical(12),
    backgroundColor: colors.white,
  },
  activeActivityItem: {
    borderColor: '#28C76F',
    backgroundColor: '#F0FDF4', // Light green tint
  },
  iconContainer: { marginRight: moderateScale(16) },
  activityTextContent: { flex: 1 },
  activityTitle: {
    fontSize: textScale(16),
    fontWeight: 'bold',
    color: '#1A1C1E',
  },
  activeGreenText: { color: '#28C76F' },
  activitySub: { fontSize: textScale(12), color: '#6B7280', marginTop: 2 },

  // Allergy Chip Styles
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScaleVertical(8),
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: moderateScale(8),
    marginBottom: moderateScaleVertical(10),
  },
  activeChip: { backgroundColor: '#28C76F' },
  chipText: { fontSize: textScale(13), color: '#4B5563' },
  activeChipText: { color: colors.white, fontWeight: 'bold' },
  addCustomBtn: { marginTop: moderateScaleVertical(5) },
  addCustomText: {
    color: '#28C76F',
    fontWeight: '600',
    fontSize: textScale(14),
  },

  cancelBtn: { alignItems: 'center', marginTop: moderateScaleVertical(20) },
  cancelText: { color: '#6B7280', fontWeight: '600', fontSize: textScale(14) },
  addCustomBtn: { marginTop: 10, marginBottom: 30 },
  addCustomText: { color: '#28C76F', fontWeight: '600', fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginBottom: 15,
  },
  customInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1A1C1E',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 10, marginRight: 10 },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  confirmBtn: {
    backgroundColor: '#28C76F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmText: { color: 'white', fontWeight: 'bold' },
  rightIcon: {
    color: '#28C76F',
    fontSize: textScale(14),
    fontWeight: '500',
  },
  skipBtn: {
    alignItems: 'center',
    marginVertical: moderateScaleVertical(20),
  },
  skipText: {
    fontSize: textScale(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: textScale(16),
    color: colors.black,
  },
});
