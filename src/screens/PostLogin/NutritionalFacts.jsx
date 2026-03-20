import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import Spacer from '../../components/Spacer';

const NutritionalFacts = ({ navigation }) => {
  const [selectedServing, setSelectedServing] = useState('1 serving (250g)');
  const [showServingDropdown, setShowServingDropdown] = useState(false);

  const servingOptions = [
    '1 serving (250g)',
    '2 servings (500g)',
    '3 servings (750g)',
    '4 servings (1kg)',
    '1/2 serving (125g)'
  ];
  // Helper to render nutrition table rows
  const NutritionRow = ({ label, value, percentage, isSubItem = false, dotColor }) => (
    <View style={[styles.rowContainer, isSubItem && { paddingLeft: moderateScale(20) }]}>
      <View style={styles.labelGroup}>
        <Text style={[styles.rowLabel, !isSubItem && { fontWeight: '700' }]}>{label}</Text>
        <Text style={styles.rowValue}> {value}</Text>
      </View>
      <View style={styles.percentageGroup}>
        <Text style={styles.percentageText}>{percentage}</Text>
        {dotColor && <View style={[styles.statusDot, { backgroundColor: dotColor }]} />}
      </View>
    </View>
  );

  return (
    <WrapperContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon origin={ICON_TYPE.IONICONS} name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutritional Facts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.recipeName}>Mediterranean Quinoa Bowl</Text>

        {/* Serving Size Selector */}
        <View style={styles.servingSelector}>
          <Text style={styles.selectorLabel}>Serving Size:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowServingDropdown(!showServingDropdown)}
            >
              <Text style={styles.dropdownText}>{selectedServing}</Text>
              <CustomIcon 
                origin={ICON_TYPE.FEATHER} 
                name={showServingDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#4B5563" 
              />
            </TouchableOpacity>
            
            {showServingDropdown && (
              <>
                <TouchableOpacity 
                  style={styles.dropdownOverlay}
                  onPress={() => setShowServingDropdown(false)}
                  activeOpacity={1}
                />
                <View style={styles.servingDropdownList}>
                  {servingOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.servingDropdownItem}
                      onPress={() => {
                        setSelectedServing(option);
                        setShowServingDropdown(false);
                      }}
                    >
                      <Text style={[styles.servingDropdownText, selectedServing === option && styles.selectedServingText]}>
                        {option}
                      </Text>
                      {selectedServing === option && (
                        <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="check" size={16} color="#28C76F" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Main Nutrition Card */}
        <View style={styles.nutritionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>Nutrition Facts</Text>
          </View>

          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesTitle}>Calories 420</Text>
            <Text style={styles.caloriesSub}>Calories from Fat 126</Text>
          </View>

          <View style={styles.thickDivider} />

          <NutritionRow label="Total Fat" value="14g" percentage="22%" dotColor="#FBBF24" />
          <NutritionRow label="Saturated Fat" value="2g" percentage="10%" isSubItem dotColor="#28C76F" />
          <NutritionRow label="Trans Fat" value="0g" percentage="0%" isSubItem dotColor="#28C76F" />
          
          <View style={styles.thinDivider} />
          <NutritionRow label="Cholesterol" value="0mg" percentage="0%" dotColor="#28C76F" />
          
          <View style={styles.thinDivider} />
          <NutritionRow label="Sodium" value="480mg" percentage="20%" dotColor="#FBBF24" />
          
          <View style={styles.thinDivider} />
          <NutritionRow label="Total Carbohydrates" value="58g" percentage="19%" dotColor="#28C76F" />
          <NutritionRow label="Dietary Fiber" value="8g" percentage="32%" isSubItem dotColor="#28C76F" />
          <NutritionRow label="Sugars" value="6g" percentage="7%" isSubItem dotColor="#28C76F" />
          
          <View style={styles.thinDivider} />
          <NutritionRow label="Protein" value="15g" percentage="30%" dotColor="#28C76F" />

          <View style={styles.thickDivider} />
          
          {/* Micronutrients Grid */}
          <View style={styles.microGrid}>
            {[
              ['Vitamin A', '45%'], ['Vitamin C', '60%'],
              ['Calcium', '8%'], ['Iron', '15%'],
              ['Potassium', '12%']
            ].map(([label, val], i) => (
              <View key={i} style={styles.microRow}>
                <Text style={styles.microLabel}>{label}</Text>
                <Text style={styles.microValue}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>How this recipe fits your goals</Text>
          
          <GoalBar label="Carbohydrates" current="58g" total="225g" color="#28C76F" progress={0.25} />
          <GoalBar label="Protein" current="15g" total="50g" color="#FF7043" progress={0.3} />
          <GoalBar label="Fat" current="14g" total="65g" color="#FBBF24" progress={0.2} />
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="shopping-cart" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add to Shopping List</Text>
        </TouchableOpacity>
        <Spacer height={verticalScale(20)} />
      </ScrollView>
    </WrapperContainer>
  );
};

// Goal Bar Sub-component
const GoalBar = ({ label, current, total, color, progress }) => (
  <View style={styles.goalContainer}>
    <View style={styles.goalTextRow}>
      <Text style={styles.goalLabel}>{label}</Text>
      <Text style={styles.goalValue}>{current} / {total}</Text>
    </View>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: moderateScale(16) },
  headerTitle: { fontSize: textScale(18), fontWeight: '700', color: '#111827' },
  scrollContent: { paddingHorizontal: moderateScale(16), paddingBottom: moderateScaleVertical(40) },
  recipeName: { fontSize: textScale(20), fontWeight: '800', color: '#1F2937', marginBottom: moderateScaleVertical(12) },
  servingSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: moderateScaleVertical(20) },
  selectorLabel: { fontSize: textScale(14), color: '#6B7280' },
  dropdownContainer: {
    position: 'relative',
    width: moderateScale(160),
  },
  dropdownOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8 },
  dropdownText: { fontSize: textScale(14), color: '#1F2937', marginRight: 8 },
  servingDropdownList: {
    position: 'absolute',
    top: moderateScaleVertical(40),
    right: 0,
    width: moderateScale(180),
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  servingDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScaleVertical(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  servingDropdownText: {
    fontSize: textScale(14),
    color: '#1F2937',
  },
  selectedServingText: {
    color: '#28C76F',
    fontWeight: '600',
  },
  nutritionCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', overflow: 'hidden' },
  cardHeader: { backgroundColor: '#1A1C1E', padding: 10 },
  cardHeaderTitle: { color: '#fff', fontSize: textScale(16), fontWeight: '700', textAlign: 'center' },
  caloriesSection: { padding: 16 },
  caloriesTitle: { fontSize: textScale(24), fontWeight: '800', color: '#1F2937' },
  caloriesSub: { fontSize: textScale(14), color: '#6B7280' },
  thickDivider: { height: 6, backgroundColor: '#1F2937' },
  thinDivider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16 },
  labelGroup: { flexDirection: 'row' },
  rowLabel: { fontSize: textScale(14), color: '#1F2937' },
  rowValue: { fontSize: textScale(14), color: '#1F2937' },
  percentageGroup: { flexDirection: 'row', alignItems: 'center' },
  percentageText: { fontSize: textScale(14), fontWeight: '700', color: '#1F2937', marginRight: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  microGrid: { padding: 16 },
  microRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  microLabel: { fontSize: textScale(14), color: '#1F2937' },
  microValue: { fontSize: textScale(14), fontWeight: '600', color: '#1F2937' },
  goalsCard: { marginTop: 24, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16 },
  goalsTitle: { fontSize: textScale(16), fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  goalContainer: { marginBottom: 16 },
  goalTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalLabel: { fontSize: textScale(14), color: '#4B5563' },
  goalValue: { fontSize: textScale(14), fontWeight: '700', color: '#1F2937' },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  addBtn: { backgroundColor: '#28C76F', height: moderateScaleVertical(50), borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  addBtnText: { color: '#fff', fontSize: textScale(16), fontWeight: '700', marginLeft: 8 },
});

export default NutritionalFacts;