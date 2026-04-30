import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import WrapperContainer from '../../components/WrapperContainer';
import NutritionalGauge from '../../components/NutritionalGauge';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import { getFamilyMembers, getShoppingLists, getFamilyNutrition, getTodayNutritionLogs, getShoppingListItems } from '../../../store/home/home.action';
import { filterTrackedNutrients, mergeWithDefaults } from '../../helper/nutrients';
import axiosRequest from '../../helper/axiosRequest';

const Home = () => {
  const dispatch = useDispatch();
  const { shoppingLists, familyMembers, familyNutrition } = useSelector(store => store.homeReducer);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedNutrient, setSelectedNutrient] = React.useState(null);
  // Summed nutrients from all shopping list items
  const [listNutrientTotals, setListNutrientTotals] = React.useState({});

  // Fetch all items across all shopping lists and sum nutrients
  const loadListNutrients = React.useCallback(async (lists) => {
    if (!lists?.length) return;
    try {
      const results = await Promise.all(
        lists.map(list =>
          axiosRequest({ method: 'GET', url: 'shopping-list-items', params: { shopping_list_id: list.id } })
            .catch(() => null)
        )
      );
      const totals = {};
      results.forEach(resp => {
        // Response shape: resp.data.data (array of items)
        const items = resp?.data?.data || resp?.data?.shoppingListItems || resp?.shoppingListItems || [];
        items.forEach(item => {
          // nutrients is a JSON object: { CALCIUM: { key, name, amount, unit }, ... }
          let nutrients = item.nutrients;
          if (typeof nutrients === 'string') {
            try { nutrients = JSON.parse(nutrients); } catch { nutrients = {}; }
          }
          if (!nutrients || typeof nutrients !== 'object') return;
          Object.entries(nutrients).forEach(([key, val]) => {
            const amount = parseFloat(val?.amount ?? val ?? 0);
            if (amount > 0) {
              totals[key.toUpperCase()] = (totals[key.toUpperCase()] || 0) + amount;
            }
          });
        });
      });
      setListNutrientTotals(totals);
    } catch {}
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    const [listsResp] = await Promise.all([
      dispatch(getShoppingLists()),
      dispatch(getFamilyMembers()),
      dispatch(getFamilyNutrition()),
    ]);
    const lists = listsResp?.payload?.data || [];
    await loadListNutrients(lists);
    setRefreshing(false);
  }, [dispatch, loadListNutrients]);

  useFocusEffect(
    useCallback(() => {
      dispatch(getShoppingLists()).then(action => {
        const lists = action?.payload?.data || [];
        loadListNutrients(lists);
      });
      dispatch(getFamilyMembers());
      dispatch(getFamilyNutrition());
    }, [dispatch, loadListNutrients])
  );

  // Also reload nutrient totals when shoppingLists updates in Redux
  useEffect(() => {
    const lists = shoppingLists?.data || [];
    if (lists.length > 0) loadListNutrients(lists);
  }, [shoppingLists, loadListNutrients]);

  useEffect(() => {
    if (!selectedNutrient && familyNutrition?.summary?.length > 0) {
      const merged = mergeWithDefaults(familyNutrition.summary);
      if (merged.length > 0) setSelectedNutrient(merged[0]);
    }
  }, [familyNutrition, selectedNutrient]);

  const totalBudget = shoppingLists?.data?.reduce((acc, item) => acc + (parseFloat(item.budget) || 0), 0) || 0;

  const nutritionScore = React.useMemo(() => {
    if (!selectedNutrient) return 0;
    const key = selectedNutrient.nutrient_key?.toUpperCase();
    // Sum from shopping list items (planned nutrition) vs family target
    const planned = listNutrientTotals[key] || 0;
    const targetValue = parseFloat(selectedNutrient.total_target_value) || 1;
    return Math.min(100, Math.round((planned / targetValue) * 100));
  }, [selectedNutrient, listNutrientTotals]);

  const SavedListCard = ({ list }) => (
    <TouchableOpacity
      onPress={() => NavigationService.navigate(RouteName.LIST_DETAILS, { listData: list })}
      style={styles.listCard}
    >
      <View style={styles.listInfo}>
        <Text style={styles.listTitle}>{list.name}</Text>
        <Text style={styles.listSub}>
          {/* {items ? `${items} items • ` : ''} */}${list.budget}
        </Text>
      </View>
      <CustomIcon
        origin={ICON_TYPE.FONT_AWESOME5}
        name="chevron-right"
        size={20}
        color="#9CA3AF"
      />
    </TouchableOpacity>
  );

  return (
    <WrapperContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FF6B35', '#4CAF50']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.logoIcon}
            >
              <CustomIcon
                name={'apple-alt'}
                origin={ICON_TYPE.FONT_AWESOME5}
                color={'#fff'}
                size={20}
              />
            </LinearGradient>
            <Text style={styles.logoText}>Oranges to Apples</Text>
          </View>
        </View>

        {/* Nutritional Targets — at top */}
        {familyNutrition?.summary?.length > 0 && (
          <View style={[styles.nutritionSection, { paddingHorizontal: moderateScale(16) }]}>
            <Text style={styles.sectionTitle}>Nutritional Targets</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nutritionHorizontalScroll}
            >
              {mergeWithDefaults(familyNutrition.summary).reduce((acc, curr, i) => {
                if (i % 2 === 0) acc.push([curr]);
                else acc[acc.length - 1].push(curr);
                return acc;
              }, []).map((chunk, colIndex) => (
                <View key={colIndex} style={styles.nutritionColumn}>
                  {chunk.map((item, index) => {
                    const isSelected = selectedNutrient?.nutrient_key === item.nutrient_key;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedNutrient(isSelected ? null : item)}
                        style={[styles.nutritionItem, isSelected && styles.nutritionItemActive]}
                      >
                        <View style={[styles.nutritionIconContainer, { backgroundColor: getNutrientColor(item.nutrient_key) }]}>
                          <CustomIcon
                            origin={ICON_TYPE.FONT_AWESOME5}
                            name={getNutrientIcon(item.nutrient_key)}
                            size={14}
                            color={colors.white}
                          />
                        </View>
                        <View style={styles.nutritionTextContainer}>
                          <Text style={styles.nutritionValue}>{item.total_target_value}</Text>
                          <Text style={styles.nutritionUnit}>{item.unit}</Text>
                        </View>
                        <Text style={styles.nutritionKey} numberOfLines={1}>{formatNutrientKey(item.nutrient_key)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Budget Status Card */}
        <View style={styles.contentPadding}>
          <View style={styles.statusCard}>
            {/* <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Budget Status</Text>
              <Text style={styles.statusOnTrack}>On Track</Text>
            </View> */}
            <View style={styles.statusRow}>
              {/* Monthly budget hidden
              <View>
                <Text style={styles.labelSmall}>Monthly</Text>
                <Text style={styles.valueLarge}>${totalBudget.toFixed(2)}</Text>
              </View>
              */}
              <View>
                <Text style={styles.labelSmall}>Household Size</Text>
                <Text style={styles.valueLarge}>{familyMembers?.length || 0} People</Text>
              </View>
            </View>
          </View>

          {Platform.OS === 'android' ? (
            <TouchableOpacity
              onPress={() =>
                NavigationService.navigate(RouteName.NEW_SHOPPING_LIST)
              }
              style={styles.actionButtonContainer}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF6B35', '#4CAF50']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradientAction}
              >
                <View style={styles.actionContent}>
                  <CustomIcon
                    origin={ICON_TYPE.IONICONS}
                    name="add"
                    size={24}
                    color={colors.white}
                  />
                  <Text style={styles.actionButtonText}>
                    Create New Shopping List
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            // <LinearGradient
            //   colors={['#FF6B35', '#4CAF50']}
            //   start={{ x: 0, y: 0.5 }}
            //   end={{ x: 1, y: 0.5 }}
            //   style={[
            //     styles.gradientAction,
            //     {
            //       justifyContent: 'center',
            //       alignItems: 'center',
            //       borderRadius: 8,
            //       width: '100%',
            //     },
            //   ]}
            // >
            //   <TouchableOpacity
            //     onPress={() =>
            //       NavigationService.navigate(RouteName.NEW_SHOPPING_LIST)
            //     }
            //     style={[
            //       styles.actionButtonContainer,
            //       {
            //         justifyContent: 'center',
            //         alignItems: 'center',
            //         borderRadius: 8,
            //         marginBottom: 40,
            //         flexDirection: 'row',
            //         alignItems: 'center',
            //         justifyContent: 'space-between',
            //       },
            //     ]}
            //     activeOpacity={0.9}
            //   >
            //     <CustomIcon
            //       origin={ICON_TYPE.IONICONS}
            //       name="add"
            //       size={24}
            //       color={colors.white}
            //     />
            //     <Text style={styles.actionButtonText}>
            //       Create New Shopping List
            //     </Text>
            //     <View />
            //   </TouchableOpacity>
            // </LinearGradient>

            <TouchableOpacity
              onPress={() =>
                NavigationService.navigate(RouteName.NEW_SHOPPING_LIST)
              }
              style={{
                backgroundColor: '#FF6B35',
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 16,
                alignContent: "center"
              }}>
              <View style={styles.actionContent}>
                <CustomIcon origin={ICON_TYPE.IONICONS} name="add" size={24} color={colors.white} />
                <Text style={styles.actionButtonText}>Create New Shopping List</Text>
              </View>
            </TouchableOpacity>
          )}




          {/* Family Nutrition Targets moved to top of screen */}

          {/* My Saved Lists Section */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>My Saved Lists</Text>
            {shoppingLists?.data?.length > 1 && (
              <TouchableOpacity
                onPress={() =>
                  NavigationService.navigate(RouteName.MY_SHOPPING_LIST)
                }
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {shoppingLists?.data?.length > 0 ? (
            shoppingLists.data.slice(0, 3).map((list, index) => (
              <SavedListCard
                key={index}
                list={list}
              />
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No Shopping List</Text>
            </View>
          )}
          {/* <SavedListCard title="Weekly Grocery Run" items={12} price="85.40" />
          <SavedListCard title="Healthy Meal Prep" items={8} price="62.15" />
          <SavedListCard
            title="Kids Lunch Essentials"
            items={6}
            price="28.90"
          /> */}
        </View>
      </ScrollView>
    </WrapperContainer>
  );
};

export default Home;

const formatNutrientKey = (key) => {
  if (!key) return '';
  return key.replace(/_/g, ' ').toUpperCase();
};

const styles = StyleSheet.create({
  header: {
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    // backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: { fontSize: textScale(16), fontWeight: '700', color: '#1F2937' },
  gasTankSection: {
    paddingVertical: moderateScaleVertical(30),
    alignItems: 'center',
  },
  sectionTitleCenter: {
    fontSize: textScale(18),
    fontWeight: '800',
    color: '#111827',
  },
  gaugeWrapper: { marginVertical: 20, alignItems: 'center' },
  gaugeBase: {
    width: 140,
    height: 70,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  gaugeFill: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#28C76F',
    marginTop: 0,
    transform: [{ rotate: '45deg' }],
  },
  gaugeLabels: {
    flexDirection: 'row',
    width: 150,
    justifyContent: 'space-between',
    marginTop: 5,
  },
  gaugeText: { fontSize: 10, color: '#6B7280' },
  gasTankSub: { fontSize: textScale(14), color: '#4B5563', fontWeight: '500' },
  contentPadding: { paddingHorizontal: moderateScale(16) },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: -10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statusTitle: { fontSize: textScale(16), fontWeight: '700', color: '#1F2937' },
  statusOnTrack: {
    fontSize: textScale(14),
    color: '#10B981',
    fontWeight: '600',
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  labelSmall: { fontSize: 12, color: '#9CA3AF' },
  labelXSmall: { fontSize: 10, color: '#9CA3AF' },
  valueLarge: {
    fontSize: textScale(18),
    fontWeight: '800',
    color: '#1F2937',
    marginVertical: 2,
  },
  actionButtonContainer: {
    marginVertical: moderateScaleVertical(20),
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF5F6D',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradientAction: { paddingVertical: 15, paddingHorizontal: 20 },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: textScale(16),
    fontWeight: '700',
    marginLeft: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: textScale(18),
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: textScale(16),
    color: '#6B7280',
    textAlign: 'center',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  listSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  nutritionSection: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  nutritionHorizontalScroll: {
    paddingVertical: 12,
  },
  nutritionColumn: {
    marginRight: 10,
  },
  nutritionItem: {
    width: moderateScale(78),
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  nutritionItemActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
  },
  gasTankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  resetBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#fff',
    fontSize: textScale(10),
    fontWeight: '700',
  },
  nutritionIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  nutritionValue: {
    fontSize: textScale(14),
    fontWeight: '800',
    color: '#1F2937',
  },
  nutritionUnit: {
    fontSize: textScale(10),
    color: '#6B7280',
    marginLeft: 2,
    fontWeight: '600',
  },
  nutritionKey: {
    fontSize: textScale(10),
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
});

const getNutrientIcon = (key) => {
  switch (key?.toLowerCase()) {
    case 'calcium': return 'cheese';
    case 'carbs': return 'bread-slice';
    case 'protein': return 'egg';
    case 'vit a': return 'carrot';
    default: return 'leaf';
  }
};

const getNutrientColor = (key) => {
  switch (key?.toLowerCase()) {
    case 'calcium': return '#60A5FA';
    case 'carbs': return '#FBBF24';
    case 'protein': return '#F87171';
    case 'vit a': return '#34D399';
    default: return '#A78BFA';
  }
};
