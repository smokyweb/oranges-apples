import React, { useState, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    ActivityIndicator,
    Linking,
    Platform,
} from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import CustomIcon, { ICON_TYPE } from './CustomIcon';
import {
    moderateScale,
    moderateScaleVertical,
    textScale,
} from '../helper/responsiveSize';
import Spacer from './Spacer';
import { SafeAreaView } from 'react-native-safe-area-context';
import NutritionalGauge from './NutritionalGauge';
import axiosRequest from '../helper/axiosRequest';
import { getFamilyNutrition } from '../../store/home/home.action';
import { API } from '../helper/config';
const { width } = Dimensions.get('window');

const CheckoutModal = ({ visible, onClose, onPlaceOrder, orderData = {}, foodItems = [], additionalItems = [], shoppingListId, selectedStore = 'walmart' }) => {
  const isKroger = selectedStore === 'kroger';
    const dispatch = useDispatch();
    const { familyNutrition, familyNutritionLoading } = useSelector(state => state.homeReducer);
    console.log('CheckoutModal familyNutrition:', familyNutrition);
    console.log('CheckoutModal familyNutritionLoading:', familyNutritionLoading);
    const [pickupDay, setPickupDay] = useState('Today');
    const [showFoodList, setShowFoodList] = useState(false);
    const [showAdditionalList, setShowAdditionalList] = useState(false);
    const [nutritionData, setNutritionData] = useState({});
    const [loadingNutrition, setLoadingNutrition] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [itemQuantities, setItemQuantities] = useState({});
    const [usdaKey, setUsdaKey] = useState(null);

    useEffect(() => {
        fetchUsdaKey();
        dispatch(getFamilyNutrition());
    }, []);

    useEffect(() => {
        if (visible) {
            dispatch(getFamilyNutrition());
            // Initialize quantities if not set
            const initial = {};
            foodItems.forEach(item => {
                const id = item.id || item.itemId;
                initial[id] = parseInt(item.product_quantity || 1, 10);
            });
            setItemQuantities(initial);
        }
    }, [visible, dispatch, foodItems]);

    const fetchUsdaKey = async () => {
        try {
            const resp = await axiosRequest.get('get-usda-api-key');
            console.log({ resp });
            if (resp.success && resp.data?.usda_api_key) {
                setUsdaKey(resp.data.usda_api_key);
            }
        } catch (error) {
            console.error('Error fetching USDA key:', error);
        }
    };

    useEffect(() => {
        console.log({ usdaKey });
        console.log({ foodItems });
        if (visible && foodItems.length > 0 && usdaKey) {
            fetchAllNutrition();
        }
    }, [visible, foodItems, usdaKey]);

    const fetchingItems = React.useRef(new Set());

    const fetchAllNutrition = async () => {
        if (!usdaKey) return;
        // Check if there are any new items that need nutrition data
        const newItems = foodItems.filter(item => {
            const id = item.id || item.itemId;
            return !nutritionData[id] && !fetchingItems.current.has(id);
        });

        if (newItems.length === 0) return;

        setLoadingNutrition(true);

        try {
            for (const item of newItems) {
                const itemId = item.id || item.itemId;
                const foodName = item.product_name || item.name;
                if (!foodName) continue;

                fetchingItems.current.add(itemId);

                // Step 1: Search food to get fdcId

                // let endPointUrl = `https://api.nal.usda.gov/fdc/v1/foods/search`;
                let endPointUrl = API.BASE_URL + `usda/foods/search`
                console.log({ endPointUrl });
                const searchResp = await axios.get(endPointUrl, {
                    params: {
                        query: foodName,
                        dataType: 'Branded',
                        pageSize: 1,
                        pageNumber: 1,
                        sortBy: 'publishedDate',
                        sortOrder: 'asc',
                        api_key: usdaKey
                    }
                });
                console.log({ searchResp });
                if (searchResp.data?.foods?.length > 0) {
                    const nutrients = searchResp.data.foods[0].foodNutrients.filter(n => n.amount !== undefined && n.amount !== null);
                    console.log('nutrients from search ====', { nutrients });
                    setNutritionData(prev => ({
                        ...prev,
                        [itemId]: nutrients
                    }));
                }
                fetchingItems.current.delete(itemId);
            }
        } catch (error) {
            console.error('Error fetching USDA data:', error);
        } finally {
            setLoadingNutrition(false);
        }
    };

    const handleQuantityChange = (itemId, delta) => {
        setItemQuantities(prev => {
            const currentQty = parseInt(prev[itemId] || 1, 10);
            return {
                ...prev,
                [itemId]: Math.max(1, currentQty + delta)
            };
        });
    };

    const foodSubtotal = foodItems.reduce((sum, item) => {
        const id = item.id || item.itemId;
        const qty = itemQuantities[id] || 1;
        return sum + (parseFloat(item.salePrice) || 0) * qty;
    }, 0);
    const additionalSubtotal = additionalItems.reduce((sum, item) => sum + (parseFloat(item.salePrice) || 0), 0);
    const subtotal = foodSubtotal + additionalSubtotal;
    const taxes = subtotal * 0.08; // 8% tax
    const deliveryFee = 3.95;
    const total = subtotal + taxes + deliveryFee;

    const combinedNutrients = React.useMemo(() => {
        if (!foodItems.length || Object.keys(nutritionData).length === 0) return {};

        // 1. Direct Mappings of USDA names to target keys
        const NUTRIENT_MAPPING = {
            "total lipid (fat)": "FAT",
            "vitamin c, total ascorbic acid": "VIT C",
            "cholesterol": "CHOLESTEROL",
            "iron, fe": "IRON",
            "calcium, ca": "CALCIUM",
            "vitamin a, iu": "VIT A",
            "sodium, na": "SODIUM",
            "fatty acids, total saturated": "SATURATED_FAT",
            "energy": "ENERGY/CALORIES",
            "carbohydrate, by difference": "CARBS",
            "protein": "PROTEIN",
            "potassium, k": "POTASIUM",
            "total sugars": "SUGAR",
            "fiber, total dietary": "FIBER"
        };

        const targetUnits = {
            "FAT": "g", "VIT C": "mg", "CHOLESTEROL": "mg", "IRON": "mg",
            "CALCIUM": "mg", "VIT A": "ug", "SODIUM": "g", "SATURATED_FAT": "g",
            "ENERGY/CALORIES": "kcal", "CARBS": "g", "PROTEIN": "g",
            "POTASIUM": "g", "SUGAR": "g", "FIBER": "g"
        };

        // Initialize with all possible target keys from the requirement (mapped + unmapped)
        const allTargetKeys = [
            "FAT", "VIT C", "CHOLESTEROL", "IRON", "CALCIUM", "VIT A", "SODIUM",
            "SATURATED_FAT", "ENERGY/CALORIES", "CARBS", "PROTEIN", "POTASIUM",
            "SUGAR", "FIBER", "BIOTIN", "CHLORIDE", "CHOLINE", "CHROMIUM",
            "COPER", "FLOURIDE", "FOLATE", "IODINE", "MAGNEISUM", "MOLY",
            "NIACIN", "PANTHO", "PHOSPHOROUS", "RIBO", "SELENIUM", "THIAMIN",
            "VIT B12", "VIT B6", "VIT D", "VIT E", "VIT K", "ZINC"
        ];

        const mappedData = {};
        allTargetKeys.forEach(key => {
            mappedData[key] = { value: 0.0, unit: targetUnits[key] || "mg" };
        });

        // 2. Aggregate data from food items
        foodItems.forEach(item => {
            const id = item.id || item.itemId;
            const qty = itemQuantities[id] || 1;
            const nutrients = nutritionData[id] || [];

            nutrients.forEach(n => {
                const usdaName = n.nutrient?.name?.toLowerCase();
                const usdaUnit = n.nutrient?.unitName?.toLowerCase();
                const usdaAmount = parseFloat(n.amount) || 0;

                // Find matching target key
                const targetKey = Object.keys(NUTRIENT_MAPPING).find(key => usdaName.includes(key))
                    ? NUTRIENT_MAPPING[Object.keys(NUTRIENT_MAPPING).find(key => usdaName.includes(key))]
                    : null;

                if (targetKey) {
                    let finalAmount = usdaAmount * qty;

                    // 3. APPLY CONVERSION RULES
                    if (targetKey === 'SODIUM' || targetKey === 'POTASIUM') {
                        // mg to g: divide by 1000
                        if (usdaUnit === 'mg') finalAmount /= 1000;
                    } else if (targetKey === 'VIT A') {
                        // IU to ug: 1 IU = ~0.3 ug
                        if (usdaUnit === 'iu') finalAmount *= 0.3;
                    }

                    mappedData[targetKey].value += finalAmount;
                }
            });
        });

        // Round to 1 decimal place
        Object.keys(mappedData).forEach(key => {
            mappedData[key].value = Math.round(mappedData[key].value * 10) / 10;
        });

        return mappedData;
    }, [foodItems, nutritionData, itemQuantities]);

    const handlePlaceOrder = async () => {
        // ── Step 1: Build the store URL synchronously (before any await) ──────────
        let cartUrl;
        if (isKroger) {
            cartUrl = `https://www.kroger.com/cart`;
        } else {
            const isWalmartId = (id) => id && /^\d{8,12}$/.test(String(id));
            const foodStrings = foodItems.map(item => {
                const id = item.itemId || item.id || item.product_id;
                const qty = itemQuantities[id] || 1;
                return isWalmartId(id) ? `${id}_${qty}` : null;
            }).filter(Boolean);
            const additionalStrings = additionalItems.map(item => {
                const id = item.itemId || item.id || item.product_id;
                return isWalmartId(id) ? `${id}_1` : null;
            }).filter(Boolean);
            const allItems = [...foodStrings, ...additionalStrings].join(',');
            cartUrl = allItems
                ? `https://www.walmart.com/sc/cart/addToCart?items=${allItems}`
                : `https://www.walmart.com/search?q=${encodeURIComponent(
                    foodItems[0]?.product_name || foodItems[0]?.description || 'groceries'
                  )}`;
        }

        // ── Step 2: Open store NOW (must be synchronous / within user gesture) ────
        // On web, window.open after an await is blocked by popup blockers — so open first.
        if (Platform.OS === 'web') {
            const a = document.createElement('a');
            a.href = cartUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            Linking.openURL(cartUrl).catch(err => console.error("Store open failed:", err));
        }

        // ── Step 3: Fire-and-forget nutrition update in background ────────────────
        setLoadingOrder(true);
        try {
            const nutritionPayload = {};
            Object.entries(combinedNutrients).forEach(([key, data]) => {
                nutritionPayload[key] = data.value;
            });
            await axiosRequest({
                method: 'POST',
                url: 'update-shopping-list-nutrition',
                data: { shopping_list_id: shoppingListId, nutrition_data: nutritionPayload }
            });
        } catch (error) {
            // Non-fatal — Walmart is already open
            console.warn('Nutrition update failed (non-fatal):', error?.message);
        } finally {
            setLoadingOrder(false);
        }

        // ── Step 4: Close the checkout modal ─────────────────────────────────────
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    style={styles.scrollContent}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Order</Text>

                        <TouchableOpacity
                            style={styles.orderItemRow}
                            onPress={() => setShowFoodList(!showFoodList)}
                        >
                            <View style={styles.orderItemInfo}>
                                <View style={styles.avatarGroup}>
                                    {foodItems.slice(0, 2).map((item, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: item.image || item.largeImage || item.mediumImage || item.thumbnailImage }}
                                            style={[styles.avatar, index > 0 && { marginLeft: -10, borderWidth: 2, borderColor: '#FFF' }]}
                                            resizeMode="cover"
                                        />
                                    ))}
                                    {foodItems.length === 0 && (
                                        <View style={[styles.avatar, { backgroundColor: '#F3F4F6' }]}>
                                            <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="shopping-bag" size={14} color="#9CA3AF" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.orderItemLabel}>Food Items ({foodItems.length} items)</Text>
                            </View>
                            <View style={styles.orderItemRight}>
                                <Text style={styles.orderItemPrice}>${foodSubtotal.toFixed(2)}</Text>
                                <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name={showFoodList ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>

                        {showFoodList && (
                            <View style={styles.expandedList}>
                                {foodItems.map((item, index) => {
                                    const id = item.id || item.itemId;
                                    const qty = itemQuantities[id] || 1;
                                    return (
                                        <View key={index} style={styles.expandedItem}>
                                            <Image
                                                source={{ uri: item.image || item.largeImage || item.mediumImage || item.thumbnailImage }}
                                                style={styles.expandedItemImage}
                                                resizeMode="contain"
                                            />
                                            <View style={{ flex: 1, marginRight: 10 }}>
                                                <Text style={styles.expandedItemName} numberOfLines={2}>{item.product_name || item.name}</Text>
                                                <Text style={styles.expandedItemPrice}>${(parseFloat(item.salePrice) || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.quantitySelector}>
                                                <TouchableOpacity
                                                    onPress={() => handleQuantityChange(id, -1)}
                                                    style={styles.qtyBtn}
                                                >
                                                    <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="minus" size={14} color="#6B7280" />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{qty}</Text>
                                                <TouchableOpacity
                                                    onPress={() => handleQuantityChange(id, 1)}
                                                    style={styles.qtyBtn}
                                                >
                                                    <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="plus" size={14} color="#6B7280" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.orderItemRow}
                            onPress={() => setShowAdditionalList(!showAdditionalList)}
                        >
                            <View style={styles.orderItemInfo}>
                                <View style={styles.avatarGroup}>
                                    {additionalItems.slice(0, 2).map((item, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: item.largeImage || item.mediumImage || item.thumbnailImage }}
                                            style={[styles.avatar, index > 0 && { marginLeft: -10, borderWidth: 2, borderColor: '#FFF' }]}
                                            resizeMode="cover"
                                        />
                                    ))}
                                    {additionalItems.length === 0 && (
                                        <View style={[styles.avatar, { backgroundColor: '#F3F4F6' }]}>
                                            <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="box" size={14} color="#0071CE" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.orderItemLabel}>Additional Items ({additionalItems.length} items)</Text>
                            </View>
                            <View style={styles.orderItemRight}>
                                <Text style={styles.orderItemPrice}>${additionalSubtotal.toFixed(2)}</Text>
                                <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name={showAdditionalList ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>

                        {showAdditionalList && (
                            <View style={styles.expandedList}>
                                {additionalItems.map((item, index) => (
                                    <View key={index} style={styles.expandedItem}>
                                        <Image
                                            source={{ uri: item.largeImage || item.mediumImage || item.thumbnailImage }}
                                            style={styles.expandedItemImage}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.expandedItemName} numberOfLines={2}>{item.name}</Text>
                                        <Text style={styles.expandedItemPrice}>${(item.salePrice || 0).toFixed(2)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Subtotal</Text>
                            <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Estimated taxes</Text>
                            <Text style={styles.costValue}>${taxes.toFixed(2)}</Text>
                        </View>
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Delivery fee</Text>
                            <Text style={styles.costValue}>${deliveryFee.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.costRow, { marginTop: 15 }]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>


                    </View>


                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Combined Total Nutrition</Text>
                        {loadingNutrition ? (
                            <ActivityIndicator size="small" color="#28C76F" />
                        ) : (
                            <View style={styles.nutritionTable}>
                                <View style={[styles.tableHeader, styles.tableRow]}>
                                    <Text style={[styles.tableCell, styles.headerText, { flex: 2 }]}>Nutrient</Text>
                                    <Text style={[styles.tableCell, styles.headerText, { textAlign: 'right' }]}>Total Amount</Text>
                                </View>
                                {Object.entries(combinedNutrients)
                                    .filter(([_, data]) => data.value > 0)
                                    .map(([key, data], idx) => (
                                        <View key={idx} style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { flex: 2 }]}>{key.replace(/_/g, ' ')}</Text>
                                            <Text style={[styles.tableCell, { textAlign: 'right', fontWeight: 'bold' }]}>
                                                {data.value.toFixed(1)} {data.unit}
                                            </Text>
                                        </View>
                                    ))}
                                {Object.keys(combinedNutrients).length === 0 && (
                                    <Text style={styles.noDataText}>No nutritional data available to combine.</Text>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Family Nutrition Targets</Text>
                        {familyNutritionLoading === 'loading' && (!familyNutrition || (!familyNutrition.summary && !familyNutrition?.data?.summary)) ? (
                            <ActivityIndicator size="small" color="#28C76F" style={{ marginVertical: 20 }} />
                        ) : (() => {
                            const summary = familyNutrition?.summary || familyNutrition?.data?.summary;
                            if (summary && summary.length > 0) {
                                return (
                                    <>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.nutritionHorizontalScroll}
                                        >
                                            {summary.reduce((acc, curr, i) => {
                                                if (i % 2 === 0) acc.push([curr]);
                                                else acc[acc.length - 1].push(curr);
                                                return acc;
                                            }, []).map((chunk, colIndex) => (
                                                <View key={colIndex} style={styles.nutritionColumn}>
                                                    {chunk.map((item, index) => (
                                                        <View key={index} style={styles.nutritionItem}>
                                                            <View style={[styles.nutritionIconContainer, { backgroundColor: getNutrientColor(item.nutrient_key) }]}>
                                                                <CustomIcon
                                                                    origin={ICON_TYPE.FONT_AWESOME5}
                                                                    name={getNutrientIcon(item.nutrient_key)}
                                                                    size={14}
                                                                    color={'#FFF'}
                                                                />
                                                            </View>
                                                            <View style={styles.nutritionTextContainer}>
                                                                <Text style={styles.nutritionValue}>{item.total_target_value}</Text>
                                                                <Text style={styles.nutritionUnit}>{item.unit}</Text>
                                                            </View>
                                                            <Text style={styles.nutritionKey} numberOfLines={1}>{formatNutrientKey(item.nutrient_key)}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                        </ScrollView>

                                        <Spacer height={20} />
                                        <Text style={styles.subSectionTitle}>Nutritional Progress Chart</Text>
                                        <View style={styles.chartContainer}>
                                            {summary.map((target, idx) => {
                                                const targetKey = target.nutrient_key.toUpperCase();
                                                const targetValue = parseFloat(target.total_target_value) || 1;

                                                // Get matched combined nutrient from our new mapped object
                                                const mappedNutrient = combinedNutrients[targetKey];
                                                const currentAmount = mappedNutrient ? mappedNutrient.value : 0;
                                                const percentage = Math.min(100, (currentAmount / targetValue) * 100);

                                                return (
                                                    <View key={idx} style={styles.chartRow}>
                                                        <View style={styles.chartLabelContainer}>
                                                            <Text style={styles.chartLabel}>{formatNutrientKey(target.nutrient_key)}</Text>
                                                            <Text style={styles.chartValueText}>
                                                                {currentAmount.toFixed(1)} / {targetValue} {target.unit}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.chartBarBackground}>
                                                            <View
                                                                style={[
                                                                    styles.chartBarFill,
                                                                    {
                                                                        width: `${percentage}%`,
                                                                        backgroundColor: getNutrientColor(target.nutrient_key)
                                                                    }
                                                                ]}
                                                            />
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </>
                                );
                            }
                            return <Text style={[styles.noDataText, { marginVertical: 10 }]}>No family nutrition targets found.</Text>;
                        })()}
                    </View>

                    {/* Hiding Individual Nutritional Details as per request */}
                    {/* <View style={styles.section}>
                         <Text style={styles.sectionTitle}>Individual Nutritional Details</Text>
                         {loadingNutrition ? (
                             <ActivityIndicator size="small" color="#28C76F" />
                         ) : (
                             foodItems.map((item, index) => {
                                 const id = item.id || item.itemId;
                                 const nutrients = nutritionData[id] || [];
                                 return (
                                     <View key={index} style={styles.nutritionDetailItem}>
                                         <Text style={styles.nutritionItemName}>{item.product_name || item.name}</Text>
                                         <View style={styles.nutrientRow}>
                                             {nutrients.map((n, idx) => (
                                                 <View key={idx} style={styles.nutrientTab}>
                                                     <Text style={styles.nutrientTabText}>
                                                         {n.nutrient?.name}: {n.amount} {n.nutrient?.unitName}
                                                     </Text>
                                                 </View>
                                             ))}
                                             {nutrients.length === 0 && (
                                                 <Text style={styles.noDataText}>No nutritional data available for this item.</Text>
                                             )}
                                         </View>
                                     </View>
                                 );
                             })
                         )}
                     </View> */}

                    <View style={styles.section}>
                        <View style={styles.walmartInfoRow}>
                            <View style={[styles.walmartBrand, isKroger && { backgroundColor: '#004B8D' }]}>
                                <Text style={styles.walmartBrandText}>{isKroger ? 'K' : 'W'}</Text>
                            </View>
                            <Text style={styles.fulfillmentTitle}>{isKroger ? 'Kroger' : 'Walmart'} Fulfillment</Text>
                        </View>

                        <View style={styles.storeRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.storeName}>{isKroger ? 'Kroger Superstore' : 'Walmart Supercenter'}</Text>
                                <Text style={styles.storeAddress}>{isKroger ? 'Find your nearest Kroger store' : '2500 W Happy Valley Rd, Phoenix, AZ'}</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={[styles.changeLink, isKroger && { color: '#004B8D' }]}>Change Store</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tabToggle}>
                            <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
                                <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="truck" size={16} color="#0071CE" />
                                <Text style={styles.activeTabText}>Pickup</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tabItem}>
                                <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="home" size={16} color="#9CA3AF" />
                                <Text style={styles.inactiveTabText}>Delivery</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subSectionTitle}>Pickup Time</Text>
                        <View style={styles.pickupDays}>
                            <TouchableOpacity
                                onPress={() => setPickupDay('Today')}
                                style={[styles.dayCard, pickupDay === 'Today' && styles.activeDayCard]}
                            >
                                <Text style={[styles.dayTitle, pickupDay === 'Today' && styles.activeDayTitle]}>Today</Text>
                                <Text style={[styles.dayTime, pickupDay === 'Today' && styles.activeDayTime]}>2:00 PM - 3:00 PM</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setPickupDay('Tomorrow')}
                                style={[styles.dayCard, pickupDay === 'Tomorrow' && styles.activeDayCard]}
                            >
                                <Text style={[styles.dayTitle, pickupDay === 'Tomorrow' && styles.activeDayTitle]}>Tomorrow</Text>
                                <Text style={[styles.dayTime, pickupDay === 'Tomorrow' && styles.activeDayTime]}>10:00 AM - 11:00 AM</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Spacer height={100} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.placeOrderBtn, loadingOrder && { opacity: 0.7 }]}
                        onPress={handlePlaceOrder}
                        disabled={loadingOrder}
                    >
                        {loadingOrder ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.placeOrderText}>Shop at {isKroger ? 'Kroger' : 'Walmart'}</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.purchaseLaterBtn}
                        onPress={() => { onPlaceOrder(); }}
                        disabled={loadingOrder}
                    >
                        <Text style={styles.purchaseLaterText}>Purchase Later</Text>
                    </TouchableOpacity>
                    <Spacer height={30} />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

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
        case 'sodium':
        case 'na': return '#94A3B8';
        default: return '#A78BFA';
    }
};

export default CheckoutModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        marginTop: 60,
        marginBottom: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScaleVertical(15),
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitle: { fontSize: textScale(18), fontWeight: '700', color: '#1F2937' },
    scrollContent: { flex: 1 },
    scrollContainer: { flexGrow: 1 },
    section: {
        backgroundColor: '#FFF',
        padding: moderateScale(16),
        marginBottom: moderateScaleVertical(10),
    },
    sectionTitle: { fontSize: textScale(16), fontWeight: '700', color: '#1F2937', marginBottom: 15 },
    orderItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    orderItemInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    avatarGroup: { flexDirection: 'row', alignItems: 'center' },
    orderItemLabel: { fontSize: textScale(14), fontWeight: '500', color: '#4B5563', marginLeft: 10 },
    orderItemRight: { flexDirection: 'row', alignItems: 'center' },
    orderItemPrice: { fontSize: textScale(14), fontWeight: '700', color: '#1F2937', marginRight: 8 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15 },
    expandedList: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: -5,
        marginBottom: 10
    },
    expandedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    expandedItemImage: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: '#FFF',
        marginRight: 12
    },
    expandedItemName: { fontSize: textScale(12), color: '#4B5563', flex: 1, marginRight: 10 },
    expandedItemPrice: { fontSize: textScale(12), fontWeight: '700', color: '#1F2937' },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    costLabel: { fontSize: textScale(14), color: '#6B7280' },
    costValue: { fontSize: textScale(14), color: '#1F2937', fontWeight: '500' },
    totalLabel: { fontSize: textScale(18), fontWeight: '700', color: '#1F2937' },
    totalValue: { fontSize: textScale(18), fontWeight: '900', color: '#1F2937' },
    budgetStatus: {
        backgroundColor: '#ECFDF5',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 15,
    },
    checkCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    budgetText: { fontSize: textScale(13), color: '#065F46' },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    nutritionRow: { flexDirection: 'row', alignItems: 'center' },
    gaugeContainer: { width: moderateScale(100), height: moderateScale(60), justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    nutritionStatusText: { flex: 1, fontSize: textScale(13), color: '#4B5563', marginLeft: 12 },
    nutritionDetailItem: {
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    nutritionItemName: {
        fontSize: textScale(14),
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    nutrientRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    nutrientTab: {
        backgroundColor: '#F3F4FB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    nutrientTabText: {
        fontSize: textScale(11),
        color: '#4B5563',
        fontWeight: '500',
    },
    noDataText: {
        fontSize: textScale(12),
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    walmartInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    walmartBrand: { backgroundColor: '#0071CE', width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    walmartBrandText: { color: '#FFF', fontWeight: '900' },
    fulfillmentTitle: { fontSize: textScale(16), fontWeight: '700', color: '#1F2937' },
    storeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    storeName: { fontSize: textScale(14), fontWeight: '600', color: '#1F2937' },
    storeAddress: { fontSize: textScale(12), color: '#6B7280', marginTop: 2 },
    changeLink: { fontSize: textScale(12), color: '#0071CE', fontWeight: '600' },
    tabToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
    activeTab: { backgroundColor: '#FFF', elevation: 2 },
    activeTabText: { fontSize: textScale(14), fontWeight: '700', color: '#0071CE', marginLeft: 8 },
    inactiveTabText: { fontSize: textScale(14), fontWeight: '500', color: '#9CA3AF', marginLeft: 8 },
    subSectionTitle: { fontSize: textScale(14), fontWeight: '700', color: '#1F2937', marginBottom: 12 },
    pickupDays: { flexDirection: 'row', gap: 10 },
    dayCard: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, alignItems: 'center' },
    activeDayCard: { borderColor: '#0071CE', backgroundColor: '#E5F3FF' },
    dayTitle: { fontSize: textScale(14), fontWeight: '600', color: '#4B5563' },
    activeDayTitle: { color: '#0071CE' },
    dayTime: { fontSize: textScale(10), color: '#6B7280', marginTop: 4 },
    activeDayTime: { color: '#0071CE' },
    nutritionTable: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableHeader: {
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
    },
    tableCell: {
        fontSize: textScale(12),
        color: '#4B5563',
        flex: 1,
    },
    headerText: {
        fontWeight: '700',
        color: '#1F2937',
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
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        padding: moderateScale(16),
    },
    placeOrderBtn: {
        backgroundColor: '#FF6B35',
        height: moderateScaleVertical(54),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeOrderText: { color: '#FFF', fontSize: textScale(16), fontWeight: '700' },
    purchaseLaterBtn: { height: moderateScaleVertical(48), borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#D1D5DB' },
    purchaseLaterText: { color: '#6B7280', fontSize: textScale(15), fontWeight: '600' },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 4,
    },
    qtyBtn: {
        padding: 8,
    },
    qtyText: {
        fontSize: textScale(14),
        fontWeight: '700',
        color: '#1F2937',
        paddingHorizontal: 8,
        minWidth: 30,
        textAlign: 'center',
    },
    chartContainer: {
        marginTop: 10,
    },
    chartRow: {
        marginBottom: 15,
    },
    chartLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    chartLabel: {
        fontSize: textScale(12),
        fontWeight: '600',
        color: '#4B5563',
    },
    chartValueText: {
        fontSize: textScale(11),
        fontWeight: '700',
        color: '#1F2937',
    },
    chartBarBackground: {
        height: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 5,
        overflow: 'hidden',
    },
    chartBarFill: {
        height: '100%',
        borderRadius: 5,
    },
});
