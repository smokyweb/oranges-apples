import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, textScale, moderateScaleVertical } from '../styles/responsiveSize';
import CustomIcon, { ICON_TYPE } from './CustomIcon';

const RecipeCard = ({ 
  image, 
  title, 
  cookTime, 
  prepTime, 
  servings, 
  totalCost, 
  onPress,
  onBookmarkPress,
  isBookmarked = false 
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={image} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <CustomIcon origin={ICON_TYPE.IONICONS} name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{cookTime} min</Text>
          </View>
          
          <View style={styles.infoItem}>
            <CustomIcon origin={ICON_TYPE.IONICONS} name="flame-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{prepTime} min</Text>
          </View>
          
          <View style={styles.infoItem}>
            <CustomIcon origin={ICON_TYPE.IONICONS} name="people-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{servings} servings</Text>
          </View>
        </View>
        
        <View style={styles.bottomRow}>
          <Text style={styles.totalCost}>${totalCost} total</Text>
          <TouchableOpacity onPress={onBookmarkPress}>
            <CustomIcon 
              origin={ICON_TYPE.IONICONS} 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color="#FF8A65" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: moderateScaleVertical(16),
  },
  image: {
    width: '100%',
    height: moderateScaleVertical(180),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    padding: moderateScale(16),
  },
  title: {
    fontSize: textScale(18),
    fontWeight: '600',
    color: '#000',
    marginBottom: moderateScaleVertical(8),
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: moderateScaleVertical(12),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  infoText: {
    fontSize: textScale(12),
    color: '#666',
    marginLeft: moderateScale(4),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCost: {
    fontSize: textScale(16),
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default RecipeCard;