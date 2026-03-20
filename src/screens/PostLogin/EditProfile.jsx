import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useFormik } from 'formik';
import ImagePicker from 'react-native-image-crop-picker';
import ImagePickerModal from '../../components/ImagePickerModal';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import WrapperContainer from '../../components/WrapperContainer';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import { colors } from '../../resources/colors';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import axiosRequest from '../../helper/axiosRequest';
import { userAccountAction } from '../../../store/auth/auth.action';
import CustomInput from '../../components/CustomInput';

const ACTIVITY_LEVEL_TO_TITLE = {
  sedentary: 'Sedentary',
  lightly: 'Lightly Active',
  moderately: 'Moderately Active',
  very: 'Very Active',
  extremely: 'Extremely Active',
};

const getActivityLevelId = (value) => {
  if (!value) return 'moderately';
  const lower = String(value).toLowerCase();
  const byTitle = { sedentary: 'sedentary', 'lightly active': 'lightly', 'moderately active': 'moderately', 'very active': 'very', 'extremely active': 'extremely' };
  return byTitle[lower] || (activityLevels.some(a => a.id === lower) ? lower : 'moderately');
};

const activityLevels = [
  { id: 'sedentary', title: 'Sedentary', sub: 'Little to no exercise', icon: 'bed-outline' },
  { id: 'lightly', title: 'Lightly Active', sub: 'Exercise 1-3 days/week', icon: 'walk-outline' },
  { id: 'moderately', title: 'Moderately Active', sub: 'Exercise 3-5 days/week', icon: 'fitness-outline' },
  { id: 'very', title: 'Very Active', sub: 'Exercise 6-7 days/week', icon: 'barbell-outline' },
  { id: 'extremely', title: 'Extremely Active', sub: 'Intense daily exercise', icon: 'stopwatch-outline' },
];

const NUTRIENT_LEVELS = ['low', 'medium', 'high'];

const defaultAllergyOptions = [
  'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat/Gluten',
  'Shellfish', 'Fish', 'Sesame',
];

