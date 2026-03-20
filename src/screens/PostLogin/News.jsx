import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
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
import { RouteName } from '../../helper/strings';

const News = ({ navigation }) => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

    const newsDataa = [
    {
      id: '1',
      title: 'Tech Startup Raises $100M in Series B Funding Round',
      time: '3 hours ago',
      description: 'The company plans to use the funds to expand its operations and develop new innovative products for its global customer base...',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    },
    {
      id: '2',
      title: 'Renewable Energy Sector Sees Record Growth This Quarter',
      time: '5 hours ago',
      description: 'Solar and wind energy investments have reached new heights this year, with several major projects getting approval across the country...',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    },
    {
      id: '3',
      title: 'New Health App Helps Users Track Wellness Goals',
      time: '8 hours ago',
      description: 'A breakthrough application has been launched aimed at providing personalized health advice and fitness tracking for all age groups...',
       image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    },
  ];

  const fetchNews = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      const response = await axiosRequest({
        url: `get-news?page=${page}`,
        method: 'GET',
      });
      
      const newData = response?.data?.data || [];
      setNewsData(prev => append ? [...prev, ...newData] : newData);
      setHasNextPage(!!response?.data?.data?.next_page_url);
      setCurrentPage(page);
    } catch (error) {
      console.log('News fetch error:', error);
      setError('Failed to load news');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchNews(currentPage + 1, true);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  };

  const renderNewsCard = ({ item }) => {
     const cleanContent = item.content?.replace(/<\/?p>/g, '') || '';
     return(
    
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate(RouteName.NEWS_DETAILS, { newsItem: item })}
    >
      <Image 
        source={{uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGXOB2JHuNLkCZiBzgt6m9Vx5qAVuQ7wCXiQ&s'}} 
        style={styles.newsImage}
        resizeMode="cover"
      />
      <View style={styles.textContainer}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.timeText}>{item.time}</Text>
        <Text style={styles.descriptionText} numberOfLines={3}>
          {cleanContent}
        </Text>
      </View>
    </TouchableOpacity>
  )};

  return (
    <WrapperContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon origin={ICON_TYPE.IONICONS} name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>News</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      ) : (
        <FlatList
          data={newsData}
          renderItem={renderNewsCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
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
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScaleVertical(20),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: moderateScaleVertical(20),
    overflow: 'hidden',
    // Subtle shadow for iOS/Android
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  newsImage: {
    width: '100%',
    height: moderateScaleVertical(160),
    backgroundColor: '#F3F4F6',
  },
  textContainer: {
    padding: moderateScale(16),
  },
  newsTitle: {
    fontSize: textScale(15),
    fontWeight: '800', // Heavy bold as per design
    color: '#111827',
    marginBottom: 4,
  },
  timeText: {
    fontSize: textScale(12),
    color: '#9CA3AF',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: textScale(13),
    color: '#4B5563',
    lineHeight: 18,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginTop: 8,
  },
});

export default News;