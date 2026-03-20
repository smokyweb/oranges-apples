import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import CustomInput from '../../components/CustomInput';
import CustomAlert from '../../components/CustomAlert';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import Spacer from '../../components/Spacer';
import axiosRequest from '../../helper/axiosRequest';
import { getCachedLocation } from '../../helper/locationService';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import { filterTrackedNutrients, mergeWithDefaults, DEFAULT_NUTRIENT_TARGETS } from '../../helper/nutrients';
import { getShoppingLists, updateShoppingList, getNutritionTypes, getFamilyNutrition } from '../../../store/home/home.action';

// Store constants
const STORE_WALMART = 'walmart';
// const STORE_KROGER = 'kroger'; // KROGER DISABLED — re-enable when Kroger integration is ready

// RDA defaults when user has no nutrition profile


const formatNutrientKey = (key) => {
  if (!key) return '';
  return key.replace(/_/g, ' ').toUpperCase();
};

const getNutrientIcon = (key) => {
  switch (key?.toLowerCase()) {
    case 'calcium': return 'cheese';
    case 'carbs': return 'bread-slice';
    case 'protein': return 'egg';
    case 'vit a': return 'carrot';
    case 'vit c': return 'lemon';
    case 'sodium':
    case 'na': return 'shaker';
    default: return 'leaf';
  }
};

const getNutrientColor = (key) => {
  switch (key?.toLowerCase()) {
    case 'calcium': return '#60A5FA';
    case 'carbs': return '#FBBF24';
    case 'protein': return '#F87171';
    case 'vit a': return '#34D399';
    case 'vit c': return '#F59E0B';
    case 'fiber': return '#34D399';
    case 'iron': return '#F87171';
    case 'fat': return '#FBBF24';
    case 'sodium':
    case 'na': return '#94A3B8';
    default: return '#A78BFA';
  }
};