const EditProfile = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCustomModalVisible, setCustomModalVisible] = useState(false);
  const [customAllergyName, setCustomAllergyName] = useState('');
  const [allergyOptions, setAllergyOptions] = useState(defaultAllergyOptions);
  const [loading, setLoading] = useState(false);
  const { userAccount } = useSelector(store => store.authReducer);
  const dispatch = useDispatch();

  const profileSchema = Yup.object().shape({
    fullName: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string()
      .min(10, 'Phone number must be exactly 10 digits')
      .max(10, 'Phone number must be exactly 10 digits')
      .optional()
      .nullable(),
    gender: Yup.string().required('Gender is required'),
    age: Yup.number().min(1, 'Age must be at least 1').max(120).required('Age is required'),
    heightFeet: Yup.string().optional(),
    heightInches: Yup.string().optional(),
    weight: Yup.string().optional(),
    proteinAmount: Yup.string().optional(),
    fiberAmount: Yup.string().optional(),
    calciumAmount: Yup.string().optional(),
  });

  const formik = useFormik({
    initialValues: {
      profileImage: userAccount?.profile_image ?? null,
      fullName: userAccount?.name ?? '',
      email: userAccount?.email ?? '',
      phone: (userAccount?.phone_number ?? '').replace(/\D/g, '').slice(-10),
      gender: userAccount?.gender ?? 'Male',
      age: parseInt(userAccount?.age, 10) || 25,
      heightFeet: userAccount?.height_feet?.toString() ?? '',
      heightInches: userAccount?.height_inches?.toString() ?? '',
      weight: userAccount?.weight?.toString() ?? '',
      activityLevel: getActivityLevelId(userAccount?.physical_activity_level),
      allergies: Array.isArray(userAccount?.allergies) ? userAccount.allergies : [],
      nutritionalNeeds: {
        protein: userAccount?.nutritional_needs?.protein ?? 'medium',
        fiber: userAccount?.nutritional_needs?.fiber ?? 'medium',
        calcium: userAccount?.nutritional_needs?.calcium ?? 'medium',
        iron: userAccount?.nutritional_needs?.iron ?? 'medium',
      },
      proteinAmount: userAccount?.protein != null ? String(userAccount.protein) : '',
      fiberAmount: userAccount?.fiber != null ? String(userAccount.fiber) : '',
      calciumAmount: userAccount?.calcium != null ? String(userAccount.calcium) : '',
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      const formData = new FormData();

      // Only append profile_image when it's a newly selected local file (not existing URL from server)
      const isLocalFile =
        values.profileImage &&
        typeof values.profileImage === 'string' &&
        !values.profileImage.startsWith('http');
      if (isLocalFile) {
        const uri = values.profileImage;
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
        formData.append('profile_image', {
          uri: uri.startsWith('file://') ? uri : (uri.startsWith('/') ? `file://${uri}` : uri),
          type: mime,
          name: `profile.${ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext}`,
        });
      }

      formData.append('name', values.fullName);
      const phoneVal = String(values.phone || '').trim();
      formData.append('phone_number', phoneVal ? `+1${phoneVal}` : '');
      formData.append('gender', values.gender);
      formData.append('age', String(values.age));
      formData.append('height_feet', String(values.heightFeet || ''));
      formData.append('height_inches', String(values.heightInches || ''));
      formData.append('weight', String(values.weight || ''));
      formData.append('physical_activity_level', ACTIVITY_LEVEL_TO_TITLE[values.activityLevel] || values.activityLevel);

      (values.allergies || []).forEach((allergy) => {
        formData.append('allergies[]', allergy);
      });

      const nut = values.nutritionalNeeds || {};
      formData.append('nutritional_needs[protein]', nut.protein || 'medium');
      formData.append('nutritional_needs[fiber]', nut.fiber || 'medium');
      formData.append('nutritional_needs[calcium]', nut.calcium || 'medium');
      formData.append('nutritional_needs[iron]', nut.iron || 'medium');

      const appendNutrientAmount = (key, val, unit) => {
        const s = String(val || '').trim();
        if (s) formData.append(key, s.includes(unit) ? s : `${s}${unit}`);
      };
      appendNutrientAmount('protein', values.proteinAmount, 'g');
      appendNutrientAmount('fiber', values.fiberAmount, 'g');
      appendNutrientAmount('calcium', values.calciumAmount, 'mg');

      setLoading(true);
      try {
        const resp = await axiosRequest({
          method: 'POST',
          url: 'update-profile',
          data: formData,
          // Do not set Content-Type: let axios set multipart/form-data with boundary
        });
        if (resp) {
          dispatch(userAccountAction());
          navigation.goBack();
        }
      } catch (error) {
        console.log('UpdateError==>>', error);
      } finally {
        setLoading(false);
      }
    },
  });

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

  const toggleAllergy = (item) => {
    const current = [...(formik.values.allergies || [])];
    const idx = current.indexOf(item);
    if (idx > -1) current.splice(idx, 1);
    else current.push(item);
    formik.setFieldValue('allergies', current);
  };

  const handleAddCustomAllergy = () => {
    const name = (customAllergyName || '').trim();
    if (!name) return;
    if (!allergyOptions.includes(name)) setAllergyOptions([...allergyOptions, name]);
    if (!(formik.values.allergies || []).includes(name)) {
      formik.setFieldValue('allergies', [...(formik.values.allergies || []), name]);
    }
    setCustomAllergyName('');
    setCustomModalVisible(false);
  };

  return (
    <WrapperContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon
            origin={ICON_TYPE.IONICONS}
            name="arrow-back"
            size={24}
            color="#1F2937"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={formik.handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setModalVisible(true)}
          >
            <Image
              source={{
                uri:
                  formik.values.profileImage ||
                  'https://www.gravatar.com/avatar/?d=mp&s=100',
              }}
              style={styles.avatarImg}
            />
            <View style={styles.cameraIcon}>
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name="camera"
                size={14}
                color="#fff"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.tapToChange}>Tap to change photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <CustomInput
            label="Full Name"
            placeholder="Enter your full name"
            value={formik.values.fullName}
            onChangeText={formik.handleChange('fullName')}
            onBlur={formik.handleBlur('fullName')}
            error={formik.touched.fullName && formik.errors.fullName}
            errorText={formik.errors.fullName}
            selectTextOnFocus
            clearable
          />
          <CustomInput
            label="Email Address"
            placeholder="Enter your email address"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            error={formik.touched.email && formik.errors.email}
            keyboardType="email-address"
            editable={false}
          />
          <CustomInput
            label="Phone Number (Optional)"
            placeholder="Enter your phone number"
            value={formik.values.phone}
            onChangeText={formik.handleChange('phone')}
            onBlur={formik.handleBlur('phone')}
            error={formik.touched.phone && formik.errors.phone}
            keyboardType="numeric"
            maxLength={10}
            errorText={formik.errors.phone}
            selectTextOnFocus
            clearable
          />

          <Text style={styles.subLabel}>Gender</Text>
          <View style={styles.row}>
            {['Male', 'Female', 'Other'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.tab, formik.values.gender === item && styles.activeTab]}
                onPress={() => formik.setFieldValue('gender', item)}
              >
                <Text style={[styles.tabText, formik.values.gender === item && styles.activeTabText]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>Age</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => formik.setFieldValue('age', Math.max(1, formik.values.age - 1))}
            >
              <CustomIcon origin={ICON_TYPE.IONICONS} name="remove" size={20} color="#1A1C1E" />
            </TouchableOpacity>
            <View style={styles.ageValueContainer}>
              <Text style={styles.ageText}>{formik.values.age}</Text>
            </View>
            <TouchableOpacity
              style={[styles.counterBtn, styles.counterBtnGreen]}
              onPress={() => formik.setFieldValue('age', Math.min(120, formik.values.age + 1))}
            >
              <CustomIcon origin={ICON_TYPE.IONICONS} name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

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
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Physical Activity Level</Text>
          {activityLevels.map((item) => {
            const isActive = formik.values.activityLevel === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.activityItem, isActive && styles.activeActivityItem]}
                onPress={() => formik.setFieldValue('activityLevel', item.id)}
              >
                <CustomIcon
                  origin={ICON_TYPE.IONICONS}
                  name={item.icon}
                  size={24}
                  color={isActive ? '#28C76F' : '#6B7280'}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityTitle, isActive && styles.activeGreenText]}>{item.title}</Text>
                  <Text style={styles.activitySub}>{item.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Allergies & Dietary Restrictions</Text>
          <Text style={styles.subLabel}>Select any allergies</Text>
          <View style={styles.chipContainer}>
            {allergyOptions.map((item) => {
              const isSelected = (formik.values.allergies || []).includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => toggleAllergy(item)}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.addCustomBtn} onPress={() => setCustomModalVisible(true)}>
            <Text style={styles.addCustomText}>+ Add Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutritional Needs</Text>
          <Text style={styles.subLabel}>Priority (high / medium / low)</Text>
          {['protein', 'fiber', 'calcium', 'iron'].map((key) => (
            <View key={key} style={styles.nutrientRow}>
              <Text style={styles.nutrientLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <View style={styles.nutrientLevelRow}>
                {NUTRIENT_LEVELS.map((level) => {
                  const isSelected = (formik.values.nutritionalNeeds || {})[key] === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[styles.levelChip, isSelected && styles.activeLevelChip]}
                      onPress={() =>
                        formik.setFieldValue('nutritionalNeeds', {
                          ...formik.values.nutritionalNeeds,
                          [key]: level,
                        })
                      }
                    >
                      <Text style={[styles.levelChipText, isSelected && styles.activeLevelChipText]}>{level}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <Text style={[styles.subLabel, { marginTop: 16 }]}>Amounts (optional)</Text>
          <CustomInput
            label="Protein (g)"
            placeholder="e.g. 50"
            value={formik.values.proteinAmount}
            onChangeText={formik.handleChange('proteinAmount')}
            keyboardType="numeric"
          />
          <CustomInput
            label="Fiber (g)"
            placeholder="e.g. 25"
            value={formik.values.fiberAmount}
            onChangeText={formik.handleChange('fiberAmount')}
            keyboardType="numeric"
          />
          <CustomInput
            label="Calcium (mg)"
            placeholder="e.g. 1000"
            value={formik.values.calciumAmount}
            onChangeText={formik.handleChange('calciumAmount')}
            keyboardType="numeric"
          />
        </View>

        {/* <TouchableOpacity style={styles.deleteBox}>
          <CustomIcon
            origin={ICON_TYPE.FONT_AWESOME5}
            name="trash"
            size={18}
            color="#EF4444"
          />
          <Text style={styles.deleteText}>Delete Account</Text>
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
        transparent
        visible={isCustomModalVisible}
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCustomModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Add Custom Allergy</Text>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. Strawberries"
              value={customAllergyName}
              onChangeText={setCustomAllergyName}
              autoFocus
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
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddCustomAllergy}>
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: colors.secondary },
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { width: 100, height: 100, position: 'relative' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 50 },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF7043',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  tapToChange: { fontSize: 12, color: '#9CA3AF', marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderColor: '#111827',
    backgroundColor: '#F9FAFB',
  },
  tabText: {
    color: '#6B7280',
    fontSize: 14,
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 54,
    backgroundColor: '#F9FAFB',
    marginBottom: 4,
  },
  ageValueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  ageText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  counterBtn: {
    width: 50,
    height: '100%',
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnGreen: {
    backgroundColor: colors.secondary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
    marginBottom: 8,
  },
  greenLink: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  activeActivityItem: {
    borderColor: '#28C76F',
    backgroundColor: '#F0FDF4',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activitySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activeGreenText: { color: '#28C76F' },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeChip: { backgroundColor: '#28C76F' },
  chipText: { fontSize: 13, color: '#4B5563' },
  activeChipText: { color: '#fff', fontWeight: '600' },
  addCustomBtn: { marginTop: 8 },
  addCustomText: { color: '#28C76F', fontWeight: '600', fontSize: 14 },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nutrientLevelRow: { flexDirection: 'row', gap: 8 },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeLevelChip: { backgroundColor: '#28C76F' },
  levelChipText: { fontSize: 13, color: '#4B5563' },
  activeLevelChipText: { color: '#fff', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  customInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  confirmBtn: {
    backgroundColor: '#28C76F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  confirmText: { color: '#fff', fontWeight: '600' },
  nutrientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  nutrientLabel: { fontSize: 14, color: '#4B5563' },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnGreen: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  stepValueText: {
    width: 50,
    textAlign: 'center',
    fontWeight: '700',
    color: '#111827',
  },
  deleteBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  deleteText: { color: '#EF4444', fontWeight: '700', marginLeft: 10 },
});

export default EditProfile;
