import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';

const { width } = Dimensions.get('window');

const NewsDetails = ({ route, navigation }) => {
  const newsItem = route?.params?.newsItem;

  const cleanContent = newsItem?.content?.replace(/<\/?p>/g, '') || '';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <WrapperContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGXOB2JHuNLkCZiBzgt6m9Vx5qAVuQ7wCXiQ&s' }} 
            style={styles.headerImage}
            resizeMode="cover"
            onError={() => console.log('Image failed to load')}
          />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <CustomIcon 
              origin={ICON_TYPE.IONICONS} 
              name="arrow-back" 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{newsItem?.title}</Text>
          
          <View style={styles.metaInfo}>
            <Text style={styles.timeText}>{formatDate(newsItem?.created_at)}</Text>
          </View>

          <Text style={styles.content}>{cleanContent}</Text>
        </View>
      </ScrollView>
    </WrapperContainer>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: width,
    height: moderateScaleVertical(250),
    backgroundColor: '#F3F4F6',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: moderateScale(16),
  },
  title: {
    fontSize: textScale(20),
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 12,
  },
  metaInfo: {
    marginBottom: 20,
  },
  timeText: {
    fontSize: textScale(12),
    color: '#9CA3AF',
  },
  content: {
    fontSize: textScale(16),
    color: '#374151',
    lineHeight: 24,
  },
});

export default NewsDetails;