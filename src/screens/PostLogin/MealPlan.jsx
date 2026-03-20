import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useMemo } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch } from 'react-redux'
import WrapperContainer from '../../components/WrapperContainer'
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon'
import CustomButton from '../../components/CustomButton'
import { textScale, moderateScale, verticalScale, moderateScaleVertical } from '../../helper/responsiveSize'
import { colors } from '../../resources/colors'
import { images } from '../../resources/images'
import NavigationService from '../../navigation/NavigationService'
import { RouteName } from '../../helper/strings'
import Spacer from '../../components/Spacer'
import axiosRequest from '../../helper/axiosRequest'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

const MealPlan = ({ route }) => {
  const { listData = null } = route?.params || {}
  const dispatch = useDispatch()

  const timeline = parseInt(listData?.timeline) || 7
  const budget = parseFloat(listData?.budget) || 0

  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedView, setSelectedView] = useState('By Meal')
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState([])
  const [listItems, setListItems] = useState([])

  // Fetch shopping list items and then query matching recipes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Step 1: Get shopping list items
        let items = [];
        if (listData?.id) {
          const itemsResp = await axiosRequest({
            method: 'GET',
            url: 'shopping-list-items',
            params: { shopping_list_id: listData.id }
          });
          items = itemsResp?.data?.data || itemsResp?.data?.shoppingListItems || [];
          setListItems(items);
        }

        // Step 2: Build ingredient keywords from items
        const keywords = items
          .map(item => {
            const name = item.product_name || item.description || '';
            // Simplify: take first word before comma (e.g. "Chicken, breast" → "Chicken")
            return name.split(',')[0].trim().split(' ').slice(0, 2).join(' ');
          })
          .filter(Boolean)
          .slice(0, 5); // top 5 ingredients

        const query = keywords.length > 0 ? keywords.join(' ') : (listData?.nutrition_focus || 'healthy');

        // Step 3: Fetch recipes matching those ingredients
        const recipesResp = await axiosRequest({
          method: 'GET',
          url: 'recipes',
          params: { query }
        });

        const hits = recipesResp?.hits || recipesResp?.data?.hits || [];
        const recipeList = hits.map(h => h.recipe || h).filter(Boolean);
        setRecipes(recipeList);
      } catch (e) {
        console.log('MealPlan load error:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [listData?.id]);

  // Distribute recipes across days × meal types
  const mealGrid = useMemo(() => {
    // grid[day][mealType] = recipe
    const grid = {};
    let recipeIndex = 0;
    for (let day = 1; day <= timeline; day++) {
      grid[day] = {};
      for (const mealType of MEAL_TYPES) {
        grid[day][mealType] = recipes[recipeIndex] || null;
        recipeIndex = (recipeIndex + 1) % (recipes.length || 1);
      }
    }
    return grid;
  }, [recipes, timeline]);

  // Get ingredient names from the shopping list for "Uses: X from your list"
  const listIngredientWords = useMemo(() => {
    return listItems
      .map(item => (item.product_name || item.description || '').toLowerCase().split(',')[0].trim())
      .filter(Boolean);
  }, [listItems]);

  const getUsedIngredients = (recipe) => {
    if (!recipe?.ingredientLines?.length && !recipe?.ingredients?.length) return '';
    const lines = recipe.ingredientLines || recipe.ingredients?.map(i => i.food) || [];
    const matches = lines.filter(line => {
      const lower = line.toLowerCase();
      return listIngredientWords.some(word => word.length > 2 && lower.includes(word));
    });
    if (matches.length === 0) return lines.slice(0, 2).join(', ');
    return matches.slice(0, 3).map(m => m.split(',')[0].trim()).join(', ');
  };

  const totalMeals = timeline * MEAL_TYPES.length;
  const nutritionPct = listItems.length > 0 ? Math.min(95, 60 + listItems.length * 3) : 0;

  const MealCard = ({ recipe, mealType }) => {
    if (!recipe) return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyCardText}>No {mealType} recipe found</Text>
      </View>
    );

    const cal = recipe.calories ? Math.round(recipe.calories / (recipe.yield || 1)) : null;
    const protein = recipe.totalNutrients?.PROCNT?.quantity ? Math.round(recipe.totalNutrients.PROCNT.quantity / (recipe.yield || 1)) : null;
    const usedIngredients = getUsedIngredients(recipe);

    return (
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealCategory}>{mealType}</Text>
          <TouchableOpacity>
            <CustomIcon origin={ICON_TYPE.IONICONS} name="heart-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <View style={styles.mealContent}>
          <Image
            source={recipe.image ? { uri: recipe.image } : images.recipe}
            style={styles.mealImage}
            resizeMode="cover"
          />
          <View style={styles.mealDetails}>
            <Text style={styles.mealTitle} numberOfLines={2}>{recipe.label || 'Recipe'}</Text>
            <View style={styles.badgeRow}>
              {cal != null && (
                <View style={[styles.badge, { backgroundColor: '#E1F9E1' }]}>
                  <Text style={[styles.badgeText, { color: '#28C76F' }]}>{cal} cal</Text>
                </View>
              )}
              {protein != null && (
                <View style={[styles.badge, { backgroundColor: '#E1EFFF' }]}>
                  <Text style={[styles.badgeText, { color: '#007AFF' }]}>{protein}g protein</Text>
                </View>
              )}
            </View>
            <View style={styles.mealFooter}>
              <View style={styles.timeContainer}>
                <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="clock" size={12} color="#9CA3AF" />
                <Text style={styles.timeText}>{recipe.totalTime || '~20'} min</Text>
              </View>
            </View>
          </View>
        </View>

        {usedIngredients ? (
          <Text style={styles.ingredientsText} numberOfLines={2}>
            Uses: {usedIngredients} from your list
          </Text>
        ) : null}

        <CustomButton
          title="View Recipe"
          onPress={() => NavigationService.navigate(RouteName.RECIPE_DETAILS, {
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
          style={styles.recipeButton}
        />
      </View>
    );
  };

  return (
    <WrapperContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#10B981', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => NavigationService.goBack()}>
              <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="chevron-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.checkmarkContainer}>
              <CustomIcon origin={ICON_TYPE.IONICONS} name="checkmark" size={24} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Your {timeline}-Day Meal Plan</Text>
            <Text style={styles.headerSubtitle}>is Ready!</Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.statNumber, { color: '#0369A1' }]}>{totalMeals}</Text>
            <Text style={styles.statLabel}>Total Meals</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#FEF9C3' }]}>
            <Text style={[styles.statNumber, { color: '#B45309' }]}>${budget.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Budget Used</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{nutritionPct}%</Text>
            <Text style={styles.statLabel}>Nutrition</Text>
          </View>
        </View>

        {/* View Tabs */}
        <View style={styles.tabContainer}>
          {['Calendar View', 'List View', 'By Meal'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedView === tab && styles.activeTab]}
              onPress={() => setSelectedView(tab)}
            >
              <Text style={[styles.tabText, selectedView === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Day Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {Array.from({ length: timeline }, (_, i) => i + 1).map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayTab, selectedDay === day && styles.activeDayTab]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.activeDayText]}>Day {day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Finding recipes from your ingredients...</Text>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.noMealsContainer}>
            <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="search" size={40} color="#D1D5DB" />
            <Text style={styles.noMealsText}>No matching recipes found.{'\n'}Try updating your shopping list.</Text>
          </View>
        ) : (
          <>
            {MEAL_TYPES.map(mealType => (
              <MealCard
                key={mealType}
                recipe={mealGrid[selectedDay]?.[mealType]}
                mealType={mealType}
              />
            ))}
          </>
        )}

        <View style={styles.footerSummary}>
          <TouchableOpacity style={styles.nextBtn} onPress={() => NavigationService.navigate(RouteName.MAIN_TAB)}>
            <Text style={styles.nextBtnText}>Done</Text>
          </TouchableOpacity>
          <Spacer height={30} />
        </View>
      </ScrollView>
    </WrapperContainer>
  );
};

