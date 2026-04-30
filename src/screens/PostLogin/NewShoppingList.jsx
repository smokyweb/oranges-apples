import React, { useState, useEffect, useRef } from 'react';
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
  Switch,
  Platform,
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
import { CURATED_GROCERY_FOODS } from '../../helper/curatedFoods';
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

const NutrientGaugeBar = ({ nutrientKey, target, unit, current = 0, dailyTarget = 0, days = 1 }) => {
  const fillPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const barColor = fillPercent >= 100 ? '#16A34A' : fillPercent >= 75 ? '#28C76F' : fillPercent >= 25 ? '#F59E0B' : '#EF4444';
  const baseColor = getNutrientColor(nutrientKey);
  const activeColor = current > 0 ? barColor : baseColor;

  // Days-based display: how many days of this nutrient does the selection cover?
  const daysCovered = dailyTarget > 0 ? current / dailyTarget : 0;
  const daysRounded = Math.round(daysCovered * 10) / 10;

  return (
    <View style={gaugeStyles.container}>
      <View style={gaugeStyles.labelRow}>
        <Text style={gaugeStyles.emoji}>⛽</Text>
        <Text style={gaugeStyles.label}>{nutrientKey.replace(/_/g, ' ')}</Text>
        <Text style={gaugeStyles.target}>
          {current > 0
            ? `${daysRounded} / ${days} days`
            : `${days} days needed`}
        </Text>
      </View>
      <View style={gaugeStyles.track}>
        <View style={[gaugeStyles.fill, { width: `${Math.max(fillPercent, 2)}%`, backgroundColor: activeColor }]} />
      </View>
      {current > 0 && (
        <Text style={gaugeStyles.rawAmount}>
          {Math.round(current * 10) / 10} {unit} of {Math.round(target * 10) / 10} {unit} target
        </Text>
      )}
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  container: { marginBottom: 12, paddingHorizontal: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  emoji: { fontSize: 16, marginRight: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1 },
  target: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  rawAmount: { fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'right' },
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
  const [budget, setBudget] = useState(editMode ? listData?.budget?.toString() || '100' : '100');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [days, setDays] = useState(editMode ? Number(listData?.timeline) || 1 : 1);

  // Supplemental assistance & dietary preferences
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [wicEnabled, setWicEnabled] = useState(false);
  const [foodPreference, setFoodPreference] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [showFoodPrefDropdown, setShowFoodPrefDropdown] = useState(false);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const FOOD_PREFERENCES = ['None', 'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo'];
  const ALLERGY_OPTIONS = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Eggs', 'Soy'];

  const toggleAllergy = (allergy) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };
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
  const updateFoodQty = (fdcId, delta) => setFoodQty(fdcId, getFoodQty(fdcId) + delta);

  // Manual food search
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualSearchError, setManualSearchError] = useState('');
  const [autoSavingFdcId, setAutoSavingFdcId] = useState(null); // tracks which item is mid-save
  // getUserLocation — reads cached {lat,lng} set by locationService at app startup
  const getUserLocation = React.useCallback(() => getCachedLocation(), []);

  // ─── GREEDY AUTO-SELECT ───────────────────────────────────────────────────
  // After prices load: for each nutrient (cheapest-to-fill first), find the
  // cheapest food+qty combo that covers 100% of the daily target × days.
  // Cross-coverage: selecting a food for nutrient A reduces deficit for B,C…
  // Reset when days changes so re-runs with new count.
  const autoSelectDoneRef = useRef(false);
  // Curated foods selected by auto-select — needed so gauges + cart total can count them
  const [curatedSelections, setCuratedSelections] = useState([]);
  // When days changes, clear previous auto-selections so algorithm re-runs with new day count
  useEffect(() => {
    autoSelectDoneRef.current = false;
    setSelectedFoodIds({});
    setFoodQuantities({});
    setCuratedSelections([]);
  }, [days]);
  useEffect(() => {
    if (isAutoGenerating) return;
    if (Object.keys(allNutrientProducts).length === 0) return;
    if (autoSelectDoneRef.current) return;
    if (Object.keys(selectedFoodIds).length > 0) { autoSelectDoneRef.current = true; return; }

    const safePrice = (v) => {
      if (v == null || v === 'N/A') return Infinity;
      const n = parseFloat(v);
      return isNaN(n) || n <= 0 ? Infinity : n;
    };

    // SODIUM and FAT are upper-limit nutrients, not goals to maximize — skip in auto-select
    const SKIP_NUTRIENTS = new Set(['SODIUM', 'FAT']);

    const summary = familyNutrition?.summary || familyNutrition?.data?.summary || [];
    const targets = mergeWithDefaults(summary);

    // Collect any live Walmart prices already fetched for USDA foods
    const livePriceMap = {};
    Object.values(allNutrientProducts).forEach(nutrientData => {
      (nutrientData?.foods || []).forEach(food => {
        if (food.description && food.storePrice != null && food.storePrice !== 'N/A') {
          const p = parseFloat(food.storePrice);
          const d = food.description.toLowerCase();
          if (!isNaN(p) && p > 0 && (!livePriceMap[d] || p < livePriceMap[d])) {
            livePriceMap[d] = p;
          }
        }
      });
    });

    // PRIMARY food pool: curated grocery items from the Gas Tank spreadsheet
    // Enriched with live Walmart prices when available, else use known fallback prices
    const foodPool = {};
    CURATED_GROCERY_FOODS.forEach(food => {
      const descWords = food.description.toLowerCase().split(' ').filter(w => w.length > 3);
      let bestLivePrice = null;
      Object.entries(livePriceMap).forEach(([liveDesc, livePrice]) => {
        if (descWords.some(w => liveDesc.includes(w))) {
          if (bestLivePrice === null || livePrice < bestLivePrice) bestLivePrice = livePrice;
        }
      });
      foodPool[food.fdcId] = {
        ...food,
        storePrice: bestLivePrice !== null ? bestLivePrice : food.storePrice,
      };
    });

    // Helper: how much of a nutrient does 1 unit of food provide?
    const amountPerUnit = (food, nutrientKey) => {
      const portion = food.portionGrams || 100;
      const per100g = food.allNutrients?.[nutrientKey]?.amount || 0;
      return (per100g / 100) * portion;
    };

    // For each nutrient, calculate cheapest independent cost-to-fill 1 day
    // (used to sort nutrients: cheapest first, like Gas Tank spreadsheet)
    const indepCost = (nutrientKey, dailyTarget) => {
      const foods = Object.values(foodPool).filter(f => safePrice(f.storePrice) < Infinity);
      let best = Infinity;
      for (const f of foods) {
        const amt = amountPerUnit(f, nutrientKey);
        if (amt <= 0) continue;
        const qtyNeeded = Math.ceil(dailyTarget / amt);
        const cost = safePrice(f.storePrice) * qtyNeeded;
        if (cost < best) best = cost;
      }
      return best;
    };

    // Sort targets: cheapest to cover independently first
    const sortedTargets = [...targets]
      .filter(t => !SKIP_NUTRIENTS.has(t.nutrient_key)) // skip SODIUM, FAT
      .sort((a, b) =>
        indepCost(a.nutrient_key, a.total_target_value) -
        indepCost(b.nutrient_key, b.total_target_value)
      );

    // Track remaining deficit per nutrient (in nutrient units, scaled by days)
    const deficit = {};
    sortedTargets.forEach(t => {
      deficit[t.nutrient_key] = (t.total_target_value || 0) * days;
    });

    const selected = {}; // fdcId -> qty

    for (const target of sortedTargets) {
      const key = target.nutrient_key;
      if ((deficit[key] || 0) <= 0) continue; // already covered by cross-benefit

      const remaining = deficit[key];

      // Find cheapest food+qty to cover this deficit, capped by max cost per nutrient
      let bestFood = null, bestQty = 1, bestCost = Infinity;
      const foods = Object.values(foodPool).filter(f => safePrice(f.storePrice) < Infinity);

      for (const food of foods) {
        const amt = amountPerUnit(food, key);
        if (amt <= 0) continue;
        const qtyNeeded = Math.max(1, Math.ceil(remaining / amt));
        const totalCost = safePrice(food.storePrice) * qtyNeeded;
        if (totalCost < bestCost) {
          bestCost = totalCost;
          bestFood = food;
          bestQty = qtyNeeded;
        }
      }

      if (!bestFood) continue;

      // Add to selection — always add the qty needed to cover remaining deficit,
      // on top of whatever's already in the cart (deficit already accounts for cross-benefits)
      const prevQty = selected[bestFood.fdcId] || 0;
      const addedQty = bestQty; // always add this many MORE units to cover remaining deficit
      selected[bestFood.fdcId] = prevQty + addedQty;

      // Reduce ALL nutrients' deficits by what this food contributes (cross-benefit)
      if (addedQty > 0) {
        sortedTargets.forEach(t => {
          const contrib = amountPerUnit(bestFood, t.nutrient_key) * addedQty;
          deficit[t.nutrient_key] = Math.max(0, (deficit[t.nutrient_key] || 0) - contrib);
        });
      }
    }

    if (Object.keys(selected).length > 0) {
      const selectedIds = {};
      const quantities = {};
      Object.entries(selected).forEach(([fdcId, qty]) => {
        selectedIds[fdcId] = true;
        quantities[fdcId] = qty;
      });
      setSelectedFoodIds(selectedIds);
      setFoodQuantities(prev => ({ ...prev, ...quantities }));
      // Inject curated foods into allNutrientProducts so they appear in each nutrient's scrollable list
      const curatedFoodObjects = Object.keys(selected).map(fdcId => foodPool[fdcId]).filter(Boolean);
      setCuratedSelections(curatedFoodObjects);
      setAllNutrientProducts(prev => {
        const updated = { ...prev };
        // For each tracked nutrient, add any curated food that contributes to it
        Object.keys(updated).forEach(nutrientKey => {
          const existingIds = new Set((updated[nutrientKey]?.foods || []).map(f => f.fdcId));
          const toAdd = curatedFoodObjects.filter(f =>
            !existingIds.has(f.fdcId) && (f.allNutrients?.[nutrientKey]?.amount || 0) > 0
          );
          if (toAdd.length > 0) {
            updated[nutrientKey] = {
              ...updated[nutrientKey],
              foods: [...toAdd, ...(updated[nutrientKey]?.foods || [])],
            };
          }
        });
        return updated;
      });
      autoSelectDoneRef.current = true;
    }
  }, [isAutoGenerating, allNutrientProducts, days]);

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

    const safePrice = (v) => {
      if (v == null || v === 'N/A') return Infinity;
      const n = parseFloat(v);
      return isNaN(n) || n <= 0 ? Infinity : n;
    };

    const sortFoods = (foods) => [...foods].sort((a, b) => safePrice(a.storePrice) - safePrice(b.storePrice));

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

      if (!allDescriptions.length) {
        setIsAutoGenerating(false); // nothing to price — lift loader immediately
        return;
      }

      const total = allDescriptions.length;
      let resolved = 0;
      const cumulativePriceMap = {}; // accumulates prices as each request resolves

      // Safety: if prices never finish (network issue), lift loader after 30s
      const loaderTimeout = setTimeout(() => setIsAutoGenerating(false), 30000);

      // Fire one request per unique description — all simultaneously,
      // each updates the UI the moment it resolves (no waiting on others)
      allDescriptions.forEach(desc => {
        const onDone = (priceMap) => {
          // Accumulate into the shared map
          Object.assign(cumulativePriceMap, priceMap);
          resolved++;
          applyPartialPrices(priceMap, resolved === total);

          // When ALL prices are in, run auto-generation with full live data
          if (resolved === total) {
            const foodPool = {};
            Object.values(nutrientFoodsMap).forEach(foods => {
              foods.forEach(f => {
                if (f.fdcId && !foodPool[f.fdcId]) {
                  const priceData = cumulativePriceMap[f.description];
                  const enriched = priceData
                    ? { ...f, storePrice: priceData.price, storeProduct: priceData.product, storePriceLoading: false }
                    : { ...f, storePriceLoading: false };
                  if (enriched.storePrice != null && enriched.storePrice !== 'N/A' && parseFloat(enriched.storePrice) > 0) {
                    foodPool[f.fdcId] = enriched;
                  }
                }
              });
            });
            // Prices done loading — lift the overlay. No auto-select; user picks manually.
            clearTimeout(loaderTimeout);
            setIsAutoGenerating(false);
          }
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
        // Start on first nutrient
        const _s = summary?.length > 0 ? summary : [];
        const _m = mergeWithDefaults(_s);
        const _first = (_m.length > 0 ? _m : DEFAULT_NUTRIENT_TARGETS)[0];
        setSelectedNutrientKey(_first?.nutrient_key || null);
        setFoodsForNutrient([]);
        setFoodsError('');
        setIsAutoGenerating(true);
        loadAllNutrients(summary, selectedStore);
      } else {
        // Re-opening — keep selected nutrient, just make sure one is set
        setSelectedNutrientKey(prev => prev || DEFAULT_NUTRIENT_TARGETS[0]?.nutrient_key || null);
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
      ...curatedSelections,
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

  // Helper: estimate cost to independently cover a nutrient target using cheapest food
  const cheapestCostForNutrient = (nutrientKey, totalNeeded, foods) => {
    let minCost = Infinity;
    foods.forEach(food => {
      const price = parseFloat(food.storePrice) || 0;
      if (price <= 0) return;
      const portionGrams = food.portionGrams || 100;
      const amtPer100g = food.allNutrients?.[nutrientKey]?.amount || 0;
      const contribution = (amtPer100g / 100) * portionGrams;
      if (contribution <= 0) return;
      const servings = Math.ceil(totalNeeded / contribution);
      const cost = price * servings;
      if (cost < minCost) minCost = cost;
    });
    return minCost === Infinity ? 0 : minCost;
  };

  // Auto-generate the cheapest list that covers all nutrient targets.
  // Accepts explicit foodsPool so it never reads stale state (avoids closure bugs).
  // budgetLimit: max total spend in dollars (0 = no cap).
  const autoGenerateList = (nutrientTargets, foodsPool, budgetLimit = 0) => {
    const allFoods = Object.values(foodsPool || {});
    if (!allFoods.length || !nutrientTargets?.length) return;

    const periodDays = days || 7;

    // remaining[key] = total amount still needed for the period (starts at daily × days)
    const remaining = {};
    nutrientTargets.forEach(t => {
      remaining[t.nutrient_key] = (t.total_target_value || 0) * periodDays;
    });

    // Sort nutrients by their individual cost-to-cover (most expensive first)
    // so the most critical needs are addressed before cheaper ones
    const nutrientOrder = [...nutrientTargets].sort((a, b) => {
      const costA = cheapestCostForNutrient(a.nutrient_key, a.total_target_value * periodDays, allFoods);
      const costB = cheapestCostForNutrient(b.nutrient_key, b.total_target_value * periodDays, allFoods);
      return costB - costA; // most expensive first
    });

    const selected = {}; // fdcId -> qty
    let totalSpentSoFar = 0; // running cost total for budget cap

    nutrientOrder.forEach(({ nutrient_key }) => {
      if ((remaining[nutrient_key] || 0) <= 0) return; // already covered by earlier selections

      // Find cheapest food per unit of this nutrient (among remaining priced foods)
      let bestFood = null;
      let bestRatio = Infinity;

      allFoods.forEach(food => {
        const price = parseFloat(food.storePrice) || 0;
        if (price <= 0) return;
        const portionGrams = food.portionGrams || 100;
        const amtPer100g = food.allNutrients?.[nutrient_key]?.amount || 0;
        const contribution = (amtPer100g / 100) * portionGrams;
        if (contribution <= 0) return;
        const ratio = price / contribution; // $ per unit of nutrient
        if (ratio < bestRatio) {
          bestRatio = ratio;
          bestFood = food;
        }
      });

      if (!bestFood) return;

      const portionGrams = bestFood.portionGrams || 100;
      const foodPrice = parseFloat(bestFood.storePrice) || 0;

      // How many servings to fully cover this nutrient's remaining need?
      const amtPer100g = bestFood.allNutrients?.[nutrient_key]?.amount || 0;
      const contributionPerServing = (amtPer100g / 100) * portionGrams;
      const servingsNeeded = contributionPerServing > 0
        ? Math.ceil(remaining[nutrient_key] / contributionPerServing)
        : 1;
      let qty = Math.min(Math.max(servingsNeeded, 1), 15);

      // If already selected (from a prior nutrient step), increase qty if needed
      const existingQty = selected[bestFood.fdcId] || 0;
      let finalQty = Math.max(existingQty, qty);

      // Budget cap: don't exceed the limit
      if (budgetLimit > 0 && foodPrice > 0) {
        // How much budget remains after existing selections?
        const existingCost = existingQty * foodPrice;
        const budgetRemaining = budgetLimit - (totalSpentSoFar - existingCost);
        const maxAffordableQty = Math.floor(budgetRemaining / foodPrice);
        if (maxAffordableQty <= 0) {
          // Can't afford any — skip this food if not already selected
          if (existingQty === 0) return;
          finalQty = existingQty; // keep what we already have
        } else {
          finalQty = Math.min(finalQty, Math.max(existingQty, maxAffordableQty));
        }
      }

      selected[bestFood.fdcId] = finalQty;
      // Update running cost (net delta vs existing)
      totalSpentSoFar += (finalQty - existingQty) * foodPrice;

      // Reduce remaining for ALL nutrients this food covers (cross-nutrient benefit)
      const actualQty = finalQty;
      Object.keys(remaining).forEach(key => {
        const a = (bestFood.allNutrients?.[key]?.amount || 0);
        const c = (a / 100) * portionGrams * actualQty;
        remaining[key] = Math.max(0, (remaining[key] || 0) - c);
      });
    });

    if (Object.keys(selected).length > 0) {
      setSelectedFoodIds(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(selected).map(([id]) => [id, true])),
      }));
      setFoodQuantities(prev => ({ ...prev, ...selected }));
    }
    setIsAutoGenerating(false); // lift the loading overlay
  };

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
      .filter(food => food.storePrice != null && food.storePrice !== 'N/A')
      .map(food => {
        const qty = foodQuantities[food.fdcId] || 1;
        return {
          product_id: (food.storeProduct?.itemId ?? food.fdcId)?.toString(),
          product_name: food.description,
          recipe_name: null,
          product_quantity: qty,
          is_stock: 'true',
          image: food.storeProduct?.thumbnailImage || null,
          salePrice: Number(food.storePrice) || 0,
          offer_id: food.storeProduct?.offerId || null,
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
        setCuratedSelections([]);
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
    if (type === 'plus' && numericDays < 7) setDays(numericDays + 1);
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
          {/* Days selector */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Text style={[styles.sectionLabel, { marginBottom: 0, flex: 1 }]}>Shopping Days</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity style={styles.daysBtnSmall} onPress={() => updateDays('minus')}>
                <Text style={styles.daysBtnSmallText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.daysValueSmall}>{days}</Text>
              <TouchableOpacity style={styles.daysBtnSmall} onPress={() => updateDays('plus')}>
                <Text style={styles.daysBtnSmallText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
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

        {/* Assistance Programs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Assistance Programs</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>SNAP</Text>
              <Text style={styles.toggleSub}>Supplemental Nutrition Assistance</Text>
            </View>
            <Switch
              value={snapEnabled}
              onValueChange={setSnapEnabled}
              trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
              thumbColor={snapEnabled ? '#28C76F' : '#9CA3AF'}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>WIC</Text>
              <Text style={styles.toggleSub}>Women, Infants & Children</Text>
            </View>
            <Switch
              value={wicEnabled}
              onValueChange={setWicEnabled}
              trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
              thumbColor={wicEnabled ? '#28C76F' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Food Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Food Preferences</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => { setShowFoodPrefDropdown(!showFoodPrefDropdown); setShowAllergyDropdown(false); }}
          >
            <Text style={styles.dropdownText}>{foodPreference || 'Select preference...'}</Text>
            <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name={showFoodPrefDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {showFoodPrefDropdown && (
            <>
              <TouchableOpacity style={styles.dropdownOverlay} onPress={() => setShowFoodPrefDropdown(false)} activeOpacity={1} />
              <View style={styles.dropdownList}>
                {FOOD_PREFERENCES.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownItem}
                    onPress={() => { setFoodPreference(opt === 'None' ? '' : opt); setShowFoodPrefDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemText, foodPreference === opt && styles.selectedText]}>{opt}</Text>
                    {foodPreference === opt && <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="check" size={16} color="#28C76F" />}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Allergies</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => { setShowAllergyDropdown(!showAllergyDropdown); setShowFoodPrefDropdown(false); }}
          >
            <Text style={styles.dropdownText}>
              {selectedAllergies.length ? selectedAllergies.join(', ') : 'Select allergies...'}
            </Text>
            <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name={showAllergyDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
          </TouchableOpacity>
          {showAllergyDropdown && (
            <>
              <TouchableOpacity style={styles.dropdownOverlay} onPress={() => setShowAllergyDropdown(false)} activeOpacity={1} />
              <View style={styles.dropdownList}>
                {ALLERGY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownItem}
                    onPress={() => toggleAllergy(opt)}
                  >
                    <Text style={[styles.dropdownItemText, selectedAllergies.includes(opt) && styles.selectedText]}>{opt}-free</Text>
                    {selectedAllergies.includes(opt) && <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="check" size={16} color="#28C76F" />}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
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
            {(() => {
              const _summary = familyNutrition?.summary || familyNutrition?.data?.summary || [];
              const _merged = mergeWithDefaults(_summary);
              const _targets = _merged.length > 0 ? _merged : DEFAULT_NUTRIENT_TARGETS;
              const _activeIdx = _targets.findIndex(t => t.nutrient_key === selectedNutrientKey);
              const _idx = _activeIdx >= 0 ? _activeIdx : 0;
              return (
                <View style={styles.nutritionModalHeader}>
                  <TouchableOpacity onPress={() => setShowNutritionModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <CustomIcon origin={ICON_TYPE.IONICONS} name="close" size={24} color="#1F2937" />
                  </TouchableOpacity>
                  <Text style={styles.nutritionModalTitle}>Smart Suggestions ⛽</Text>
                  <Text style={styles.nutrientCounter}>{_idx + 1} / {_targets.length}</Text>
                </View>
              );
            })()}

            {/* Cart total + Days row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(12), paddingVertical: moderateScaleVertical(8), gap: 12 }}>
              {/* Cart total */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={styles.modalBudgetLabel}>🛒 Cart</Text>
                <Text style={[styles.modalBudgetCart, { color: '#28C76F', fontWeight: '700', marginLeft: 6 }]}>
                  ${cartTotal.toFixed(2)}
                </Text>
              </View>
              {/* Days selector */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.modalBudgetLabel}>Days:</Text>
                <TouchableOpacity
                  style={styles.daysBtnSmall}
                  onPress={() => updateDays('minus')}
                >
                  <Text style={styles.daysBtnSmallText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.daysValueSmall}>{days}</Text>
                <TouchableOpacity
                  style={styles.daysBtnSmall}
                  onPress={() => updateDays('plus')}
                >
                  <Text style={styles.daysBtnSmallText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Single-nutrient view — no scroll */}
            {(() => {
              const summary = familyNutrition?.summary || familyNutrition?.data?.summary || [];
              const merged = mergeWithDefaults(summary);
              const targets = merged.length > 0 ? merged : DEFAULT_NUTRIENT_TARGETS;
              const activeIdx = Math.max(0, targets.findIndex(t => t.nutrient_key === selectedNutrientKey));
              const item = targets[activeIdx] || targets[0];
              const key = item?.nutrient_key;
              const nutrientData = allNutrientProducts[key];
              const isLoadingNutrient = !nutrientData || nutrientData.loading;

              // Top 20 — sorted cheapest first (priced items), unpriced at bottom
              const allFoods = nutrientData?.foods || [];
              const safeP = (v) => {
                if (v == null || v === 'N/A') return Infinity;
                const n = parseFloat(v);
                return isNaN(n) || n <= 0 ? Infinity : n;
              };
              // Apply preference + allergy filters by food description keywords
              const DIET_EXCLUDE = {
                Vegetarian: ['chicken','beef','pork','turkey','salmon','tuna','shrimp','bacon','ham','lamb','veal','venison','bison','duck','goose','anchovy','sardine','herring','crab','lobster','clam','oyster','mussel','scallop','tilapia','cod','halibut','trout','catfish'],
                Vegan: ['chicken','beef','pork','turkey','salmon','tuna','shrimp','bacon','ham','lamb','veal','venison','bison','duck','goose','anchovy','sardine','herring','crab','lobster','clam','oyster','mussel','scallop','tilapia','cod','halibut','trout','catfish','milk','cheese','yogurt','butter','cream','whey','egg','gelatin','honey'],
                Pescatarian: ['chicken','beef','pork','turkey','bacon','ham','lamb','veal','venison','bison','duck','goose'],
                Paleo: ['milk','cheese','yogurt','butter','cream','whey','bread','pasta','wheat','oat','rice','bean','lentil','peanut','corn','soy','tofu'],
              };
              const ALLERGY_EXCLUDE = {
                Gluten: ['wheat','bread','pasta','flour','barley','rye','oat','cracker','cereal','pretzel','bagel','muffin','biscuit'],
                Dairy: ['milk','cheese','yogurt','butter','cream','whey','casein','lactose','ghee'],
                Nuts: ['almond','cashew','walnut','pecan','hazelnut','pistachio','macadamia','brazil nut','pine nut','chestnut'],
                Shellfish: ['shrimp','crab','lobster','clam','oyster','mussel','scallop','prawn','crawfish'],
                Eggs: ['egg'],
                Soy: ['soy','tofu','edamame','tempeh','miso'],
              };
              // Always filter condiments from displayed recommendations
              const DISPLAY_CONDIMENT_KW = ['mustard','ketchup','soy sauce','hot sauce',
                'vinegar','pickle','mayonnaise','anchov','table salt','salt, iodized',
                'margarine','shortening','lard','egg white, dried','dried egg white',
                'flour, soy','baking powder','bouillon','protein isolate','whey protein'];
              const applyFoodFilters = (foods) => {
                const dietExclude = DIET_EXCLUDE[foodPreference] || [];
                const allergyExclude = selectedAllergies.flatMap(a => ALLERGY_EXCLUDE[a] || []);
                const allExclude = [...dietExclude, ...allergyExclude];
                return foods.filter(food => {
                  const desc = (food.description || '').toLowerCase();
                  // Always exclude condiments regardless of preference settings
                  if (DISPLAY_CONDIMENT_KW.some(kw => desc.includes(kw))) return false;
                  // Exclude tiny-portion items (condiment-sized)
                  if ((food.portionGrams || 100) < 25) return false;
                  if (!allExclude.length) return true;
                  return !allExclude.some(kw => desc.includes(kw));
                });
              };
              // Merge curated selections that are relevant for this nutrient into the display list
              const selectedCuratedForNutrient = curatedSelections.filter(f =>
                selectedFoodIds[f.fdcId] && (f.allNutrients?.[key]?.amount || 0) > 0
              );
              const existingIds = new Set(allFoods.map(f => f.fdcId));
              const extraCurated = selectedCuratedForNutrient.filter(f => !existingIds.has(f.fdcId));
              const displayFoods = applyFoodFilters([...allFoods, ...extraCurated])
                .sort((a, b) => safeP(a.storePrice) - safeP(b.storePrice))
                .slice(0, 25); // slightly larger to fit curated extras

              // Current value for this nutrient from selected foods
              const currentNutrient = (() => {
                const seen = new Set();
                let total = 0;
                const allPools = [
                  ...Object.values(allNutrientProducts).flatMap(s => s.foods || []),
                  ...manualSearchResults,
                  ...curatedSelections,
                ];
                allPools.forEach(f => {
                  if (selectedFoodIds[f.fdcId] && !seen.has(f.fdcId)) {
                    seen.add(f.fdcId);
                    const qty = foodQuantities[f.fdcId] || 1;
                    const portionGrams = f.portionGrams || 100;
                    const amountPer100g = f.allNutrients?.[key]?.amount || 0;
                    total += (amountPer100g / 100) * portionGrams * qty;
                  }
                });
                return total;
              })();

              const goNext = () => {
                const nextIdx = (activeIdx + 1) % targets.length;
                setSelectedNutrientKey(targets[nextIdx].nutrient_key);
              };
              const goPrev = () => {
                const prevIdx = (activeIdx - 1 + targets.length) % targets.length;
                setSelectedNutrientKey(targets[prevIdx].nutrient_key);
              };

              return (
                <View style={styles.singleNutrientView}>
                  {/* Gauge */}
                  <View style={styles.singleNutrientGaugeBox}>
                    <NutrientGaugeBar
                      nutrientKey={key}
                      target={(item?.total_target_value || 0) * (days || 1)}
                      dailyTarget={item?.total_target_value || 0}
                      days={days || 1}
                      unit={item?.unit}
                      current={currentNutrient}
                    />
                  </View>

                  {/* Nav arrows */}
                  <View style={styles.nutrientNavRow}>
                    <TouchableOpacity style={styles.nutrientNavBtn} onPress={goPrev}>
                      <CustomIcon origin={ICON_TYPE.IONICONS} name="chevron-back" size={20} color="#374151" />
                      <Text style={styles.nutrientNavText}>Prev</Text>
                    </TouchableOpacity>
                    <Text style={styles.nutrientNavName}>{key?.replace(/_/g, ' ')}</Text>
                    <TouchableOpacity style={styles.nutrientNavBtn} onPress={goNext}>
                      <Text style={styles.nutrientNavText}>Next</Text>
                      <CustomIcon origin={ICON_TYPE.IONICONS} name="chevron-forward" size={20} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  {/* 5 recommendation cards */}
                  {isLoadingNutrient ? (
                    <View style={styles.nutrientLoadingBox}>
                      <ActivityIndicator size="large" color="#28C76F" />
                      <Text style={styles.nutrientLoadingText}>Loading recommendations...</Text>
                    </View>
                  ) : displayFoods.length === 0 ? (
                    <View style={styles.nutrientLoadingBox}>
                      <Text style={styles.noDataText}>No products found for this nutrient.</Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.recListScroll}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      {displayFoods.map((food, idx) => {
                        const isSelected = !!selectedFoodIds[food.fdcId];
                        const qty = getFoodQty(food.fdcId);
                        const portionGrams = food.portionGrams || 100;
                        const rawAmt = food.nutrients?.[0]?.amount || 0;
                        const nutrientAmt = rawAmt > 0 ? Math.round((rawAmt / 100) * portionGrams * 10) / 10 : null;
                        const nutrientUnit = food.nutrients?.[0]?.unit || '';
                        const unitPrice = food.storePrice != null && food.storePrice !== 'N/A'
                          ? Number(food.storePrice) : null;
                        const totalPrice = unitPrice != null ? (unitPrice * qty).toFixed(2) : null;

                        const TRACKED = ['PROTEIN','CARBS','FAT','FIBER','CALCIUM','IRON','MAGNEISUM','ZINC','POTASIUM','VIT A','VIT C','VIT D','VIT E','VIT K','VIT B6','FOLATE','VIT B12','SODIUM'];
                        const covers = TRACKED.filter(k => {
                          if (k === key) return false;
                          const amt = (food.allNutrients?.[k]?.amount || 0) / 100 * portionGrams;
                          const tgt = DEFAULT_NUTRIENT_TARGETS.find(t => t.nutrient_key === k)?.total_target_value || 0;
                          return tgt > 0 && (amt / tgt) >= 0.05;
                        });

                        return (
                          <TouchableOpacity
                            key={food.fdcId}
                            style={[styles.recRow, isSelected && styles.recRowSelected]}
                            onPress={() => toggleFoodSelection(food.fdcId)}
                            activeOpacity={0.8}
                          >
                            {/* Rank badge */}
                            <Text style={styles.recRank}>{idx + 1}</Text>

                            {/* Checkbox */}
                            <CustomIcon origin={ICON_TYPE.IONICONS}
                              name={isSelected ? 'checkbox' : 'square-outline'}
                              size={18} color={isSelected ? '#28C76F' : '#D1D5DB'}
                              style={{ marginRight: 8 }} />

                            {/* Name + sub info */}
                            <View style={styles.recRowMid}>
                              <Text style={styles.recRowName} numberOfLines={1}>{food.description}</Text>
                              <Text style={styles.recRowSub} numberOfLines={1}>
                                {nutrientAmt ? `${nutrientAmt}${nutrientUnit} ${key?.replace(/_/g, ' ')}` : ''}
                                {covers.length > 0 ? `  +${covers.slice(0,2).join(', ')}` : ''}
                              </Text>
                            </View>

                            {/* Price + qty */}
                            <View style={styles.recRowRight}>
                              {food.storePriceLoading ? (
                                <ActivityIndicator size="small" color="#28C76F" />
                              ) : totalPrice != null ? (
                                <Text style={styles.recRowPrice}>${totalPrice}</Text>
                              ) : (
                                <Text style={styles.recRowNoPrice}>—</Text>
                              )}
                              {isSelected && (
                                <View style={styles.recRowQty}>
                                  <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); updateFoodQty(food.fdcId, -1); }} style={styles.recRowQtyBtn}>
                                    <Text style={styles.recRowQtyBtnText}>−</Text>
                                  </TouchableOpacity>
                                  <Text style={styles.recRowQtyVal}>{qty}</Text>
                                  <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); updateFoodQty(food.fdcId, 1); }} style={styles.recRowQtyBtn}>
                                    <Text style={styles.recRowQtyBtnText}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <View style={{ height: 12 }} />
                    </ScrollView>
                  )}
                </View>
              );
            })()}

            {/* Manual search toggle + filter button row */}
            <View style={styles.manualSearchToggleRow}>
              {/* Filter by food preferences */}
              <TouchableOpacity
                style={[styles.manualSearchToggleBtn, showFilterPanel && styles.manualSearchToggleBtnActive, { flex: 1 }]}
                onPress={() => { setShowFilterPanel(v => !v); setShowManualSearch(false); }}
              >
                <Text style={[styles.manualSearchToggleText, showFilterPanel && styles.manualSearchToggleTextActive]}>
                  {showFilterPanel ? 'Close Filters' : 'Preferences'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualSearchToggleBtn, showManualSearch && styles.manualSearchToggleBtnActive, { flex: 1 }]}
                onPress={() => { setShowManualSearch(v => !v); setShowFilterPanel(false); setManualSearchResults([]); setManualSearchError(''); setManualSearchQuery(''); }}
              >
                <Text style={[styles.manualSearchToggleText, showManualSearch && styles.manualSearchToggleTextActive]}>
                  {showManualSearch ? 'Close Search' : 'Search Food'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter panel */}
            {showFilterPanel && (
              <View style={styles.filterPanel}>
                <Text style={styles.filterPanelTitle}>Diet</Text>
                <View style={styles.filterChipRow}>
                  {FOOD_PREFERENCES.filter(p => p !== 'None').map(pref => (
                    <TouchableOpacity
                      key={pref}
                      style={[styles.filterChip, foodPreference === pref && styles.filterChipActive]}
                      onPress={() => setFoodPreference(foodPreference === pref ? '' : pref)}
                    >
                      <Text style={[styles.filterChipText, foodPreference === pref && styles.filterChipTextActive]}>{pref}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.filterPanelTitle, { marginTop: 10 }]}>Avoid</Text>
                <View style={styles.filterChipRow}>
                  {ALLERGY_OPTIONS.map(allergy => (
                    <TouchableOpacity
                      key={allergy}
                      style={[styles.filterChip, selectedAllergies.includes(allergy) && styles.filterChipActive]}
                      onPress={() => toggleAllergy(allergy)}
                    >
                      <Text style={[styles.filterChipText, selectedAllergies.includes(allergy) && styles.filterChipTextActive]}>{allergy}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

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


            {/* Footer — Add items button */}
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[
                  styles.addItemsBtn,
                  (!Object.values(selectedFoodIds).some(Boolean) || addingItems) && styles.disabledBtn,
                ]}
                onPress={handleAddSelectedFoods}
                disabled={!Object.values(selectedFoodIds).some(Boolean) || addingItems}
              >
                {addingItems ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createBtnText}>
                    {Object.values(selectedFoodIds).filter(Boolean).length > 0
                      ? `Add ${Object.values(selectedFoodIds).filter(Boolean).length} Item${Object.values(selectedFoodIds).filter(Boolean).length !== 1 ? 's' : ''} to List`
                      : 'Select items above'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>

        {/* Loading overlay — shown while Walmart prices are being fetched */}
        {isAutoGenerating && (
          <Pressable style={styles.autoGenOverlay} onPress={() => {}}>
            <View style={styles.autoGenOverlayCard}>
              <ActivityIndicator size="large" color="#28C76F" style={{ marginBottom: 16 }} />
              <Text style={styles.autoGenOverlayTitle}>Finding Best Recommendations</Text>
              <Text style={styles.autoGenOverlaySubtitle}>
                Scanning Walmart prices to find the cheapest options for each nutrient...
              </Text>
            </View>
          </Pressable>
        )}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScaleVertical(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleInfo: { flex: 1, marginRight: moderateScale(12) },
  toggleLabel: { fontSize: textScale(15), fontWeight: '600', color: '#1F2937' },
  toggleSub: { fontSize: textScale(12), color: '#9CA3AF', marginTop: 2 },
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
    width: '82%',
    maxWidth: 420,
    height: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  alsoCoversRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 },
  alsoCoversLabel: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' },
  alsoCoversValue: { fontSize: 10, color: '#28C76F', fontWeight: '600' },
  modalFooterRow: {
    padding: moderateScale(14),
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  addItemsBtn: {
    backgroundColor: '#28C76F', borderRadius: 12,
    paddingVertical: moderateScaleVertical(14),
    alignItems: 'center', justifyContent: 'center',
  },
  singleNutrientView: {
    flex: 1, paddingHorizontal: moderateScale(10), paddingTop: moderateScaleVertical(6),
    overflow: 'hidden',
  },
  singleNutrientGaugeBox: {
    backgroundColor: '#F9FAFB', borderRadius: 10,
    padding: moderateScale(10), marginBottom: moderateScaleVertical(6),
  },
  nutrientNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: moderateScaleVertical(6),
  },
  nutrientNavBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#F3F4F6', borderRadius: 8,
  },
  nutrientNavText: { fontSize: textScale(13), color: '#374151', fontWeight: '600' },
  nutrientNavName: {
    fontSize: textScale(15), fontWeight: '800', color: '#111827',
    textTransform: 'uppercase', letterSpacing: 0.5, flex: 1, textAlign: 'center',
  },
  nutrientCounter: {
    fontSize: textScale(13), color: '#6B7280', fontWeight: '600', minWidth: 40, textAlign: 'right',
  },
  nutrientLoadingBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32,
  },
  nutrientLoadingText: { marginTop: 10, color: '#6B7280', fontSize: textScale(13) },
  recListScroll: {
    flex: 1,
  },
  recRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: moderateScaleVertical(7), paddingHorizontal: moderateScale(6),
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  recRowSelected: {
    backgroundColor: '#F0FDF4',
  },
  recRank: {
    fontSize: textScale(10), color: '#9CA3AF', fontWeight: '700',
    width: 18, textAlign: 'center', marginRight: 4,
  },
  recRowMid: { flex: 1, marginRight: 6 },
  recRowName: { fontSize: textScale(12), fontWeight: '600', color: '#111827', lineHeight: 16 },
  recRowSub: { fontSize: textScale(10), color: '#6B7280', marginTop: 1 },
  recRowRight: { alignItems: 'flex-end', minWidth: 52 },
  recRowPrice: { fontSize: textScale(13), fontWeight: '800', color: '#111827' },
  recRowNoPrice: { fontSize: textScale(12), color: '#9CA3AF' },
  recRowQty: {
    flexDirection: 'row', alignItems: 'center', marginTop: 4,
    borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB',
  },
  recRowQtyBtn: {
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: '#F3F4F6',
  },
  recRowQtyBtnText: { fontSize: textScale(13), fontWeight: '700', color: '#374151' },
  recRowQtyVal: {
    paddingHorizontal: 6,
    fontSize: textScale(12), fontWeight: '700', color: '#111827',
  },
  modalBudgetCart: {
    fontSize: textScale(12), fontWeight: '700', color: '#28C76F',
  },
  daysBtnSmall: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  daysBtnSmallText: {
    fontSize: textScale(16), fontWeight: '700', color: '#374151', lineHeight: 20,
  },
  daysValueSmall: {
    fontSize: textScale(15), fontWeight: '700', color: '#111827',
    minWidth: 22, textAlign: 'center',
  },
  autoGenOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 9999,
    borderRadius: moderateScale(20),
  },
  autoGenOverlayCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(28),
    marginHorizontal: moderateScale(32),
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    elevation: 10,
  },
  autoGenOverlayTitle: {
    fontSize: textScale(17), fontWeight: '700', color: '#111827',
    textAlign: 'center', marginBottom: 8,
  },
  autoGenOverlaySubtitle: {
    fontSize: textScale(13), color: '#6B7280', textAlign: 'center', lineHeight: 20,
  },
  modalBudgetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: moderateScale(16), paddingVertical: moderateScaleVertical(10),
    backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalBudgetLabel: { fontSize: textScale(14), fontWeight: '700', color: '#111827', marginRight: 10 },
  modalBudgetInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 8, paddingHorizontal: 10, height: 36,
  },
  modalBudgetCurrency: { fontSize: textScale(15), color: '#374151', marginRight: 2 },
  modalBudgetInput: {
    fontSize: textScale(15), color: '#111827', minWidth: 70, maxWidth: 100,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  modalBudgetHint: { fontSize: textScale(12), color: '#9CA3AF', marginLeft: 10, flex: 1 },
  autoGenBanner: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#28C76F',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 6,
  },
  autoGenBannerText: {
    fontSize: textScale(12),
    color: '#166534',
    lineHeight: 18,
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
    flexDirection: 'row',
    gap: 8,
  },
  filterPanel: {
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScaleVertical(8),
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPanelTitle: {
    fontSize: textScale(11),
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingVertical: moderateScaleVertical(5),
    paddingHorizontal: moderateScale(10),
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    borderColor: '#28C76F',
    backgroundColor: '#ECFDF5',
  },
  filterChipText: {
    fontSize: textScale(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#16A34A',
    fontWeight: '700',
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
    textAlign: 'center',
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