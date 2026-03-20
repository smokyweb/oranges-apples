import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import axiosRequest from '../../helper/axiosRequest';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Faq = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await axiosRequest({
        url: 'get-faqs',
        method: 'GET',
      });
      setFaqData(response?.data?.data || []);
    } catch (error) {
      console.log('FAQ fetch error:', error);
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFaqData = faqData.filter(item =>
    item.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFaqItem = ({ item }) => {
    // Remove HTML p tags from answer
    const cleanAnswer = item.answer?.replace(/<\/?p>/g, '') || '';
    
    return (
      <View style={styles.faqCard}>
        <TouchableOpacity 
          style={styles.questionRow} 
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.questionText}>{item.question}</Text>
          <CustomIcon 
            origin={ICON_TYPE.FEATHER_ICONS} 
            name={expandedId === item.id ? "minus" : "plus"} 
            size={20} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>

        {expandedId === item.id && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{cleanAnswer}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <CustomIcon origin={ICON_TYPE.FEATHER_ICONS} name="search" size={18} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search questions..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  return (
    <WrapperContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon origin={ICON_TYPE.IONICONS} name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>F.A.Q</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFaqs}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredFaqData}
          renderItem={renderFaqItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No FAQs found for "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />
      )}
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
    paddingBottom: moderateScaleVertical(20),
  },
  flatListContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScaleVertical(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: moderateScale(12),
    height: moderateScaleVertical(45),
    marginBottom: moderateScaleVertical(20),
  },
  searchInput: {
    flex: 1,
    marginLeft: moderateScale(8),
    fontSize: textScale(14),
    color: '#1F2937',
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: moderateScaleVertical(12),
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
  },
  questionText: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: moderateScale(10),
  },
  answerContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  answerText: {
    fontSize: textScale(13),
    color: '#6B7280',
    lineHeight: 20,
    marginTop: moderateScaleVertical(8),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(40),
  },
  loadingText: {
    fontSize: textScale(14),
    color: '#6B7280',
    marginTop: moderateScaleVertical(10),
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(40),
  },
  errorText: {
    fontSize: textScale(14),
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScaleVertical(10),
    borderRadius: 8,
    marginTop: moderateScaleVertical(10),
  },
  retryText: {
    color: '#fff',
    fontSize: textScale(14),
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: moderateScaleVertical(40),
  },
  emptyText: {
    fontSize: textScale(14),
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default Faq;