export default MealPlan;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, marginTop: verticalScale(15) },
  headerContainer: { marginBottom: 20 },
  header: { borderRadius: 16, paddingVertical: verticalScale(20), height: verticalScale(200), alignItems: 'center', position: 'relative', justifyContent: 'center' },
  backButton: { position: 'absolute', top: verticalScale(15), left: moderateScale(15), width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  checkmarkContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: textScale(18), fontWeight: '700', color: 'white', textAlign: 'center' },
  headerSubtitle: { fontSize: textScale(18), fontWeight: '700', color: 'white', textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 12, marginHorizontal: 4 },
  statNumber: { fontSize: textScale(18), fontWeight: '700' },
  statLabel: { fontSize: textScale(11), color: colors.grey, marginTop: 4, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', borderRadius: 20, marginRight: 8, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#10B981' },
  tabText: { fontSize: textScale(12), color: colors.grey, fontWeight: '500' },
  activeTabText: { color: 'white', fontWeight: '600' },
  dayScroll: { marginBottom: 16 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  activeDayTab: { backgroundColor: '#F97316' },
  dayText: { fontSize: textScale(12), color: colors.grey, fontWeight: '500' },
  activeDayText: { color: 'white', fontWeight: '600' },
  loadingContainer: { padding: 48, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: textScale(14), color: colors.grey, textAlign: 'center' },
  mealCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealCategory: { fontSize: textScale(16), fontWeight: '700', color: colors.black },
  mealContent: { flexDirection: 'row', marginBottom: 12 },
  mealImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  mealDetails: { flex: 1, marginLeft: 16 },
  mealTitle: { fontSize: textScale(15), fontWeight: '600', color: colors.black, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: textScale(10), fontWeight: '600' },
  mealFooter: { flexDirection: 'row', alignItems: 'center' },
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: textScale(12), color: colors.grey, marginLeft: 4 },
  ingredientsText: { fontSize: textScale(12), color: '#6B7280', marginBottom: 12, fontStyle: 'italic' },
  recipeButton: {},
  emptyCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  emptyCardText: { color: colors.grey, fontSize: textScale(13) },
  noMealsContainer: { padding: 48, alignItems: 'center' },
  noMealsText: { fontSize: textScale(14), color: colors.grey, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  footerSummary: { marginTop: 8 },
  nextBtn: { backgroundColor: '#FF6B35', height: moderateScaleVertical(54), borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: textScale(16), fontWeight: '700' },
});
