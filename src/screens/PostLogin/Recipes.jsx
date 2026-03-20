import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import LinearGradient from 'react-native-linear-gradient';
import { images } from '../../resources/images';
import NavigationService from '../../navigation/NavigationService';
import { useIsFocused } from '@react-navigation/native';
import { LoadingStatus, RouteName } from '../../helper/strings';
import { getRecipes, getMoreRecipes, getShoppingLists, updateShoppingListMeals, getSavedRecipes, getMyMeals } from '../../../store/home/home.action';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const Recipes = () => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { recipes, recipesLoading, isLoadingMore } = useSelector(store => store.homeReducer);
  console.log('Recipes====>>>', JSON.stringify(recipes))
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [isPaginating, setIsPaginating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const { shoppingLists } = useSelector(store => store.homeReducer);
  const activeRequest = useRef(null);

  const FILTER_CATEGORIES = [
    { label: 'All', value: null },
    { label: '🥩 High Protein', value: 'high-protein' },
    { label: '🥗 Low Carb', value: 'low-carb' },
    { label: '🌱 Vegetarian', value: 'vegetarian' },
    { label: '🌿 Vegan', value: 'vegan' },
    { label: '🥑 Keto', value: 'keto' },
    { label: '🐟 Mediterranean', value: 'mediterranean' },
    { label: '🍗 Chicken', value: 'chicken' },
    { label: '🥦 Salad', value: 'salad' },
    { label: '🍝 Pasta', value: 'pasta' },
    { label: '🥣 Breakfast', value: 'breakfast' },
    { label: '🍲 Soup', value: 'soup' },
  ];

  const handleFilterSelect = (filter) => {
    setActiveFilter(filter.value);
    setIsFilterVisible(false);
    const query = filter.value || searchQuery.trim() || 'All';
    safeDispatch(getRecipes(query));
  };

  const safeDispatch = async (thunkAction) => {
    if (activeRequest.current) {
      activeRequest.current.abort();
    }
    activeRequest.current = dispatch(thunkAction);
    try {
      await activeRequest.current.unwrap();
    } catch (error) {
      if (error?.name === 'AbortError') {
        console.log('Request was cancelled');
      }
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'All') {
      await safeDispatch(getRecipes(searchQuery.trim() || 'All'));
    } else if (activeTab === 'Saved Recipes') {
      await safeDispatch(getSavedRecipes());
    } else if (activeTab === 'My Meals') {
      await safeDispatch(getMyMeals());
    }
    setRefreshing(false);
  }, [dispatch, activeTab, searchQuery]);

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      const query = text.trim() || 'All';
      safeDispatch(getRecipes(query));
    }, 500);

    setDebounceTimeout(timeout);
  };

  const loadMoreRecipes = () => {
    const nextUrl = recipes?._links?.next?.href;
    if (nextUrl && !isLoadingMore) {
      dispatch(getMoreRecipes(nextUrl));
    }
  };

  useEffect(() => {
    if (isFocused) {
      if (activeTab === 'All') {
        if (!searchQuery) {
          safeDispatch(getRecipes(activeTab));
        }
      } else if (activeTab === 'Saved Recipes') {
        safeDispatch(getSavedRecipes());
      } else if (activeTab === 'My Meals') {
        safeDispatch(getMyMeals());
      }
      dispatch(getShoppingLists());
    }
  }, [dispatch, activeTab, isFocused]);

  const handleAddToShoppingList = (recipe) => {
    dispatch(getShoppingLists());
    setSelectedList(null);
    setCurrentRecipe(recipe);
    setIsModalVisible(true);
  };

  const handleListSelect = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedList(item);
  };

  const handleContinue = async () => {
    if (!selectedList) {
      Alert.alert('Error', 'Please select a shopping list');
      return;
    }

    try {
      const recipeId = currentRecipe.uri.includes('#')
        ? currentRecipe.uri.split('#')[1]
        : currentRecipe.uri;

      const data = {
        shopping_list_id: selectedList.id,
        recipe_id: recipeId,
      };
      await dispatch(updateShoppingListMeals(data)).unwrap();
      setIsModalVisible(false);
      setSelectedList(null);
      Alert.alert('Success', 'Recipe added to shopping list successfully!');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to add recipe to shopping list');
    }
  };



  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#28C76F" />
          <Text style={styles.footerLoaderText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  };

  const renderRecipeCard = ({ item }) => {
    // Handle both Edamam structure (item.recipe) and local structure (item directly or item.recipe_details)
    const recipe = item.recipe || item.recipe_details || item;

    return (
      <Pressable
        onPress={() => NavigationService.navigate(RouteName.RECIPE_DETAILS, {
          name: recipe.label,
          image: recipe.image || images.recipe,
          time: recipe.totalTime || 'N/A',
          servings: recipe.yield || 'N/A',
          tag: recipe.cuisineType?.[0] || 'Recipe',
          tagColor: '#E5F3FF',
          tagTextColor: '#1E40AF',
          data: recipe
        })}
        style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            defaultSource={images.recipe}
            onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
          />
          <TouchableOpacity style={styles.favoriteBtn}>
            <CustomIcon origin={ICON_TYPE.IONICONS} name="heart-outline" size={18} color="#1A1C1E" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.label}</Text>
          {recipe.totalTime ? <View style={styles.detailsRow}>
            <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="clock" size={12} color="#6B7280" />
            <Text style={styles.detailsText}>{recipe.totalTime}  •  {recipe.yield || 'N/A'} servings</Text>
          </View> :
            <Text style={styles.detailsText}>{recipe.yield || 'N/A'} servings</Text>}
          <View style={[styles.tag, { backgroundColor: '#E5F3FF' }]}>
            <Text style={[styles.tagText, { color: '#1E40AF' }]}>{recipe.cuisineType?.[0] || 'Recipe'}</Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAddToShoppingList(recipe)}
          >
            <Text style={styles.addBtnText}>Add to Shopping List</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    )
  };

  return (
    <WrapperContainer>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#FF6B35', '#4CAF50']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.logoIcon}
          >
            <CustomIcon name={'apple-alt'} origin={ICON_TYPE.FONT_AWESOME5} color={'#fff'} size={20} />

          </LinearGradient>
          <Text style={styles.logoText}>Oranges to Apples</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <CustomIcon origin={ICON_TYPE.FONT_AWESOME} name="bell" size={22} color={'#4B5563'} />
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>Recipes</Text>

      {/* Search and Filter Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search recipes..."
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {/* {recipesLoading === LoadingStatus.LOADING && (
            <ActivityIndicator size="small" color="#28C76F" />
          )} */}
        </View>
        <TouchableOpacity style={[styles.filterBtn, activeFilter && styles.filterBtnActive]} onPress={() => setIsFilterVisible(true)}>
          <CustomIcon origin={ICON_TYPE.FONT_AWESOME} name="filter" size={18} color={colors.white} />
          {activeFilter && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['All', 'Saved Recipes', 'My Meals'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {recipesLoading === LoadingStatus.LOADING ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28C76F" />
          <Text style={styles.loadingText}>Loading {activeTab === 'My Meals' ? 'meals' : 'recipes'}...</Text>
        </View>
      ) : recipesLoading === LoadingStatus.FAILED || (!recipes?.hits?.length && !recipes?.data?.length && !recipes?.data?.data?.length) ? (
        <View style={styles.loadingContainer}>
          <CustomIcon
            origin={ICON_TYPE.FEATHER_ICONS}
            name={activeTab === 'My Meals' ? "coffee" : "search"}
            size={50}
            color="#D1D5DB"
          />
          <Text style={styles.noDataText}>
            {activeTab === 'My Meals' ? 'No meals found' : 'No recipes found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes?.hits || recipes?.data?.data || recipes?.data || []}
          renderItem={renderRecipeCard}
          keyExtractor={(item, index) => {
            const recipe = item.recipe || item.recipe_details || item;
            return recipe?.uri || `recipe-${index}`;
          }}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreRecipes}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterVisible} transparent animationType="fade" onRequestClose={() => setIsFilterVisible(false)}>
        <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setIsFilterVisible(false)}>
          <View style={styles.filterSheet}>
            <Text style={styles.filterTitle}>Filter Recipes</Text>
            {FILTER_CATEGORIES.map(f => (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterOption, activeFilter === f.value && styles.filterOptionActive]}
                onPress={() => handleFilterSelect(f)}
              >
                <Text style={[styles.filterOptionText, activeFilter === f.value && styles.filterOptionTextActive]}>
                  {f.label}
                </Text>
                {activeFilter === f.value && (
                  <CustomIcon origin={ICON_TYPE.IONICONS} name="checkmark" size={18} color="#28C76F" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Shopping List Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Shopping List</Text>

            <FlatList
              data={shoppingLists?.data || []}
              keyExtractor={(item) => item.id.toString()}
              extraData={selectedList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.listItem,
                    selectedList?.id === item.id && styles.selectedListItem
                  ]}
                  onPress={() => handleListSelect(item)}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[
                      styles.listItemText,
                      selectedList?.id === item.id && styles.selectedListItemText
                    ]}>
                      {item.name}
                    </Text>
                    {selectedList?.id === item.id && (
                      <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="check-circle" size={20} color="#28C76F" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.modalList}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No shopping lists found. Please create one first.</Text>
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.continueBtn, !selectedList && styles.disabledBtn]}
                onPress={handleContinue}
                disabled={!selectedList}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </WrapperContainer>
  );
};