const NutrientGaugeBar = ({ nutrientKey, target, unit, current = 0 }) => {
  const fillPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const barColor = fillPercent >= 75 ? '#28C76F' : fillPercent >= 25 ? '#F59E0B' : '#EF4444';
  const baseColor = getNutrientColor(nutrientKey);
  const activeColor = current > 0 ? barColor : baseColor;

  return (
    <View style={gaugeStyles.container}>
      <View style={gaugeStyles.labelRow}>
        <Text style={gaugeStyles.emoji}>⛽</Text>
        <Text style={gaugeStyles.label}>{nutrientKey.replace(/_/g, ' ')}</Text>
        <Text style={gaugeStyles.target}>
          {current > 0
            ? `${Math.round(current * 10) / 10} / ${target} ${unit}`
            : `${target} ${unit} target`}
        </Text>
      </View>
      <View style={gaugeStyles.track}>
        <View style={[gaugeStyles.fill, { width: `${Math.max(fillPercent, 3)}%`, backgroundColor: activeColor }]} />
      </View>
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  container: { marginBottom: 10, paddingHorizontal: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  emoji: { fontSize: 16, marginRight: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1 },
  target: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  track: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    borderRadius: 5,
    opacity: 0.8,
  },
  marker: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

const NewShoppingList = ({ navigation, route }) => {
  const { editMode = false, listData = null, openModal = false } = route?.params || {};

  const [listName, setListName] = useState(editMode ? listData?.name || '' : '');
  const [budget, setBudget] = useState(editMode ? listData?.budget?.toString() || '0' : '0');
  const [days, setDays] = useState(editMode ? Number(listData?.timeline) || 7 : 7);
  const [selectedNutritionFocus, setSelectedNutritionFocus] = useState(() => {
    if (editMode) {
      if (Array.isArray(listData?.nutrition_focus)) {
        return listData.nutrition_focus;
      }
      if (
        typeof listData?.nutrition_focus === 'string' &&
        listData.nutrition_focus.trim().length
      ) {
        return listData.nutrition_focus
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
      }
    }
    return ['Balanced Diet'];
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentList, setCurrentList] = useState(editMode ? listData : null);
  const dispatch = useDispatch();
  const { nutritionTypes, familyNutrition, familyNutritionLoading } = useSelector(state => state.homeReducer);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [selectedNutrientKey, setSelectedNutrientKey] = useState(null);
  const [foodsForNutrient, setFoodsForNutrient] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodsError, setFoodsError] = useState('');
  const [selectedFoodIds, setSelectedFoodIds] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedFoodGroups, setExpandedFoodGroups] = useState({}); // key: `${nutrientKey}_${category}`
  const [foodQuantities, setFoodQuantities] = useState({}); // { [fdcId]: number } default 1

  const getFoodQty = (fdcId) => foodQuantities[fdcId] || 1;
  const setFoodQty = (fdcId, qty) => setFoodQuantities(prev => ({ ...prev, [fdcId]: Math.max(1, qty) }));

  // Manual food search
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualSearchError, setManualSearchError] = useState('');
  const [autoSavingFdcId, setAutoSavingFdcId] = useState(null); // tracks which item is mid-save
  // getUserLocation — reads cached {lat,lng} set by locationService at app startup
  const getUserLocation = React.useCallback(() => getCachedLocation(), []);

  const runManualSearch = async () => {
    const q = manualSearchQuery.trim();
    if (q.length < 2) return;
    setManualSearchLoading(true);
    setManualSearchError('');
    setManualSearchResults([]);
    try {
      // 1. Fetch USDA foods matching description
      const resp = await axiosRequest({
        method: 'GET',
        url: '/foods/search',
        params: { query: q, limit: 15 },
      });
      if (resp?.status !== 'success' || !resp.foods?.length) {
        setManualSearchError('No foods found. Try a different term.');
        setManualSearchLoading(false);
        return;
      }
      const baseFoods = resp.foods.map(f => ({
        ...f,
        storePrice: null,
        storeProduct: null,
        storePriceLoading: true,
      }));
      setManualSearchResults(baseFoods);

      // 2. Fetch prices for all results
      const loc = await getUserLocation();
      const locParams = loc ? { lat: loc.lat, lng: loc.lng } : {};

      if (selectedStore === STORE_WALMART) {
        const queries = [...new Set(baseFoods.map(f => f.description))];
        const priceResp = await axiosRequest({
          method: 'POST',
          url: 'walmart/fetch-lowest-price-per-ingredient',
          data: { queries },
        });
        const priceMap = {};
        (priceResp?.data || []).forEach(row => {
          if (row?.ingredient) priceMap[row.ingredient] = { price: row.lowest_price, product: row.product };
        });
        setManualSearchResults(prev =>
          [...prev]
            .map(f => {
              const m = priceMap[f.description];
              return m ? { ...f, storePriceLoading: false, storePrice: m.price, storeProduct: m.product } : { ...f, storePriceLoading: false };
            })
            .sort((a, b) => {
              const aR = a.storePrice ? a.storePrice : Infinity;
              const bR = b.storePrice ? b.storePrice : Infinity;
              return aR - bR;
            })
        );
      } /* KROGER DISABLED — uncomment when Kroger integration is ready
      else {
        const priceResults = await Promise.allSettled(
          baseFoods.map(f => axiosRequest({ method: 'GET', url: 'kroger/products', params: { query: f.description, limit: 1, ...locParams } }))
        );
        setManualSearchResults(prev =>
          [...prev]
            .map((f, i) => {
              const r = priceResults[i];
              if (r.status !== 'fulfilled') return { ...f, storePriceLoading: false };
              const product = r.value?.data?.[0];
              if (!product) return { ...f, storePriceLoading: false };
              return { ...f, storePriceLoading: false, storePrice: product.price, storeProduct: { itemId: product.id, name: product.name, thumbnailImage: product.image, salePrice: product.price } };
            })
            .sort((a, b) => {
              const aR = a.storePrice != null ? a.storePrice : Infinity;
              const bR = b.storePrice != null ? b.storePrice : Infinity;
              return aR - bR;
            })
        );
      }
      */
    } catch (e) {
      setManualSearchError('Search failed. Please try again.');
    } finally {
      setManualSearchLoading(false);
    }
  };
  const [addingItems, setAddingItems] = useState(false);
  const [selectedStore, setSelectedStore] = useState(STORE_WALMART);
  const [allNutrientProducts, setAllNutrientProducts] = useState({});

  // Normalize nutrition focus to always be an array
  const normalizedNutritionFocus = Array.isArray(selectedNutritionFocus)
    ? selectedNutritionFocus
    : typeof selectedNutritionFocus === 'string' && selectedNutritionFocus.trim().length
      ? selectedNutritionFocus
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
      : [];

  const nutritionFocusLabel = normalizedNutritionFocus.length
    ? normalizedNutritionFocus.join(', ')
    : 'Select nutrition focus';

  useEffect(() => {
    dispatch(getNutritionTypes());
  }, []);

  // Auto-open Smart Suggestions modal when navigated from an existing list
  useEffect(() => {
    if (openModal && editMode && (currentList || listData)) {
      // Small delay to let the screen finish mounting
      const t = setTimeout(() => openProductsModal(), 400);
      return () => clearTimeout(t);
    }
  }, [openModal]);

  const loadNutrientProducts = async (nutrientKey, store) => {
    setAllNutrientProducts(prev => ({
      ...prev,
      [nutrientKey]: { loading: true, foods: [], error: '' },
    }));

    try {
      const response = await axiosRequest({
        method: 'POST',
        url: '/foods/by-nutrient',
        data: { nutrient: nutrientKey, limit: 20 },
      });

      if (response?.status === 'success') {
        const baseFoods = (response.foods || []).map(food => ({
          ...food,
          storePrice: null,
          storeProduct: null,
          storePriceLoading: true,
        }));

        if (!baseFoods.length) {
          setAllNutrientProducts(prev => ({
            ...prev,
            [nutrientKey]: { loading: false, foods: [], error: 'No foods found.' },
          }));
          return;
        }

        // Show foods immediately (prices loading)
        setAllNutrientProducts(prev => ({
          ...prev,
          [nutrientKey]: { loading: false, foods: baseFoods, error: '' },
        }));

        // Fetch prices
        let pricedFoods = [...baseFoods];
        if (store === STORE_WALMART) {
          const queries = baseFoods.map(f => f.description).filter(Boolean);
          try {
            const priceResp = await axiosRequest({
              method: 'POST',
              url: 'walmart/fetch-lowest-price-per-ingredient',
              data: { queries },
            });
            if (priceResp?.success && Array.isArray(priceResp.data)) {
              const priceMap = {};
              priceResp.data.forEach(row => { if (row?.ingredient) priceMap[row.ingredient] = row; });
              pricedFoods = baseFoods.map(food => {
                const match = priceMap[food.description];
                if (!match) return { ...food, storePriceLoading: false };
                return { ...food, storePriceLoading: false, storePrice: match.lowest_price, storeProduct: match.product };
              });
            } else {
              pricedFoods = baseFoods.map(f => ({ ...f, storePriceLoading: false }));
            }
          } catch {
            pricedFoods = baseFoods.map(f => ({ ...f, storePriceLoading: false }));
          }
        } /* KROGER DISABLED — uncomment when Kroger integration is ready
        else {
          // Kroger: per-item parallel lookup with location for prices
          const loc = await getUserLocation();
          const locParams = loc ? { lat: loc.lat, lng: loc.lng } : {};
          const results = await Promise.allSettled(
            baseFoods.map(food => axiosRequest({
              method: 'GET',
              url: 'kroger/products',
              params: { query: food.description, limit: 1, ...locParams },
            }))
          );
          pricedFoods = baseFoods.map((food, idx) => {
            const r = results[idx];
            if (r.status !== 'fulfilled') return { ...food, storePriceLoading: false };
            const product = r.value?.data?.[0];
            if (!product) return { ...food, storePriceLoading: false };
            return {
              ...food,
              storePriceLoading: false,
              storePrice: product.price,
              storeProduct: { itemId: product.id, name: product.name, thumbnailImage: product.image, salePrice: product.price },
            };
          });
        }
        */

        // Sort by price per nutrient unit (cheapest first), priced items first
        pricedFoods.sort((a, b) => {
          const aNutr = a.nutrients?.[0]?.amount || 0;
          const bNutr = b.nutrients?.[0]?.amount || 0;
          const aRatio = (a.storePrice && aNutr) ? a.storePrice / aNutr : Infinity;
          const bRatio = (b.storePrice && bNutr) ? b.storePrice / bNutr : Infinity;
          return aRatio - bRatio;
        });

        setAllNutrientProducts(prev => ({
          ...prev,
          [nutrientKey]: { loading: false, foods: pricedFoods, error: '' },
        }));
      } else {
        setAllNutrientProducts(prev => ({
          ...prev,
          [nutrientKey]: { loading: false, foods: [], error: response?.message || 'No foods found.' },
        }));
      }
    } catch (error) {
      setAllNutrientProducts(prev => ({
        ...prev,
        [nutrientKey]: { loading: false, foods: [], error: error?.message || 'Failed to load products.' },
      }));
    }
  };

  const loadAllNutrients = (summary, store) => {
    const merged = mergeWithDefaults(summary);
    const targets = merged.length > 0 ? merged : DEFAULT_NUTRIENT_TARGETS;

    // Mark all as loading
    const initial = {};
    targets.forEach(item => {
      initial[item.nutrient_key] = { loading: true, foods: [], error: '' };
    });
    setAllNutrientProducts(initial);

    const sortFoods = (foods) => [...foods].sort((a, b) => {
      const aNutr = a.nutrients?.[0]?.amount || 0;
      const bNutr = b.nutrients?.[0]?.amount || 0;
      const aRatio = (a.storePrice && aNutr) ? a.storePrice / aNutr : Infinity;
      const bRatio = (b.storePrice && bNutr) ? b.storePrice / bNutr : Infinity;
      return aRatio - bRatio;
    });

    // Apply a partial price map to state immediately (called per chunk as it resolves)
    const applyPartialPrices = (chunkPriceMap, isFinal) => {
      setAllNutrientProducts(prev => {
        const updated = { ...prev };
        targets.forEach(item => {
          const key = item.nutrient_key;
          const foods = (prev[key]?.foods || []).map(food => {
            const match = chunkPriceMap[food.description];
            if (match) return { ...food, storePriceLoading: false, storePrice: match.price, storeProduct: match.product };
            // On final pass, clear any remaining loading spinners
            if (isFinal && food.storePriceLoading) return { ...food, storePriceLoading: false };
            return food;
          });
          // Always sort by price/nutrient ratio so order updates as each price comes in
          updated[key] = { loading: false, foods: sortFoods(foods), error: '' };
        });
        return updated;
      });
    };

    // Fetch USDA foods per-nutrient — each updates state the moment it resolves
    const nutrientFoodsMap = {};
    const usdaPromises = targets.map(async (item) => {
      try {
        const response = await axiosRequest({
          method: 'POST',
          url: '/foods/by-nutrient',
          data: { nutrient: item.nutrient_key, limit: 20 },
        });
        const foods = response?.status === 'success'
          ? (response.foods || []).map(food => ({ ...food, storePrice: null, storeProduct: null, storePriceLoading: true }))
          : [];
        nutrientFoodsMap[item.nutrient_key] = foods;
        // Show this nutrient's foods immediately — don't wait for others
        setAllNutrientProducts(prev => ({
          ...prev,
          [item.nutrient_key]: { loading: false, foods, error: '' },
        }));
      } catch {
        nutrientFoodsMap[item.nutrient_key] = [];
        setAllNutrientProducts(prev => ({
          ...prev,
          [item.nutrient_key]: { loading: false, foods: [], error: 'Failed to load.' },
        }));
      }
    });

    // After all USDA fetches done, kick off price fetching
    Promise.allSettled(usdaPromises).then(() => {
      const allDescriptions = [];
      Object.values(nutrientFoodsMap).forEach(foods => {
        foods.forEach(food => {
          if (food.description && !allDescriptions.includes(food.description)) {
            allDescriptions.push(food.description);
          }
        });
      });

      if (!allDescriptions.length) return;

      const total = allDescriptions.length;
      let resolved = 0;

      // Fire one request per unique description — all simultaneously,
      // each updates the UI the moment it resolves (no waiting on others)
      allDescriptions.forEach(desc => {
        const onDone = (priceMap) => {
          resolved++;
          applyPartialPrices(priceMap, resolved === total);
        };

        if (store === STORE_WALMART) {
          axiosRequest({
            method: 'POST',
            url: 'walmart/fetch-lowest-price-per-ingredient',
            data: { queries: [desc] },
          }).then(priceResp => {
            const priceMap = {};
            if (priceResp?.success && Array.isArray(priceResp.data)) {
              priceResp.data.forEach(row => {
                if (row?.ingredient) priceMap[row.ingredient] = { price: row.lowest_price, product: row.product };
              });
            }
            onDone(priceMap);
          }).catch(() => onDone({}));
        } /* KROGER DISABLED — uncomment when Kroger integration is ready
        else {
          getUserLocation().then(loc => {
            const locParams = loc ? { lat: loc.lat, lng: loc.lng } : {};
            axiosRequest({
              method: 'GET',
              url: 'kroger/products',
              params: { query: desc, limit: 1, ...locParams },
            }).then(resp => {
              const priceMap = {};
              const product = resp?.data?.[0];
              if (product) {
                priceMap[desc] = {
                  price: product.price,
                  product: { itemId: product.id, name: product.name, thumbnailImage: product.image, salePrice: product.price },
                };
              }
              onDone(priceMap);
            }).catch(() => onDone({}));
          });
        }
        */
      });
    });
  };

  const openProductsModal = () => {
    setShowNutritionModal(true);
    // Always re-fetch family nutrition so profile changes reflect immediately
    dispatch(getFamilyNutrition()).then((action) => {
      const summary =
        action?.payload?.summary ||
        action?.payload?.data?.summary ||
        [];
      // Only reload food products if we don't have data yet (preserve selections on re-open)
      const hasData = Object.keys(allNutrientProducts).length > 0;
      if (!hasData) {
        setSelectedNutrientKey(null);
        setFoodsForNutrient([]);
        setFoodsError('');
        loadAllNutrients(summary, selectedStore);
      }
    });
  };

  const fetchFoodsForNutrient = async (nutrientKey, storeOverride) => {
    if (!nutrientKey) return;

    const store = storeOverride || selectedStore;
    setSelectedNutrientKey(nutrientKey);
    setFoodsForNutrient([]);
    setFoodsError('');
    setFoodsLoading(true);

    try {
      const response = await axiosRequest({
        method: 'POST',
        url: '/foods/by-nutrient',
        data: { nutrient: nutrientKey, limit: 20 },
      });

      if (response?.status === 'success') {
        const baseFoodsRaw = response.foods || [];
        if (!baseFoodsRaw.length) {
          setFoodsForNutrient([]);
          setFoodsLoading(false);
          return;
        }

        const baseFoods = baseFoodsRaw.map(food => ({
          ...food,
          storePrice: null,
          storeProduct: null,
          storePriceLoading: true,
        }));
        setFoodsForNutrient(baseFoods);
        setFoodsLoading(false);

        try {
          if (store === STORE_WALMART) {
            // Batch Walmart price lookup
            const queries = baseFoods.map(f => f.description).filter(Boolean);
            if (!queries.length) {
              setFoodsForNutrient(baseFoods.map(f => ({ ...f, storePriceLoading: false })));
              return;
            }
            const priceResp = await axiosRequest({
              method: 'POST',
              url: 'walmart/fetch-lowest-price-per-ingredient',
              data: { queries },
            });
            if (priceResp?.success && Array.isArray(priceResp.data)) {
              const priceMap = {};
              priceResp.data.forEach(row => {
                if (row?.ingredient) priceMap[row.ingredient] = row;
              });
              setFoodsForNutrient(prev =>
                prev.map(food => {
                  const match = priceMap[food.description];
                  if (!match) return { ...food, storePriceLoading: false };
                  return {
                    ...food,
                    storePriceLoading: false,
                    storePrice: match.lowest_price,
                    storeProduct: match.product,
                  };
                })
              );
            } else {
              setFoodsForNutrient(prev => prev.map(f => ({ ...f, storePriceLoading: false })));
            }
          } /* KROGER DISABLED — uncomment when Kroger integration is ready
          else {
            // Per-item Kroger price lookup (parallel) with location for prices
            const loc = await getUserLocation();
            const locParams = loc ? { lat: loc.lat, lng: loc.lng } : {};
            const priceResults = await Promise.allSettled(
              baseFoods.map(food =>
                axiosRequest({
                  method: 'GET',
                  url: 'kroger/products',
                  params: { query: food.description, limit: 1, ...locParams },
                })
              )
            );
            setFoodsForNutrient(prev =>
              prev.map((food, idx) => {
                const result = priceResults[idx];
                if (result.status !== 'fulfilled') return { ...food, storePriceLoading: false };
                const resp = result.value;
                const product = resp?.data?.[0];
                if (!product) return { ...food, storePriceLoading: false };
                return {
                  ...food,
                  storePriceLoading: false,
                  storePrice: product.price,
                  storeProduct: {
                    itemId: product.id,
                    name: product.name,
                    thumbnailImage: product.image,
                    salePrice: product.price,
                    size: product.size,
                  },
                };
              })
            );
          }
          */ // END KROGER DISABLED
        } catch (e) {
          setFoodsForNutrient(prev => prev.map(f => ({ ...f, storePriceLoading: false })));
        }
      } else if (response?.status === 'not_found') {
        setFoodsForNutrient([]);
        setFoodsError(response.message || `No foods found for nutrient "${nutrientKey}".`);
        setFoodsLoading(false);
      } else {
        setFoodsForNutrient([]);
        setFoodsError(response?.message || 'Something went wrong while fetching foods.');
        setFoodsLoading(false);
      }
    } catch (error) {
      setFoodsForNutrient([]);
      setFoodsError(error?.message || 'Something went wrong while fetching foods.');
      setFoodsLoading(false);
    }
  };

  // Re-fetch prices when store changes
  const handleStoreChange = (store) => {
    setSelectedStore(store);
    // Reload all nutrient products for new store
    const summary = familyNutrition?.summary || familyNutrition?.data?.summary || [];
    setAllNutrientProducts({});
    loadAllNutrients(summary, store);
    // Keep backward compat for single-nutrient view
    if (selectedNutrientKey) {
      fetchFoodsForNutrient(selectedNutrientKey, store);
    }
  };

  // Group foods by type — always shows cheapest item from each group inline, rest collapsed
  const FOOD_CATEGORY_KEYWORDS = [
    'cheese','chicken','beef','pork','turkey','lamb','salmon','tuna','fish','shrimp','crab',
    'milk','yogurt','butter','cream','egg','eggs','whey','casein',
    'bread','rice','pasta','noodle','oat','oats','cereal','granola','flour','wheat','quinoa',
    'apple','orange','banana','grape','berry','berries','melon','mango','peach','pear','cherry',
    'broccoli','spinach','kale','carrot','potato','tomato','pepper','onion',
    'bean','beans','lentil','lentils','pea','peas','chickpea','tofu','tempeh','soy',
    'almond','walnut','peanut','cashew','pistachio','nut','nuts',
    'avocado','olive','coconut','flaxseed','chia','hemp',
  ];

  const extractFoodCategory = (description) => {
    const lower = description.toLowerCase();
    for (const kw of FOOD_CATEGORY_KEYWORDS) {
      if (lower.includes(kw)) return kw.charAt(0).toUpperCase() + kw.slice(1);
    }
    return null;
  };

  const getFoodSortRatio = (food) => {
    const amt = food.nutrients?.[0]?.amount || 0;
    return (food.storePrice != null && food.storePrice !== 'N/A' && amt)
      ? food.storePrice / amt : Infinity;
  };

  const groupFoodsByCategory = (foods) => {
    // foods already sorted cheapest-first by loadNutrientProducts
    const categoryMap = {};
    const ungrouped = [];

    foods.forEach(food => {
      const cat = extractFoodCategory(food.description);
      if (cat) {
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(food);
      } else {
        ungrouped.push(food);
      }
    });

    const result = [];

    Object.entries(categoryMap).forEach(([cat, items]) => {
      if (items.length >= 3) {
        // Always show cheapest item from this group inline
        result.push({ type: 'food', food: items[0], _sortRatio: getFoodSortRatio(items[0]) });
        // Collapse the rest into a "more" row right after — sort key just above cheapest
        result.push({
          type: 'group',
          category: cat,
          foods: items.slice(1),
          _sortRatio: getFoodSortRatio(items[0]) + 0.0001,
        });
      } else {
        items.forEach(f => result.push({ type: 'food', food: f, _sortRatio: getFoodSortRatio(f) }));
      }
    });

    ungrouped.forEach(f => result.push({ type: 'food', food: f, _sortRatio: getFoodSortRatio(f) }));

    // Sort the combined list by price ratio (cheapest first), unpriced last
    result.sort((a, b) => (a._sortRatio || Infinity) - (b._sortRatio || Infinity));

    return result;
  };

  const toggleFoodSelection = (fdcId) => {
    setSelectedFoodIds(prev => ({
      ...prev,
      [fdcId]: !prev[fdcId],
    }));
  };

  // Auto-save/remove when a manual search result is tapped
  const toggleManualSearchItem = async (food) => {
    const isCurrentlySelected = !!selectedFoodIds[food.fdcId];
    const targetList = currentList || listData;

    // Always update local selection + gauge immediately
    setSelectedFoodIds(prev => ({ ...prev, [food.fdcId]: !isCurrentlySelected }));

    if (!targetList?.id) return; // no list yet — selection still tracked, saved on bulk add

    setAutoSavingFdcId(food.fdcId);
    try {
      if (!isCurrentlySelected) {
        // Adding — save to cart API now
        const itemPayload = {
          shopping_list_id: targetList.id,
          items: [{
            product_id: (food.storeProduct?.itemId ?? food.fdcId)?.toString(),
            product_name: food.description,
            recipe_name: null,
            product_quantity: foodQuantities[food.fdcId] || 1,
            is_stock: 'true',
            image: food.storeProduct?.thumbnailImage || null,
            salePrice: food.storePrice != null && food.storePrice !== 'N/A' ? Number(food.storePrice) : 0,
            offer_id: food.storeProduct?.offerId || null,
            store: selectedStore,
            fdc_id: food.fdcId?.toString() || null,
            nutrients: food.allNutrients || null,
          }],
          force_add: true,
        };
        await axiosRequest({ method: 'POST', url: '/add-shopping-list-item', data: itemPayload });
      } else {
        // Removing — delete from cart API
        const productId = food.storeProduct?.itemId ?? food.fdcId;
        if (productId) {
          await axiosRequest({
            method: 'POST',
            url: '/delete-shopping-list-item',
            data: { shopping_list_id: targetList.id, product_id: productId?.toString() },
          });
        }
      }
    } catch {
      // Silently fail — local state already updated
    } finally {
      setAutoSavingFdcId(null);
    }
  };

  // Compute total cost of all selected foods (deduplicated by fdcId, includes manual search, scaled by quantity)
  const cartTotal = React.useMemo(() => {
    const seen = new Set();
    let total = 0;
    const allPools = [
      ...Object.values(allNutrientProducts).flatMap(({ foods }) => foods || []),
      ...manualSearchResults,
      ...foodsForNutrient,
    ];
    allPools.forEach(food => {
      if (selectedFoodIds[food.fdcId] && !seen.has(food.fdcId)) {
        seen.add(food.fdcId);
        const qty = foodQuantities[food.fdcId] || 1;
        total += (parseFloat(food.storePrice) || 0) * qty;
      }
    });
    return total;
  }, [selectedFoodIds, allNutrientProducts, manualSearchResults, foodsForNutrient, foodQuantities]);

  const handleAddSelectedFoods = async () => {
    let targetList = currentList || listData;

    // Collect selected foods — deduplicated by fdcId across all sections
    const selectedFoods = [];
    const seenFdcIds = new Set();
    Object.values(allNutrientProducts).forEach(({ foods }) => {
      (foods || []).forEach(food => {
        if (selectedFoodIds[food.fdcId] && !seenFdcIds.has(food.fdcId)) {
          seenFdcIds.add(food.fdcId);
          selectedFoods.push(food);
        }
      });
    });
    // Also include any from the legacy single-nutrient list
    foodsForNutrient.forEach(food => {
      if (selectedFoodIds[food.fdcId] && !seenFdcIds.has(food.fdcId)) {
        seenFdcIds.add(food.fdcId);
        selectedFoods.push(food);
      }
    });
    // Include manual search selections
    manualSearchResults.forEach(food => {
      if (selectedFoodIds[food.fdcId] && !seenFdcIds.has(food.fdcId)) {
        seenFdcIds.add(food.fdcId);
        selectedFoods.push(food);
      }
    });

    if (!selectedFoods.length) {
      showAlert('Please select at least one food item to add.');
      return;
    }

    const storeName = 'Walmart'; // const storeName = selectedStore === STORE_KROGER ? 'Kroger' : 'Walmart'; // KROGER DISABLED
    const items = selectedFoods
      .filter(food => food.storeProduct && food.storePrice != null && food.storePrice !== 'N/A')
      .map(food => {
        const qty = foodQuantities[food.fdcId] || 1;
        return {
          product_id: (food.storeProduct.itemId ?? food.fdcId)?.toString(),
          product_name: food.description,
          recipe_name: null,
          product_quantity: qty,
          is_stock: 'true',
          image: food.storeProduct.thumbnailImage || null,
          salePrice: Number(food.storePrice) || 0,
          offer_id: food.storeProduct.offerId || null,
          store: selectedStore,
          fdc_id: food.fdcId?.toString() || null,
          nutrients: food.allNutrients || null,
        };
      });

    if (!items.length) {
      showAlert(`No priced ${storeName} products found for the selected foods.`);
      return;
    }

    try {
      setAddingItems(true);

      // If no list exists yet, create it now before adding items
      if (!targetList?.id) {
        const nutritionFocusValue = normalizedNutritionFocus.join(', ');
        const createResp = await axiosRequest({
          method: 'POST',
          url: '/add-shopping-list',
          data: {
            name: listName.trim(),
            budget: parseFloat(budget),
            timeline: days.toString(),
            nutrition_focus: nutritionFocusValue,
          },
        });
        if (!createResp?.success) {
          showAlert(createResp?.data?.message || createResp?.message || 'Failed to create shopping list');
          setAddingItems(false);
          return;
        }
        targetList = createResp.data;
        setCurrentList(targetList);
        dispatch(getShoppingLists());
      }

      const payload = {
        shopping_list_id: targetList.id,
        items,
        force_add: true,
      };

      const resp = await axiosRequest({
        method: 'POST',
        url: '/add-shopping-list-item',
        data: payload,
      });

      if (resp?.status) {
        // Reset everything now that items are committed to the list
        setSelectedFoodIds({});
        setAllNutrientProducts({});
        setExpandedSections({});
        setExpandedFoodGroups({});
        setManualSearchResults([]);
        setManualSearchQuery('');
        setShowManualSearch(false);
        setFoodQuantities({});
        setShowNutritionModal(false);
        const finalList = targetList || currentList;
        if (finalList?.id) {
          NavigationService.navigate(RouteName.LIST_DETAILS, { listData: finalList });
        } else {
          NavigationService.navigate(RouteName.MY_SHOPPING_LIST);
        }
      } else {
        showAlert(resp?.data?.message || resp?.message || 'Failed to add items to shopping list.');
      }
    } catch (error) {
      showAlert(error?.message || 'Failed to add items to shopping list.');
    } finally {
      setAddingItems(false);
    }
  };

  const nutritionOptions = nutritionTypes?.data?.map(item => item.name) || [
    'Balanced Diet',
    'High Protein',
    'Low Carb',
    'Vegetarian',
    'Vegan',
    'Keto',
    'Mediterranean'
  ];

  const updateDays = (type) => {
    const numericDays = Number(days);
    if (type === 'minus' && numericDays > 1) setDays(numericDays - 1);
    if (type === 'plus' && numericDays < 14) setDays(numericDays + 1);
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const toggleNutritionOption = (option) => {
    setSelectedNutritionFocus(prev => {
      const base = Array.isArray(prev)
        ? prev
        : typeof prev === 'string' && prev.trim().length
          ? prev
              .split(',')
              .map(item => item.trim())
              .filter(Boolean)
          : [];

      if (base.includes(option)) {
        return base.filter(item => item !== option);
      }
      return [...base, option];
    });
  };

  const validateForm = () => {
    if (!listName.trim()) {
      showAlert('Please enter a list name');
      return false;
    }
    if (budget === '' || parseFloat(budget) < 0) {
      showAlert('Please enter a valid budget amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (editMode) {
      // Edit mode: update list details then go back
      setLoading(true);
      try {
        const nutritionFocusValue = normalizedNutritionFocus.join(', ');
        const updateData = {
          id: listData.id,
          name: listName.trim(),
          budget: parseFloat(budget),
          timeline: days.toString(),
          nutrition_focus: nutritionFocusValue,
        };
        const resp = await dispatch(updateShoppingList(updateData)).unwrap();
        if (resp?.success) {
          setCurrentList(resp.data);
          dispatch(getShoppingLists());
          navigation.goBack();
        } else {
          showAlert(resp?.message || 'Failed to update shopping list');
        }
      } catch (error) {
        showAlert(error?.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // New list: just open the modal — list is created only when items are added
      openProductsModal();
    }
  };

  return (
    <WrapperContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon origin={ICON_TYPE.IONICONS} name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editMode ? 'Update Shopping List' : 'New Shopping List'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* List Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>List Details</Text>
          <CustomInput
            placeholder="My Shopping List"
            value={listName}
            onChangeText={setListName}
          />

          {/* Budget Input Container */}
          <View style={styles.budgetInputWrapper}>
            <CustomInput
              placeholder="0.00"
              keyboardType="numeric"
              value={budget}
              onChangeText={text => {
                // Allow only numeric + decimal
                const cleaned = text.replace(/[^0-9.]/g, '');
                setBudget(cleaned);
              }}
              onFocus={() => {
                if (budget === '0' || budget === '0.00') setBudget('');
              }}
              onBlur={() => {
                if (!budget || budget.trim() === '') setBudget('0');
              }}
              leftIcon={<Text style={styles.currencySymbol}>$</Text>}
              inputStyle={{ paddingRight: moderateScale(70) }}
            />
            <Text style={styles.budgetSuffix}>Budget</Text>
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timeline</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => updateDays('minus')}
            >
              <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="minus" size={24} color="#1F2937" />
            </TouchableOpacity>

            <View style={styles.daysDisplay}>
              <Text style={styles.daysNumber}>{days}</Text>
              <Text style={styles.daysText}>days</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => updateDays('plus')}
            >
              <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="plus" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          {/* <Text style={styles.estimateText}>estimated meals: {days * 3}</Text> */}
        </View>

        {/* Nutrition Focus Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nutrition Focus</Text>
          <Text style={styles.sectionSubLabel}>We'll prioritize these</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{nutritionFocusLabel}</Text>
            <CustomIcon
              origin={ICON_TYPE.FEATHER_ICONS}
              name={showDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {showDropdown && (
            <>
              <TouchableOpacity
                style={styles.dropdownOverlay}
                onPress={() => setShowDropdown(false)}
                activeOpacity={1}
              />
              <View style={styles.dropdownList}>
                {nutritionOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => toggleNutritionOption(option)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedNutritionFocus.includes(option) && styles.selectedText,
                      ]}
                    >
                      {option}
                    </Text>
                    {selectedNutritionFocus.includes(option) && (
                      <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="check" size={16} color="#28C76F" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>{editMode ? 'Update Shopping List' : 'Continue →'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Spacer height={verticalScale(40)} />
      </ScrollView>

      {/* Loader Modal */}
      {/* <Modal transparent visible={loading} animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#28C76F" />
            <Text style={styles.loaderText}>{editMode ? 'Updating shopping list...' : 'Creating shopping list...'}</Text>
          </View>
        </View>
      </Modal> */}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        message={alertMessage}
        setVisible={setAlertVisible}
      />

      {/* Smart Suggestions Modal */}
      <Modal
        visible={showNutritionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNutritionModal(false)}
      >
        <Pressable
          style={styles.nutritionModalOverlay}
          onPress={() => setShowNutritionModal(false)}
        >
          <Pressable style={styles.nutritionModalContent} onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.nutritionModalHeader}>
              <Text style={styles.nutritionModalTitle}>Smart Suggestions ⛽</Text>
              <TouchableOpacity
                onPress={() => setShowNutritionModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <CustomIcon origin={ICON_TYPE.IONICONS} name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Store Selector hidden — Walmart only for now */}

            {/* Budget Tracker */}
            {(() => {
              const budgetNum = parseFloat(budget) || 0;
              const overBudget = budgetNum > 0 && cartTotal > budgetNum;
              const fillPct = budgetNum > 0 ? Math.min(cartTotal / budgetNum, 1) * 100 : 0;
              const barColor = overBudget ? '#EF4444' : cartTotal > 0 ? '#28C76F' : '#D1D5DB';
              return (
                <View style={styles.budgetTrackerRow}>
                  <View style={styles.budgetTrackerLabels}>
                    <Text style={styles.budgetTrackerCart}>
                      Cart: <Text style={{ color: overBudget ? '#EF4444' : '#28C76F', fontWeight: '700' }}>
                        ${cartTotal.toFixed(2)}
                      </Text>
                    </Text>
                    <Text style={styles.budgetTrackerLimit}>
                      {budgetNum > 0 ? `Budget: $${budgetNum.toFixed(2)}` : 'No budget set'}
                    </Text>
                  </View>
                  {budgetNum > 0 && (
                    <View style={styles.budgetTrackerBar}>
                      <View style={[styles.budgetTrackerFill, { width: `${fillPct}%`, backgroundColor: barColor }]} />
                    </View>
                  )}
                  {overBudget && (
                    <Text style={styles.budgetTrackerOver}>
                      ⚠ Over budget by ${(cartTotal - budgetNum).toFixed(2)}
                    </Text>
                  )}
                </View>
              );
            })()}

            <ScrollView
              style={styles.nutritionModalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.nutritionModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Manual Search — lives inside the ScrollView so results scroll naturally */}
              <View style={styles.manualSearchToggleRow}>
                <TouchableOpacity
                  style={[styles.manualSearchToggleBtn, showManualSearch && styles.manualSearchToggleBtnActive]}
                  onPress={() => { setShowManualSearch(v => !v); setManualSearchResults([]); setManualSearchError(''); setManualSearchQuery(''); }}
                >
                  <Text style={[styles.manualSearchToggleText, showManualSearch && styles.manualSearchToggleTextActive]}>
                    {showManualSearch ? '✕ Close Search' : '🔍 Search a specific food'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showManualSearch && (
                <View style={styles.manualSearchPanel}>
                  <View style={styles.manualSearchRow}>
                    <TextInput
                      style={styles.manualSearchInput}
                      placeholder="e.g. chicken breast, cheddar cheese..."
                      placeholderTextColor="#9CA3AF"
                      value={manualSearchQuery}
                      onChangeText={setManualSearchQuery}
                      onSubmitEditing={runManualSearch}
                      returnKeyType="search"
                    />
                    <TouchableOpacity
                      style={styles.manualSearchBtn}
                      onPress={runManualSearch}
                      disabled={manualSearchLoading}
                    >
                      {manualSearchLoading
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Text style={styles.manualSearchBtnText}>Search</Text>}
                    </TouchableOpacity>
                  </View>
                  {manualSearchError ? (
                    <Text style={styles.manualSearchError}>{manualSearchError}</Text>
                  ) : manualSearchResults.length > 0 ? (
                    <View>
                      <Text style={styles.manualSearchResultsLabel}>Results — cheapest first:</Text>
                      {manualSearchResults.map(food => {
                        const isSelected = !!selectedFoodIds[food.fdcId];
                        const isSaving = autoSavingFdcId === food.fdcId;
                        const qty = getFoodQty(food.fdcId);
                        const totalPrice = food.storePrice != null && food.storePrice !== 'N/A'
                          ? Number(food.storePrice) * qty : null;
                        const topNutrients = Object.values(food.allNutrients || {}).slice(0, 3);
                        return (
                          <View
                            key={food.fdcId}
                            style={[styles.smartProductCard, isSelected && styles.smartProductCardSelected]}
                          >
                            <TouchableOpacity
                              style={styles.smartProductLeft}
                              onPress={() => toggleManualSearchItem(food)}
                              disabled={isSaving}
                              activeOpacity={0.85}
                            >
                              {isSaving
                                ? <ActivityIndicator size="small" color="#28C76F" />
                                : <CustomIcon origin={ICON_TYPE.IONICONS}
                                    name={isSelected ? 'checkbox' : 'square-outline'}
                                    size={20} color={isSelected ? '#28C76F' : '#D1D5DB'} />}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.smartProductMid}
                              onPress={() => toggleManualSearchItem(food)}
                              disabled={isSaving}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.smartProductName} numberOfLines={2}>{food.description}</Text>
                              {topNutrients.length > 0 && (
                                <Text style={styles.smartProductNutrient} numberOfLines={1}>
                                  {topNutrients.map(n => `${Math.round(n.amount * 10) / 10}${n.unit} ${n.key}`).join(' · ')}
                                </Text>
                              )}
                              {isSelected && (
                                <Text style={{ fontSize: textScale(10), color: '#28C76F', fontWeight: '600', marginTop: 2 }}>
                                  ✓ Added to list
                                </Text>
                              )}
                            </TouchableOpacity>
                            <View style={styles.smartProductRight}>
                              {food.storePriceLoading ? (
                                <ActivityIndicator size="small" color="#28C76F" />
                              ) : totalPrice != null ? (
                                <>
                                  <Text style={styles.smartProductPrice}>${totalPrice.toFixed(2)}</Text>
                                  {qty > 1 && <Text style={styles.smartProductRatio}>${Number(food.storePrice).toFixed(2)} ea</Text>}
                                </>
                              ) : (
                                <Text style={styles.smartProductNoPrice}>No price</Text>
                              )}
                              {/* Quantity controls */}
                              <View style={styles.qtyControls}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setFoodQty(food.fdcId, qty - 1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                  <Text style={styles.qtyBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyValue}>{qty}</Text>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setFoodQty(food.fdcId, qty + 1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                  <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              )}

              <Text style={styles.smartSubtitle}>
                Cheapest products to hit your {days}-day nutrient targets. Tap to select, then add to your list.
              </Text>

              {(() => {
                const summary = familyNutrition?.summary || familyNutrition?.data?.summary || [];
                const merged = mergeWithDefaults(summary);
                const targets = merged.length > 0 ? merged : DEFAULT_NUTRIENT_TARGETS;

                return targets.map((item) => {
                  const key = item.nutrient_key;
                  const nutrientData = allNutrientProducts[key];
                  const isLoading = !nutrientData || nutrientData.loading;
                  const foods = nutrientData?.foods || [];
                  const error = nutrientData?.error || '';

                  return (
                    <View key={key} style={styles.nutrientSection}>
                      <NutrientGaugeBar
                        nutrientKey={key}
                        target={(item.total_target_value || 0) * (days || 1)}
                        unit={item.unit}
                        current={(() => {
                          // All selected foods across ALL sections including manual search (deduplicated, quantity-scaled)
                          const seen = new Set();
                          let total = 0;
                          const allPools = [
                            ...Object.values(allNutrientProducts).flatMap(s => s.foods || []),
                            ...manualSearchResults,
                          ];
                          allPools.forEach(f => {
                            if (selectedFoodIds[f.fdcId] && !seen.has(f.fdcId)) {
                              seen.add(f.fdcId);
                              const qty = foodQuantities[f.fdcId] || 1;
                              total += (f.allNutrients?.[key]?.amount || 0) * qty;
                            }
                          });
                          return total;
                        })()}
                      />

                      {isLoading ? (
                        <ActivityIndicator size="small" color="#28C76F" style={{ marginVertical: 10 }} />
                      ) : error ? (
                        <Text style={styles.noDataText}>{error}</Text>
                      ) : foods.length === 0 ? (
                        <Text style={styles.noDataText}>No products found for this nutrient.</Text>
                      ) : (() => {
                        const isExpanded = !!expandedSections[key];
                        const grouped = groupFoodsByCategory(foods);
                        const DEFAULT_VISIBLE = 4;
                        const visibleItems = isExpanded ? grouped : grouped.slice(0, DEFAULT_VISIBLE);
                        const hiddenSelected = !isExpanded
                          ? grouped.slice(DEFAULT_VISIBLE).reduce((n, item) => {
                              if (item.type === 'food') return n + (selectedFoodIds[item.food.fdcId] ? 1 : 0);
                              return n + item.foods.filter(f => selectedFoodIds[f.fdcId]).length;
                            }, 0)
                          : 0;

                        const renderFoodCard = (food) => {
                          const isSelected = !!selectedFoodIds[food.fdcId];
                          const qty = getFoodQty(food.fdcId);
                          const nutrientAmount = food.nutrients?.[0]?.amount;
                          const nutrientUnit = food.nutrients?.[0]?.unit;
                          const pricePerUnit = food.storePrice && nutrientAmount
                            ? (food.storePrice / nutrientAmount).toFixed(3) : null;
                          const totalPrice = food.storePrice != null && food.storePrice !== 'N/A'
                            ? Number(food.storePrice) * qty : null;
                          return (
                            <View key={food.fdcId} style={[styles.smartProductCard, isSelected && styles.smartProductCardSelected]}>
                              <TouchableOpacity
                                style={styles.smartProductLeft}
                                onPress={() => toggleFoodSelection(food.fdcId)}
                                activeOpacity={0.85}
                              >
                                <CustomIcon origin={ICON_TYPE.IONICONS}
                                  name={isSelected ? 'checkbox' : 'square-outline'}
                                  size={20} color={isSelected ? '#28C76F' : '#D1D5DB'} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.smartProductMid}
                                onPress={() => toggleFoodSelection(food.fdcId)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.smartProductName} numberOfLines={2}>{food.description}</Text>
                                {nutrientAmount && (
                                  <Text style={styles.smartProductNutrient}>
                                    {nutrientAmount} {nutrientUnit} {key.replace(/_/g, ' ')}
                                  </Text>
                                )}
                              </TouchableOpacity>
                              <View style={styles.smartProductRight}>
                                {food.storePriceLoading ? (
                                  <ActivityIndicator size="small" color="#28C76F" />
                                ) : totalPrice != null ? (
                                  <>
                                    <Text style={styles.smartProductPrice}>${totalPrice.toFixed(2)}</Text>
                                    {qty > 1 && <Text style={styles.smartProductRatio}>${Number(food.storePrice).toFixed(2)} ea</Text>}
                                    {pricePerUnit && (
                                      <Text style={styles.smartProductRatio}>
                                        ${pricePerUnit}/{nutrientUnit} {qty > 1 ? `(×${qty})` : ''}
                                      </Text>
                                    )}
                                  </>
                                ) : (
                                  <Text style={styles.smartProductNoPrice}>No price</Text>
                                )}
                                {/* Quantity controls */}
                                <View style={styles.qtyControls}>
                                  <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => setFoodQty(food.fdcId, qty - 1)}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  >
                                    <Text style={styles.qtyBtnText}>−</Text>
                                  </TouchableOpacity>
                                  <Text style={styles.qtyValue}>{qty}</Text>
                                  <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => setFoodQty(food.fdcId, qty + 1)}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  >
                                    <Text style={styles.qtyBtnText}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          );
                        };

                        return (
                          <View>
                            {visibleItems.map((item, idx) => {
                              if (item.type === 'food') {
                                return renderFoodCard(item.food);
                              }
                              // Grouped category row
                              const groupKey = `${key}_${item.category}`;
                              const isGroupExpanded = !!expandedFoodGroups[groupKey];
                              const selectedInGroup = item.foods.filter(f => selectedFoodIds[f.fdcId]).length;
                              return (
                                <View key={groupKey}>
                                  <TouchableOpacity
                                    style={styles.foodGroupHeader}
                                    onPress={() => setExpandedFoodGroups(prev => ({ ...prev, [groupKey]: !isGroupExpanded }))}
                                    activeOpacity={0.8}
                                  >
                                    <Text style={styles.foodGroupTitle}>
                                      {isGroupExpanded ? '▾' : '▸'} {item.foods.length} more {item.category} options
                                      {selectedInGroup > 0 ? `  ✓ ${selectedInGroup} selected` : ''}
                                    </Text>
                                    <Text style={styles.foodGroupHint}>
                                      {isGroupExpanded ? 'collapse' : 'tap to see'}
                                    </Text>
                                  </TouchableOpacity>
                                  {isGroupExpanded && item.foods.map(f => renderFoodCard(f))}
                                </View>
                              );
                            })}

                            {/* View All / Collapse toggle */}
                            {grouped.length > DEFAULT_VISIBLE && (
                              <TouchableOpacity
                                style={styles.viewAllBtn}
                                onPress={() => setExpandedSections(prev => ({ ...prev, [key]: !isExpanded }))}
                                activeOpacity={0.75}
                              >
                                <Text style={styles.viewAllBtnText}>
                                  {isExpanded
                                    ? '▲ Show less'
                                    : `▼ View all ${grouped.length} items${hiddenSelected > 0 ? ` · ${hiddenSelected} selected below` : ''}`}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  );
                });
              })()}

              <View style={styles.nutrientSubmitContainer}>
                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    (!Object.values(selectedFoodIds).some(Boolean) || addingItems) && styles.disabledBtn,
                  ]}
                  onPress={handleAddSelectedFoods}
                  disabled={!Object.values(selectedFoodIds).some(Boolean) || addingItems}
                >
                  {addingItems ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createBtnText}>
                      Add {Object.values(selectedFoodIds).filter(Boolean).length > 0
                        ? Object.values(selectedFoodIds).filter(Boolean).length + ' '
                        : ''}Item{Object.values(selectedFoodIds).filter(Boolean).length !== 1 ? 's' : ''} to List
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <Spacer height={40} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: moderateScaleVertical(10),
  },
  section: {
    marginBottom: moderateScaleVertical(30),
  },
  sectionLabel: {
    fontSize: textScale(15),
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScaleVertical(12),
  },
  sectionSubLabel: {
    fontSize: textScale(13),
    color: '#6B7280',
    marginBottom: moderateScaleVertical(12),
  },
  budgetInputWrapper: {
    justifyContent: 'center',
    position: 'relative',
    marginTop: moderateScaleVertical(10),
  },
  currencySymbol: {
    fontSize: textScale(16),
    color: '#6B7280',
    marginRight: 4,
  },
  budgetSuffix: {
    position: 'absolute',
    right: moderateScale(16),

    bottom: moderateScaleVertical(30),
    fontSize: textScale(14),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: moderateScaleVertical(10),
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysDisplay: {
    alignItems: 'center',
    marginHorizontal: moderateScale(30),
  },
  daysNumber: {
    fontSize: textScale(32),
    fontWeight: '800',
    color: '#111827',
  },
  daysText: {
    fontSize: textScale(14),
    color: '#6B7280',
  },
  estimateText: {
    textAlign: 'center',
    fontSize: textScale(13),
    color: '#6B7280',
    marginTop: moderateScaleVertical(8),
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: moderateScaleVertical(52),
    paddingHorizontal: moderateScale(16),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: textScale(14),
    color: '#1F2937',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  dropdownList: {
    marginTop: moderateScaleVertical(8),
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScaleVertical(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: textScale(14),
    color: '#1F2937',
  },
  selectedText: {
    color: '#28C76F',
    fontWeight: '600',
  },
  footer: {
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  createBtn: {
    backgroundColor: '#28C76F',
    height: moderateScaleVertical(52),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
  },
  createBtnText: {
    fontSize: textScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  createBtnSecondary: {
    backgroundColor: '#1F2937',
    marginTop: moderateScaleVertical(12),
  },
  nutritionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionModalContent: {
    width: '100%',
    height: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  nutritionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nutritionModalTitle: {
    fontSize: textScale(18),
    fontWeight: '700',
    color: '#1F2937',
  },
  nutritionModalBody: {
    flex: 1,
    padding: moderateScale(16),
  },
  nutritionModalScrollContent: {
    paddingBottom: moderateScaleVertical(20),
  },
  nutritionHorizontalScroll: {
    paddingVertical: 12,
  },
  nutritionColumn: {
    marginRight: 10,
  },
  nutritionItem: {
    width: moderateScale(78),
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  nutritionItemSelected: {
    borderColor: '#FF6B35',
    borderWidth: 2,
    backgroundColor: '#FFF7ED',
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
  nutrientFoodsSection: {
    marginTop: moderateScaleVertical(16),
  },
  nutrientFoodsList: {
    maxHeight: moderateScaleVertical(260),
  },
  nutrientFoodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: moderateScaleVertical(6),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  nutrientFoodTitle: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#111827',
  },
  nutrientFoodSubtitle: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginTop: 2,
  },
  nutrientFoodPrice: {
    fontSize: textScale(12),
    color: '#111827',
    marginTop: 2,
    fontWeight: '600',
  },
  foodCheckbox: {
    marginRight: moderateScale(10),
    marginTop: moderateScaleVertical(2),
  },
  nutrientSubmitContainer: {
    marginTop: moderateScaleVertical(12),
  },
  noDataText: {
    fontSize: textScale(14),
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: textScale(14),
    fontWeight: '700',
    color: '#374151',
    lineHeight: 18,
  },
  qtyValue: {
    fontSize: textScale(13),
    fontWeight: '700',
    color: '#1F2937',
    minWidth: 20,
    textAlign: 'center',
  },
  manualSearchToggleRow: {
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScaleVertical(6),
  },
  manualSearchToggleBtn: {
    paddingVertical: moderateScaleVertical(8),
    paddingHorizontal: moderateScale(14),
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignSelf: 'flex-start',
  },
  manualSearchToggleBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  manualSearchToggleText: {
    fontSize: textScale(13),
    fontWeight: '600',
    color: '#374151',
  },
  manualSearchToggleTextActive: {
    color: '#EF4444',
  },
  manualSearchPanel: {
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScaleVertical(8),
    padding: moderateScale(12),
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  manualSearchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  manualSearchInput: {
    flex: 1,
    height: moderateScaleVertical(40),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: moderateScale(10),
    fontSize: textScale(13),
    backgroundColor: '#FFF',
    color: '#111827',
  },
  manualSearchBtn: {
    backgroundColor: '#28C76F',
    borderRadius: 8,
    paddingHorizontal: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  manualSearchBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: textScale(13),
  },
  manualSearchError: {
    color: '#EF4444',
    fontSize: textScale(12),
    marginTop: 4,
  },
  manualSearchResultsLabel: {
    fontSize: textScale(12),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  foodGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(10),
    paddingHorizontal: moderateScale(12),
    marginVertical: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  foodGroupTitle: {
    fontSize: textScale(13),
    fontWeight: '700',
    color: '#1E40AF',
    flex: 1,
  },
  foodGroupHint: {
    fontSize: textScale(11),
    color: '#60A5FA',
    marginLeft: 8,
  },
  viewAllBtn: {
    marginTop: 4,
    marginHorizontal: moderateScale(4),
    paddingVertical: moderateScaleVertical(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  viewAllBtnText: {
    fontSize: textScale(12),
    color: '#28C76F',
    fontWeight: '600',
  },
  budgetTrackerRow: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScaleVertical(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  budgetTrackerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetTrackerCart: {
    fontSize: textScale(13),
    color: '#374151',
    fontWeight: '600',
  },
  budgetTrackerLimit: {
    fontSize: textScale(12),
    color: '#6B7280',
  },
  budgetTrackerBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetTrackerFill: {
    height: 6,
    borderRadius: 3,
  },
  budgetTrackerOver: {
    fontSize: textScale(11),
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '600',
  },
  storeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScaleVertical(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  storeSelectorLabel: {
    fontSize: textScale(13),
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 10,
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
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: '#fff',
    padding: moderateScale(30),
    borderRadius: 12,
    alignItems: 'center',
    minWidth: moderateScale(150),
  },
  loaderText: {
    marginTop: moderateScaleVertical(15),
    fontSize: textScale(14),
    color: '#1F2937',
    fontWeight: '500',
  },
  nutrientSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  smartSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 18,
  },
  smartProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  smartProductCardSelected: {
    borderColor: '#28C76F',
    backgroundColor: '#F0FDF4',
  },
  smartProductLeft: {
    marginRight: 10,
  },
  smartProductMid: {
    flex: 1,
    marginRight: 8,
  },
  smartProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  smartProductNutrient: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  smartProductRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  smartProductPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#28C76F',
  },
  smartProductRatio: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  smartProductNoPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  nutrientProductScroll: {
    maxHeight: 240,
    marginTop: 4,
  },
});


export default NewShoppingList;