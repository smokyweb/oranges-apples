import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import { images } from '../../resources/images';
import Spacer from '../../components/Spacer';
import { Checkbox } from 'react-native-paper';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import LoaderOverlay from '../../components/LoaderOverlay';
import axiosRequest from '../../helper/axiosRequest';
import { useDispatch } from 'react-redux';
import { getWalmartPrice, addShoppingListItem } from '../../../store/home/home.action';

const { width } = Dimensions.get('window');

const RecipeDetails = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState('Ingredients');
  const [checkedItems, setCheckedItems] = useState({});
  const [showAllNutrition, setShowAllNutrition] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const recipeData = route?.params?.data;
  console.log('RecipeItem===>>', JSON.stringify(recipeData))

  const toggleCheckbox = id => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [ingredientPrices, setIngredientPrices] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (recipeData?.ingredients) {
      recipeData.ingredients.forEach((ing, index) => {
        const id = index + 1;
        fetchIngredientPrice(ing.food, id);
      });
    }
  }, [recipeData]);

  const fetchIngredientPrice = async (foodName, id) => {
    setIngredientPrices(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const resp = await dispatch(getWalmartPrice(foodName)).unwrap();
      if (resp.success && resp.data?.items?.length > 0) {
        const validItems = resp.data.items.filter(item => item.salePrice != null);
        if (validItems.length > 0) {
          const lowestPriceItem = validItems.reduce((prev, curr) =>
            (prev.salePrice < curr.salePrice) ? prev : curr
          );
          setIngredientPrices(prev => ({
            ...prev,
            [id]: {
              price: lowestPriceItem.salePrice,
              productId: lowestPriceItem.itemId,
              productImage: lowestPriceItem.image,
              loading: false
            }
          }));
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

  // Use actual recipe data from params
  const item = {
    name: recipeData?.label || 'Mediterranean Veggie Pasta',
    time: recipeData?.totalTime ? `${recipeData.totalTime} min` : '',
    cookTime: '25 min',
    servings: recipeData?.yield ? `${recipeData.yield} servings` : '4 servings',
    totalCost: '$12.50 total',
    image: recipeData?.image || images.recipe,
  };

  // Use actual ingredients from recipe data
  const ingredients = recipeData?.ingredients?.map((ingredient, index) => {
    const id = index + 1;
    const priceInfo = ingredientPrices[id];
    return {
      id: id,
      name: ingredient.food.charAt(0).toUpperCase() + ingredient.food.slice(1),
      quantity: `${ingredient.quantity ? Math.round(ingredient.quantity * 100) / 100 : ''} ${ingredient.measure !== '<unit>' ? ingredient.measure || '' : ''} (${Math.round(ingredient.weight)}g)`,
      price: priceInfo?.price ? `$${priceInfo.price.toFixed(2)}` : null,
      loading: priceInfo?.loading,
      priceNumeric: priceInfo?.price || 0,
      productId: priceInfo?.productId,
      productImage: priceInfo?.productImage || ingredient.image,
      image: ingredient.image
    };
  }) || [];

  console.log('Processed Ingredients Data:', JSON.stringify(ingredients));

  const totalCalculatedCost = ingredients.reduce((sum, ing) => {
    if (checkedItems[ing.id]) {
      return sum + (ing.priceNumeric || 0);
    }
    return sum;
  }, 0);

  const handleAddIngredient = async (ingredient) => {
    const shoppingListId = route?.params?.shopping_list_id;
    if (!shoppingListId) {
      Alert.alert('Alert', 'Please open this recipe from a shopping list to add items.');
      return;
    }

    const payload = {
      shopping_list_id: shoppingListId,
      items: [
        {
          product_id: ingredient.productId?.toString() || '',
          product_name: ingredient.name,
          salePrice: ingredient.priceNumeric,
          image: ingredient.productImage,
          product_quantity: 1,
          is_stock: 'true'
        }
      ]
    };

    try {
      setIsFavoriting(true);
      await dispatch(addShoppingListItem(payload)).unwrap();
      Alert.alert('Success', 'Item added to shopping list!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to shopping list.');
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleAddAllIngredients = async () => {
    const shoppingListId = route?.params?.shopping_list_id;
    if (!shoppingListId) {
      Alert.alert('Alert', 'Please open this recipe from a shopping list to add items.');
      return;
    }

    const selectedIngredients = ingredients.filter(ing => checkedItems[ing.id]);

    if (selectedIngredients.length === 0) {
      Alert.alert('Alert', 'Please select (check) at least one ingredient to add.');
      return;
    }

    const payload = {
      shopping_list_id: shoppingListId,
      items: selectedIngredients.map(ing => ({
        product_id: ing.productId?.toString() || '',
        product_name: ing.name,
        salePrice: ing.priceNumeric,
        image: ing.productImage,
        product_quantity: 1,
        is_stock: 'true'
      }))
    };

    try {
      setIsFavoriting(true);
      await dispatch(addShoppingListItem(payload)).unwrap();
      Alert.alert('Success', 'Ingredients added to shopping list!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredients.');
    } finally {
      setIsFavoriting(false);
    }
  };

  // Generate dynamic nutrition data from API
  const nutritionColors = ['#FF7043', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#795548'];
  const allNutritionData = recipeData?.totalNutrients ?
    Object.entries(recipeData.totalNutrients)
      .map(([key, nutrient], index) => ({
        label: nutrient.label,
        value: `${Math.round(nutrient.quantity)}${nutrient.unit}`,
        color: nutritionColors[index % nutritionColors.length]
      })) : [
      { label: 'Calories', value: '425', color: '#FF7043' },
      { label: 'Protein', value: '18g', color: '#4CAF50' },
      { label: 'Carbs', value: '65g', color: '#2196F3' },
      { label: 'Fat', value: '12g', color: '#9C27B0' },
    ];

  const nutritionData = showAllNutrition ? allNutritionData : allNutritionData.slice(0, 6);

  const addToFavorite = async () => {
    setIsFavoriting(true);

    try {
      const recipeId = recipeData?.uri?.includes('#')
        ? recipeData.uri.split('#')[1]
        : recipeData?.uri;
      console.log('RecipeItem===>', recipeId)
      const resp = await axiosRequest({
        url: 'favorite-recipes',
        method: 'post',
        data: {
          recipe_id: recipeId,
        }
      });
      console.log('custom', resp.message);
      Alert.alert('Success', resp.message);
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipe to favorites.');
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <WrapperContainer>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Hero Image Section */}
        <View style={styles.imageHeader}>
          <Image
            source={item.image ? { uri: item.image } : images.recipe}
            style={styles.heroImage}
          />
          <View style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.goBack()}
            >
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name="arrow-back"
                size={22}
                color="#1A1C1E"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addToFavorite}
              style={styles.circleBtn}
              disabled={isFavoriting}
            >
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name="heart-outline"
                size={22}
                color="#1A1C1E"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* FLOATING CARD CONTAINER */}
          <View style={styles.floatingInfoCard}>
            <Text style={styles.titleText}>{item.name}</Text>

            <View style={styles.quickInfoRow}>
              <View style={styles.infoItem}>
                {item?.time &&
                  (<>
                    <CustomIcon
                      origin={ICON_TYPE.FEATHER_ICONS}
                      name="clock"
                      color="#FF7043"
                      size={16}
                    />
                    <Text style={styles.infoText}>{item.time}</Text>
                  </>)}
              </View>
              {/* <View style={styles.infoItem}>
                <CustomIcon
                  origin={ICON_TYPE.FONT_AWESOME5}
                  name="fire-alt"
                  size={14}
                  color="#FF7043"
                />
                <Text style={styles.infoText}>25 min</Text>
              </View> */}
              <View style={styles.infoItem}>
                <CustomIcon
                  origin={ICON_TYPE.FONT_AWESOME5}
                  name="users"
                  size={14}
                  color="#FF7043"
                />
                <Text style={styles.infoText}>{item.servings}</Text>
              </View>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.totalCostText}>${totalCalculatedCost.toFixed(2)} total</Text>
              <TouchableOpacity>
                <CustomIcon
                  origin={ICON_TYPE.IONICONS}
                  name="bookmark-outline"
                  size={22}
                  color="#FF7043"
                />
              </TouchableOpacity>
            </View>
          </View>


          <View style={{ height: moderateScaleVertical(110) }} />

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {['Ingredients', 'Instructions', 'Nutrition'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'Ingredients' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <TouchableOpacity
                  style={styles.addAllBtn}
                  onPress={handleAddAllIngredients}
                >
                  <CustomIcon
                    origin={ICON_TYPE.FONT_AWESOME5}
                    name="shopping-cart"
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.addAllText}>Add All to List</Text>
                </TouchableOpacity>
              </View>

              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <Checkbox.Android
                    status={
                      checkedItems[ingredient.id] ? 'checked' : 'unchecked'
                    }
                    onPress={() => toggleCheckbox(ingredient.id)}
                    color="#28C76F"
                    uncheckedColor="#D1D5DB"
                  />
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientQuantity}>
                      {ingredient.quantity}
                    </Text>
                  </View>
                  <View style={styles.priceActionRow}>
                    {ingredient.loading ? (
                      <ActivityIndicator size="small" color="#28C76F" style={{ marginRight: 10 }} />
                    ) : (
                      ingredient.price && (
                        <Text style={styles.ingredientPrice}>
                          {ingredient.price}
                        </Text>
                      )
                    )}
                    <TouchableOpacity
                      style={styles.addIconBtn}
                      onPress={() => handleAddIngredient(ingredient)}
                    >
                      <CustomIcon
                        origin={ICON_TYPE.FEATHER_ICONS}
                        name="plus"
                        size={16}
                        color="#FF7043"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Nutrition Summary */}
              <View style={styles.nutritionBox}>
                <View style={styles.nutritionHeader}>
                  <Text style={styles.nutritionTitle}>
                    Nutrition per serving
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAllNutrition(!showAllNutrition)}
                  >
                    <Text style={styles.viewAllText}>
                      {showAllNutrition ? 'Show Less' : 'View All'}
                    </Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity 
                  onPress={()=>NavigationService.navigate(RouteName.NUTRITIONAL_FACTS)}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity> */}
                </View>

                <View style={styles.nutritionGrid}>
                  {nutritionData.map((data, idx) => (
                    <View key={idx} style={styles.nutritionItem}>
                      <Text
                        style={[styles.nutritionValue, { color: data.color }]}
                      >
                        {data.value}
                      </Text>
                      <Text style={styles.nutritionLabel}>{data.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <Spacer height={100} />
        </View>
      </ScrollView>
      <LoaderOverlay visible={isFavoriting} />
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageHeader: { width: width, height: moderateScaleVertical(280) },
  heroImage: { width: '100%', height: '100%' },
  headerOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    marginTop: 0, // Removed negative margin as we use absolute positioning for the card
  },

  // Floating Card Styling
  floatingInfoCard: {
    position: 'absolute',
    top: -moderateScaleVertical(60),
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 10,
  },
  titleText: {
    fontSize: textScale(20),
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  quickInfoRow: { flexDirection: 'row', marginBottom: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  infoText: {
    fontSize: textScale(13),
    color: '#6B7280',
    marginLeft: 5,
    fontWeight: '500',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCostText: {
    fontSize: textScale(18),
    fontWeight: '700',
    color: '#28C76F',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: textScale(14), color: '#9CA3AF', fontWeight: '600' },
  activeTabText: { color: '#1F2937' },

  // Ingredients Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: textScale(18),
    fontWeight: '700',
    color: '#1F2937',
  },
  addAllBtn: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addAllText: {
    color: '#fff',
    fontSize: textScale(12),
    fontWeight: '700',
    marginLeft: 6,
  },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 15,
  },
  ingredientInfo: { flex: 1 },
  ingredientName: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#374151',
    maxWidth: width / 2 + 10
  },
  ingredientQuantity: { fontSize: textScale(12), color: '#9CA3AF' },
  priceActionRow: { flexDirection: 'row', alignItems: 'center' },
  ingredientPrice: {
    fontSize: textScale(14),
    fontWeight: '700',
    color: '#28C76F',
    marginRight: 10,
  },
  addIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Nutrition Grid
  nutritionBox: {
    marginTop: moderateScaleVertical(30),
    paddingBottom: moderateScaleVertical(20),
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScaleVertical(20),
  },
  nutritionTitle: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: textScale(13),
    color: '#3B82F6',
    fontWeight: '600',
    borderBottomColor: '#3B82F6',
    borderBottomWidth: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allows items to move to the next line
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    width: '48%', // Sets width for two items per row with a small gap
    backgroundColor: '#F9FAFB', // Light background for the grid items
    paddingVertical: moderateScaleVertical(15),
    borderRadius: 16,
    marginBottom: moderateScaleVertical(12),
  },
  nutritionValue: {
    fontSize: textScale(18),
    fontWeight: '800',
  },
  nutritionLabel: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginTop: 4,
  },
});

export default RecipeDetails;
