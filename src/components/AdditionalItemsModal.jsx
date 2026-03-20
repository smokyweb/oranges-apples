import React, { useState, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { getWalmartPrice, getKrogerPrice } from '../../store/home/home.action';
import CustomIcon, { ICON_TYPE } from './CustomIcon';
import {
    moderateScale,
    moderateScaleVertical,
    textScale,
} from '../helper/responsiveSize';
import Spacer from './Spacer';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    'Household Essentials',
    'Personal Care',
    'Baby',
    'Beauty',
    'Pharmacy'
];

const AdditionalItemsModal = ({ visible, onClose, onNext, selectedStore = 'walmart' }) => {
  const isKroger = selectedStore === 'kroger';
    const [selectedCategory, setSelectedCategory] = useState('Household Essentials');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [addedItems, setAddedItems] = useState({});
    const dispatch = useDispatch();

    useEffect(() => {
        if (visible) {
            // Reset and fetch when category or visibility changes
            setPage(1);
            setProducts([]);
            setHasMore(true);
            fetchProducts(searchQuery || selectedCategory, 1, true);
        }
    }, [visible, selectedCategory]);

    const fetchProducts = async (query, pageNum, isInitial = false) => {
        if (isInitial) setLoading(true);
        else setIsFetchingMore(true);

        try {
            const finalQuery = searchQuery.trim()
                ? `${searchQuery} ${selectedCategory}`
                : selectedCategory;

            if (isKroger) {
                const resp = await dispatch(getKrogerPrice({ query: finalQuery, limit: 20 })).unwrap();
                if (resp.success && Array.isArray(resp.data)) {
                    const normalized = resp.data.map(item => ({
                        itemId: item.id,
                        name: item.name,
                        salePrice: item.price || 0,
                        thumbnailImage: item.image,
                        largeImage: item.image,
                        mediumImage: item.image,
                        stock: 'Available',
                        customerRating: null,
                        numReviews: null,
                        store: 'kroger',
                    }));
                    if (normalized.length === 0) {
                        setHasMore(false);
                    } else {
                        setProducts(prev => isInitial ? normalized : [...prev, ...normalized]);
                        setHasMore(normalized.length >= 10);
                    }
                } else {
                    setHasMore(false);
                }
            } else {
                const resp = await dispatch(getWalmartPrice({ query: finalQuery, page: pageNum })).unwrap();
                if (resp.success && resp.data?.items) {
                    const newItems = resp.data.items;
                    if (newItems.length === 0) {
                        setHasMore(false);
                    } else {
                        setProducts(prev => isInitial ? newItems : [...prev, ...newItems]);
                        setHasMore(newItems.length >= 10);
                    }
                } else {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.log('Error fetching products:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        setProducts([]);
        setHasMore(true);
        // This will trigger fetchProducts via the logic inside fetchProducts itself
        fetchProducts(searchQuery, 1, true);
    };

    const handleLoadMore = () => {
        if (!isFetchingMore && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(searchQuery || selectedCategory, nextPage);
        }
    };

    const toggleItem = (item) => {
        const id = item.itemId;
        setAddedItems(prev => {
            const newState = { ...prev };
            if (newState[id]) {
                delete newState[id];
            } else {
                newState[id] = item;
            }
            return newState;
        });
    };

    const totalAddedCount = Object.keys(addedItems).length;
    const totalPrice = Object.values(addedItems).reduce((sum, item) => {
        return sum + (item.salePrice || 0);
    }, 0);

    const handleNext = () => {
        const selectedProducts = Object.values(addedItems);
        onNext(selectedProducts);
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.largeImage || item.mediumImage || item.thumbnailImage }} style={styles.itemImage} resizeMode="contain" />
                <TouchableOpacity style={styles.viewIcon}>
                    <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="eye" size={16} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.salePrice || 0).toFixed(2)}</Text>
                <View style={styles.ratingRow}>
                    <CustomIcon origin={ICON_TYPE.IONICONS} name="star" size={14} color="#FFC107" />
                    <Text style={styles.ratingText}>{item.customerRating || '0.0'} ({item.numReviews || 0})</Text>
                </View>
                <Text style={styles.stockStatus}>{item.stock || 'Available'}</Text>
                <TouchableOpacity
                    style={[styles.addButton, addedItems[item.itemId] && styles.addedButton]}
                    onPress={() => toggleItem(item)}
                >
                    <Text style={[styles.addButtonText, addedItems[item.itemId] && styles.addedButtonText]}>
                        {addedItems[item.itemId] ? '✓ Added' : '+ Add to List'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Additional Items</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <View style={[styles.walmartIcon, isKroger && { backgroundColor: '#004B8D' }]}>
                            <Text style={styles.walmartText}>{isKroger ? 'K' : 'W'}</Text>
                        </View>
                        <TextInput
                            placeholder={`Search on ${isKroger ? 'Kroger' : 'Walmart'}...`}
                            style={styles.searchInput}
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                        <TouchableOpacity onPress={handleSearch}>
                            <CustomIcon origin={ICON_TYPE.IONICONS} name="search" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.categoriesContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={CATEGORIES}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedCategory(item)}
                                style={[styles.categoryBtn, selectedCategory === item && styles.activeCategoryBtn]}
                            >
                                <Text style={[styles.categoryText, selectedCategory === item && styles.activeCategoryText]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingHorizontal: moderateScale(16) }}
                    />
                </View>

                {loading && page === 1 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#28C76F" />
                        <Text style={{ marginTop: 10, color: '#6B7280' }}>Fetching {isKroger ? 'Kroger' : 'Walmart'} items...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => `${item.itemId}-${index}`}
                        numColumns={2}
                        contentContainerStyle={styles.listContent}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isFetchingMore ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#28C76F" />
                                </View>
                            ) : <View style={{ height: 20 }} />
                        }
                        ListEmptyComponent={
                            !loading && (
                                <View style={{ flex: 1, alignItems: 'center', marginTop: 50 }}>
                                    <Text style={{ color: '#9CA3AF' }}>No products found for "{searchQuery || selectedCategory}"</Text>
                                </View>
                            )
                        }
                    />
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerSummary}>
                        {totalAddedCount} items added • <Text style={{ fontWeight: '700' }}>${totalPrice.toFixed(2)}</Text>
                    </Text>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Next</Text>
                    </TouchableOpacity>
                    <Spacer height={30} />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default AdditionalItemsModal;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF', marginTop: 60, marginBottom: 10 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScaleVertical(15),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: textScale(18), fontWeight: '700', color: '#1F2937' },
    searchContainer: { padding: moderateScale(16) },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: moderateScale(12),
        height: moderateScaleVertical(50),
    },
    walmartIcon: {
        backgroundColor: '#0071CE',
        width: 24,
        height: 24,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    walmartText: { color: '#FFF', fontWeight: '900', fontSize: textScale(12) },
    searchInput: { flex: 1, fontSize: textScale(14), color: '#1F2937' },
    categoriesContainer: { marginBottom: moderateScaleVertical(15) },
    categoryBtn: {
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScaleVertical(10),
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    activeCategoryBtn: { backgroundColor: '#28C76F' },
    categoryText: { fontSize: textScale(13), color: '#6B7280', fontWeight: '600' },
    activeCategoryText: { color: '#FFF' },
    listContent: { paddingHorizontal: moderateScale(10), paddingBottom: moderateScaleVertical(100) },
    itemCard: {
        width: (width - moderateScale(40)) / 2,
        margin: moderateScale(5),
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    imageContainer: {
        height: 140,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    itemImage: { width: '100%', height: '100%' },
    viewIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 4, elevation: 2 },
    itemDetails: { padding: moderateScale(12) },
    itemName: { fontSize: textScale(13), fontWeight: '600', color: '#1F2937', height: 40 },
    itemPrice: { fontSize: textScale(14), fontWeight: '700', color: '#1F2937', marginVertical: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: textScale(10), color: '#9CA3AF', marginLeft: 4 },
    stockStatus: { fontSize: textScale(10), color: '#28C76F', marginVertical: 4, fontWeight: '600' },
    addButton: {
        backgroundColor: '#28C76F',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    addedButton: { backgroundColor: '#E5F3FF', borderWidth: 1, borderColor: '#0071CE' },
    addButtonText: { color: '#FFF', fontSize: textScale(12), fontWeight: '700' },
    addedButtonText: { color: '#0071CE' },
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
    footerSummary: { fontSize: textScale(14), color: '#4B5563', marginBottom: 12 },
    nextBtn: {
        backgroundColor: '#FF6B35',
        height: moderateScaleVertical(54),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextBtnText: { color: '#FFF', fontSize: textScale(16), fontWeight: '700' },
});
