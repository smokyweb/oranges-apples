import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import WrapperContainer from '../../components/WrapperContainer';
import Header from '../../components/Header';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import NavigationService from '../../navigation/NavigationService';
import { useDispatch, useSelector } from 'react-redux';
import { getRecipes, getShoppinglistMeals, getWalmartPrice, getShoppingListItems, getShoppingLists, deleteShoppingList } from '../../../store/home/home.action';
import { LoadingStatus } from '../../helper/strings';
import { images } from '../../resources/images';
import { Image } from 'react-native';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import Spacer from '../../components/Spacer';
import MealCard from '../../components/MealCard';
import { RouteName } from '../../helper/strings';
import AdditionalItemsModal from '../../components/AdditionalItemsModal';
import CheckoutModal from '../../components/CheckoutModal';
import { TRACKED_NUTRIENT_KEYS, DEFAULT_NUTRIENT_TARGETS } from '../../helper/nutrients';

const ListDetails = ({ route }) => {
  const { listData = null } = route?.params || {};
  const [activeTab, setActiveTab] = useState('Ingredients');
  const [ingredientPrices, setIngredientPrices] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { shoppingListItems, shoppingListItemsLoading, recipes, recipesLoading, shoppingLists } = useSelector(store => store.homeReducer);

  const [showAdditionalItems, setShowAdditionalItems] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAdditionalItems, setSelectedAdditionalItems] = useState([]);
  const [selectedStore, setSelectedStore] = useState('walmart');
  const [showNutrients, setShowNutrients] = useState(false);

  const ingredients = shoppingListItems?.data?.data || [];
  const meals = recipes?.data || recipes?.hits || [];
  const hasIngredients = ingredients.length > 0;
  const hasMeals = meals.length > 0;
  const isNextDisabled = !hasIngredients && !hasMeals;

  // Keep list data fresh from the store (handles updates after edit)
  const currentListData = (Array.isArray(shoppingLists?.data) ? shoppingLists.data : []).find(l => l.id === listData?.id) || listData;

  const activeRequests = useRef({
    shoppingLists: null,
    shoppingListItems: null,
    shoppingListMeals: null
  });

  const abortPrevious = (key) => {
    if (activeRequests.current[key]) {
      activeRequests.current[key].abort();
    }
  };

  const safeDispatch = (key, thunkAction) => {
    abortPrevious(key);
    activeRequests.current[key] = dispatch(thunkAction);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'Ingredients') {
      safeDispatch('shoppingListItems', getShoppingListItems(currentListData?.id));
      try { await activeRequests.current.shoppingListItems.unwrap(); } catch (e) { }
    } else {
      safeDispatch('shoppingListMeals', getShoppinglistMeals(currentListData?.id));
      try { await activeRequests.current.shoppingListMeals.unwrap(); } catch (e) { }
    }
    setRefreshing(false);
  }, [activeTab, dispatch, currentListData?.id]);

  const toggleCheckbox = (item) => {
    const id = item.id || item.itemId;
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectedFoodItems = React.useMemo(() => {
    return ingredients.filter(item => checkedItems[item.id || item.itemId]);
  }, [ingredients, checkedItems]);

  const totalSpent = selectedFoodItems.reduce((sum, item) => {
    const price = parseFloat(item.salePrice || item.price || 0);
    const qty = parseInt(item.product_quantity || item.quantity || item.qty || 1, 10);
    return sum + price * qty;
  }, 0);

  // Sum nutrients from all items in the list (using stored nutrients JSON per item)
  const listNutrientTotals = React.useMemo(() => {
    const totals = {};
    ingredients.forEach(item => {
      if (!item.nutrients) return;
      const nutrientMap = typeof item.nutrients === 'string'
        ? JSON.parse(item.nutrients) : item.nutrients;
      TRACKED_NUTRIENT_KEYS.forEach(key => {
        const entry = nutrientMap[key];
        if (entry?.amount) {
          totals[key] = (totals[key] || 0) + parseFloat(entry.amount);
        }
      });
    });
    return totals;
  }, [ingredients]);

  // Consolidatd fetching logic
  useEffect(() => {
    if (isFocused && currentListData?.id) {
      // General list data
      safeDispatch('shoppingLists', getShoppingLists());

      // Fetch based on active tab
      if (activeTab === 'Ingredients') {
        safeDispatch('shoppingListItems', getShoppingListItems(currentListData.id));
      } else {
        safeDispatch('shoppingListMeals', getShoppinglistMeals(currentListData.id));
      }
    }

    return () => {
      // Cleanup: Abort all pending requests when unmounting or dependencies change
      Object.keys(activeRequests.current).forEach(key => abortPrevious(key));
    };
  }, [isFocused, activeTab, currentListData?.id]);

  useEffect(() => {
    if (shoppingListItems?.data?.data) {
      const initialChecked = {};
      shoppingListItems.data.data.forEach(item => {
        const id = item.id || item.itemId;
        if (item.is_checked || item.status === 'checked' || item.status === 1) {
          initialChecked[id] = true;
        }
      });
      setCheckedItems(prev => ({ ...initialChecked, ...prev }));
    }
  }, [shoppingListItems]);

  const fetchIngredientPrice = async (foodName, id) => {
    setIngredientPrices(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const resp = await dispatch(getWalmartPrice(foodName)).unwrap();
      if (resp.success && resp.data?.items?.length > 0) {
        const validItems = resp.data.items.filter(item => item.salePrice != null);
        if (validItems.length > 0) {
          const lowestPrice = Math.min(...validItems.map(item => item.salePrice));
          setIngredientPrices(prev => ({ ...prev, [id]: { price: lowestPrice, loading: false } }));
        } else {
          setIngredientPrices(prev => ({ ...prev, [id]: { loading: false } }));
        }
      } else {
        setIngredientPrices(prev => ({ ...prev, [id]: { loading: false } }));
      }
    } catch (error) {
      setIngredientPrices(prev => ({ ...prev, [id]: { loading: false } }));
    }
  };

  const handleDeleteList = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteShoppingList(currentListData.id)).unwrap();
      setShowDeleteConfirm(false);
      NavigationService.goBack();
    } catch (error) {
      setShowDeleteConfirm(false);
      Alert.alert("Error", "Failed to delete shopping list");
    } finally {
      setIsDeleting(false);
    }
  };

  // Render logic for Ingredients
  const renderIngredientItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleCheckbox(item)}
      >
        <CustomIcon
          origin={ICON_TYPE.IONICONS}
          name={checkedItems[item.id || item.itemId] ? "checkbox" : "square-outline"}
          size={24}
          color={checkedItems[item.id || item.itemId] ? "#28C76F" : "#D1D5DB"}
        />
      </TouchableOpacity>

      <View style={styles.imagePlaceholder}>
        <Image
          source={item.thumbnailImage ? { uri: item.thumbnailImage } : images.recipe}
          style={{ width: '100%', height: '100%', borderRadius: 8 }}
          resizeMode="cover"
        />
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubText}>{item.recipe_name || 'Individual Item'}</Text>
        <Text style={styles.itemPrice}>${parseFloat(item.salePrice || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.quantityContainer}>
        <View style={styles.qtyBox}>
          <Text style={styles.qtyText}>{item.product_quantity || 1}</Text>
        </View>
      </View>
    </View>
  );

  // Render logic for Meals
  const renderMealItem = ({ item }) => {
    const recipe = item.recipe_details || item.recipe;
    if (!recipe) return null;
    const mealTransformed = {
      id: recipe.uri,
      // category: recipe.mealType?.[0] || 'Meal',
      category: 'Meal',
      title: recipe.label,
      calories: `${Math.round(recipe.calories / (recipe.yield || 1))} cal`,
      protein: `${Math.round(recipe.totalNutrients?.PROCNT?.quantity || 0)}g protein`,
      time: `${recipe.totalTime || 'N/A'} min`,
      // price: '$' + (Math.floor(Math.random() * 8) + 3).toFixed(2), // Price isn't in Edamam, mocking for UI
      ingredients: recipe.ingredients?.map(ing => ing.food).join(', '),
      liked: false,
      image: recipe.image
    };

    return (
      <MealCard
        meal={mealTransformed}
        onLikePress={(id) => console.log('Liked', id)}
        onRecipePress={() => NavigationService.navigate(RouteName.RECIPE_DETAILS, {
          name: recipe.label,
          image: recipe.image,
          time: recipe.totalTime || 'N/A',
          servings: recipe.yield || 'N/A',
          tag: recipe.cuisineType?.[0] || 'Recipe',
          tagColor: '#E5F3FF',
          tagTextColor: '#1E40AF',
          data: recipe,
          shopping_list_id: listData?.id
        })}
      />
    );
  };

  return (
    <WrapperContainer>
      <Header
        title={currentListData?.name || 'Oranges To Apples'}
        onBackPress={() => NavigationService.goBack()}
        rightIcon={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleDeleteList}
              style={{ marginRight: 15 }}
            >
              <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="trash-2" size={20} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => NavigationService.navigate(RouteName.NEW_SHOPPING_LIST, { editMode: true, listData: currentListData })}
            >
              <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="edit-2" size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
        }
      />

      <FlatList
        // Dynamic Data Switching
        data={activeTab === 'Ingredients' ? ingredients : (recipesLoading === LoadingStatus.LOADED ? meals : [])}
        renderItem={activeTab === 'Ingredients' ? renderIngredientItem : renderMealItem}
        keyExtractor={(item, index) => {
          if (activeTab === 'Ingredients') return `${item.id || item.itemId || 'ing'}-${index}`;
          const recipe = item.recipe_details || item.recipe;
          return `${recipe?.uri || 'rec'}-${index}`;
        }}
        ListEmptyComponent={
          recipesLoading !== LoadingStatus.LOADING && shoppingListItemsLoading !== LoadingStatus.LOADING ? (
            <View style={styles.emptyContainer}>
              <CustomIcon
                origin={ICON_TYPE.MATERIAL_COMMUNITY}
                name={activeTab === 'Ingredients' ? "basket-outline" : "silverware-fork-knife"}
                size={60}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'Ingredients' ? "No Ingredients found" : "No meals found"}
              </Text>
            </View>
          ) : null
        }

        // This ensures the top section (Stats, Search, Tabs) scrolls away with the list
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            {/* Summary Section */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{shoppingListItems?.data?.quantity || 0}</Text>
                <Text style={styles.summaryLabel}>Total Items</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#28C76F' }]}>{currentListData?.timeline || 0}</Text>
                <Text style={styles.summaryLabel}>Days Covered</Text>
              </View>
            </View>

            {/* Progress Bars */}
            <View style={styles.progressSection}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Budget Used</Text>
                <Text style={styles.progressValue}>${totalSpent.toFixed(2)} / ${currentListData?.budget || 0}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(totalSpent / (currentListData?.budget || 1)) * 100}%`, backgroundColor: '#28C76F' }]} />
              </View>

              {/* <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Nutrition Focus</Text>
                <Text style={[styles.statusText, { color: '#FF6B35' }]}>{currentListData?.nutrition_focus || 'Balanced'}</Text>
              </View> */}
{/* 
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Nutritional Balance</Text>
                <View style={styles.dotRow}>
                  {['#FF4D4F', '#FFC107', '#28C76F', '#28C76F', '#E5E7EB'].map((color, index) => (
                    <View key={index} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                  <Text style={styles.statusText}>Good</Text>
                </View>
              </View> */}
            </View>

            {/* Search Bar */}
            {/* <View style={styles.searchContainer}>
              <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="search" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search items..."
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            </View> */}

            {/* Toggle Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'Ingredients' && styles.activeTab]}
                onPress={() => setActiveTab('Ingredients')}
              >
                <Text style={[styles.tabText, activeTab === 'Ingredients' && styles.activeTabText]}>Ingredients</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'Meals' && styles.activeTab]}
                onPress={() => setActiveTab('Meals')}
              >
                <Text style={[styles.tabText, activeTab === 'Meals' && styles.activeTabText]}>Meals</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          ((activeTab === 'Ingredients' && shoppingListItemsLoading === LoadingStatus.LOADING) ||
            (activeTab === 'Meals' && recipesLoading === LoadingStatus.LOADING)) ? (
            <ActivityIndicator size="large" color="#28C76F" style={{ marginTop: 20 }} />
          ) : null
        }
      />

      {/* Nutrient Goals Panel — slides up above footer */}
      {showNutrients && (
        <View style={styles.nutrientPanel}>
          <View style={styles.nutrientPanelHeader}>
            <Text style={styles.nutrientPanelTitle}>⛽ Nutritional Goals</Text>
            <TouchableOpacity onPress={() => setShowNutrients(false)}>
              <Text style={styles.nutrientPanelClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {TRACKED_NUTRIENT_KEYS.map(key => {
              const target = DEFAULT_NUTRIENT_TARGETS.find(t => t.nutrient_key === key);
              if (!target) return null;
              const days = Number(currentListData?.timeline) || 1;
              const scaledTarget = (target.total_target_value || 0) * days;
              const current = listNutrientTotals[key] || 0;
              const fillPct = scaledTarget > 0 ? Math.min(100, (current / scaledTarget) * 100) : 0;
              const barColor = fillPct >= 75 ? '#28C76F' : fillPct >= 25 ? '#F59E0B' : '#EF4444';
              return (
                <View key={key} style={styles.gaugeRow}>
                  <View style={styles.gaugeLabelRow}>
                    <Text style={styles.gaugeLabel}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.gaugeValue}>
                      {current > 0
                        ? `${Math.round(current * 10) / 10} / ${scaledTarget} ${target.unit}`
                        : `${scaledTarget} ${target.unit} · ${days}d target`}
                    </Text>
                  </View>
                  <View style={styles.gaugeTrack}>
                    <View style={[styles.gaugeFill, { width: `${Math.max(fillPct, 2)}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Footer Button - Outside FlatList to stay fixed at bottom */}
      <View style={styles.footer}>
        {/* Store Selector hidden — Walmart only for now */}

        {/* Action row — Smart Suggestions + Nutrition Goals */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowNutrients(v => !v)}
          >
            <Text style={styles.actionBtnText}>⛽ Nutrition Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGreen]}
            onPress={() => NavigationService.navigate(RouteName.NEW_SHOPPING_LIST, {
              editMode: true,
              listData: currentListData,
              openModal: true,
            })}
          >
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>🧠 Smart Suggestions</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setShowAdditionalItems(true)}
          disabled={isNextDisabled}
          style={[styles.nextBtn, isNextDisabled && styles.disabledNextBtn]}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
        <Spacer height={verticalScale(30)} />
      </View>

      {/* Delete confirmation modal — cross-platform (Alert.alert unreliable on web) */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogTitle}>Delete Shopping List</Text>
            <Text style={styles.deleteDialogBody}>Are you sure you want to delete "{currentListData?.name}"? This cannot be undone.</Text>
            <View style={styles.deleteDialogBtns}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete} disabled={isDeleting}>
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteConfirmText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AdditionalItemsModal
        visible={showAdditionalItems}
        onClose={() => setShowAdditionalItems(false)}
        selectedStore={selectedStore}
        onNext={(items) => {
          setSelectedAdditionalItems(items);
          setShowAdditionalItems(false);
          setShowCheckout(true);
        }}
      />

      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        foodItems={selectedFoodItems}
        additionalItems={selectedAdditionalItems}
        shoppingListId={currentListData?.id}
        selectedStore={selectedStore}
        onPlaceOrder={() => {
          setShowCheckout(false);
          NavigationService.navigate(RouteName.MEAL_PLAN, { listData: currentListData });
        }}
      />
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  deleteDialog: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 },
  deleteDialogTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  deleteDialogBody: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 21 },
  deleteDialogBtns: { flexDirection: 'row', gap: 12 },
  deleteCancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  deleteCancelText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  deleteConfirmBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  deleteConfirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScaleVertical(100), // Space for fixed footer
  },
  listHeaderContainer: {
    backgroundColor: 'white',
    paddingBottom: moderateScaleVertical(5),
  },
  // ... (Rest of your styles remain exactly as you provided)
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: moderateScaleVertical(15),
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: textScale(22), fontWeight: '800', color: '#1F2937' },
  summaryLabel: { fontSize: textScale(12), color: '#6B7280', marginTop: 4 },
  progressSection: { marginBottom: moderateScaleVertical(20) },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScaleVertical(12),
  },
  progressLabel: { fontSize: textScale(13), color: '#4B5563', fontWeight: '500' },
  progressValue: { fontSize: textScale(13), fontWeight: '700', color: '#1F2937' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 6,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  dotRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  statusText: { fontSize: textScale(12), color: '#28C76F', marginLeft: 6, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: moderateScale(12),
    height: moderateScaleVertical(45),
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: textScale(14) },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginVertical: moderateScaleVertical(15),
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#28C76F' },
  tabText: { fontSize: textScale(14), fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#FFF' },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: moderateScale(12),
    marginBottom: moderateScaleVertical(10),
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginHorizontal: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: textScale(14), fontWeight: '700', color: '#1F2937' },
  itemSubText: { fontSize: textScale(12), color: '#9CA3AF' },
  itemPrice: { fontSize: textScale(13), fontWeight: '700', color: '#1F2937', marginTop: 2 },
  quantityContainer: { alignItems: 'center', flexDirection: 'row' },
  qtyBtn: { padding: 4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(16),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  storeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScaleVertical(10),
  },
  storeSelectorLabel: {
    fontSize: textScale(13),
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 10,
    flex: 1,
  },
  storeSelectorToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScaleVertical(6),
    borderRadius: 8,
  },
  storeBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  storeIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  storeIconText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: textScale(11),
  },
  storeBtnText: {
    fontSize: textScale(13),
    fontWeight: '500',
    color: '#9CA3AF',
  },
  storeBtnTextActive: {
    color: '#1F2937',
    fontWeight: '700',
  },
  nextBtn: {
    backgroundColor: '#FF6B35',
    height: moderateScaleVertical(54),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledNextBtn: {
    backgroundColor: '#D1D5DB',
  },
  nextBtnText: { color: '#FFF', fontSize: textScale(16), fontWeight: '700' },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: textScale(14),
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: moderateScaleVertical(10),
  },
  actionBtn: {
    flex: 1,
    paddingVertical: moderateScaleVertical(10),
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnGreen: {
    backgroundColor: '#28C76F',
    borderColor: '#28C76F',
  },
  actionBtnText: {
    fontSize: textScale(13),
    fontWeight: '700',
    color: '#374151',
  },
  nutrientPanel: {
    position: 'absolute',
    bottom: moderateScaleVertical(170),
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  nutrientPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientPanelTitle: {
    fontSize: textScale(15),
    fontWeight: '800',
    color: '#1F2937',
  },
  nutrientPanelClose: {
    fontSize: textScale(16),
    color: '#9CA3AF',
    fontWeight: '700',
    padding: 4,
  },
  gaugeRow: { marginBottom: 10 },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gaugeLabel: { fontSize: textScale(12), fontWeight: '700', color: '#374151' },
  gaugeValue: { fontSize: textScale(11), color: '#6B7280' },
  gaugeTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: { height: '100%', borderRadius: 4 },
});

export default ListDetails;