export default Recipes;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),

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
  logoText: { fontSize: textScale(16), fontWeight: '700', color: '#1A1C1E' },
  notifBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  mainTitle: {
    fontSize: textScale(22),
    fontWeight: '800',
    textAlign: 'center',
    color: '#1A1C1E',
    marginVertical: moderateScaleVertical(10),
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
    marginBottom: moderateScaleVertical(15),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: moderateScaleVertical(48),
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: textScale(14),
    color: '#1A1C1E',
  },
  filterBtn: {
    width: moderateScaleVertical(48),
    height: moderateScaleVertical(48),
    backgroundColor: '#28C76F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#16A34A' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  filterSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  filterTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  filterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  filterOptionActive: { backgroundColor: '#F0FDF4' },
  filterOptionText: { fontSize: 15, color: '#374151' },
  filterOptionTextActive: { color: '#16A34A', fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 10,
    paddingHorizontal: moderateScale(16),
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTabItem: {
    borderBottomWidth: 3,
    borderBottomColor: '#28C76F',
  },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  activeTabText: { color: '#28C76F' },
  listContent: { paddingHorizontal: moderateScale(16), paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    width: (width - 48) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    // Shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  imageContainer: { height: moderateScaleVertical(120), width: '100%' },
  recipeImage: { height: '100%', width: '100%', resizeMode: 'cover' },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
  },
  cardContent: { padding: 10 },
  recipeTitle: { fontSize: 15, fontWeight: '700', color: '#1A1C1E' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailsText: { fontSize: 11, color: '#6B7280', marginLeft: 4 },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginVertical: 10,
  },
  tagText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  addBtn: {
    backgroundColor: '#FB923C',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: textScale(14),
    color: '#6B7280',
    marginTop: 10,
  },
  noDataText: {
    fontSize: textScale(16),
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: textScale(18),
    fontWeight: '800',
    color: '#1A1C1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalList: {
    marginVertical: 10,
  },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  selectedListItem: {
    borderColor: '#28C76F',
    backgroundColor: '#F0FDF4',
    elevation: 2,
    shadowColor: '#28C76F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemText: {
    fontSize: textScale(14),
    color: '#4B5563',
  },
  selectedListItemText: {
    color: '#28C76F',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: textScale(14),
    fontWeight: '600',
  },
  continueBtn: {
    flex: 1,
    backgroundColor: '#FB923C',
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueBtnText: {
    color: 'white',
    fontSize: textScale(14),
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#FED7AA',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginVertical: 20,
    fontSize: textScale(14),
  },
});