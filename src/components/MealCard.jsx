import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import CustomIcon, { ICON_TYPE } from '..//components/CustomIcon';
import { textScale, moderateScale } from '..//helper/responsiveSize';
import { images } from '../resources/images';

const MealCard = ({ meal, onRecipePress, onLikePress }) => {
  return (
    <View style={styles.card}>
      {/* Category Header */}
      <View style={styles.header}>
        <Text style={styles.categoryTitle}>{meal.category}</Text>
        <TouchableOpacity onPress={() => onLikePress(meal.id)}>
          <CustomIcon
            origin={ICON_TYPE.IONICONS}
            name={meal.liked ? 'heart' : 'heart-outline'}
            size={22}
            color={meal.liked ? '#FF4D4F' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.contentRow}>
        <Image
          source={meal.image ? { uri: meal.image } : images.recipe}
          style={styles.image}
          defaultSource={images.recipe}
        />
        <View style={styles.details}>
          <Text style={styles.title}>{meal.title}</Text>

          {/* Nutritional Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: '#E1F9E1' }]}>
              <Text style={[styles.badgeText, { color: '#28C76F' }]}>
                {meal.calories}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#E1EFFF' }]}>
              <Text style={[styles.badgeText, { color: '#007AFF' }]}>
                {meal.protein}
              </Text>
            </View>
          </View>

          {/* Time and Price */}
          <View style={styles.footerRow}>
            <View style={styles.iconInfo}>
              <CustomIcon
                origin={ICON_TYPE.FEATHER_ICONS}
                name="clock"
                size={14}
                color="#9CA3AF"
              />
              <Text style={styles.timeText}>{meal.time}</Text>
            </View>
            <Text style={styles.priceText}>{meal.price}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.ingredientsSummary}>Uses: {meal.ingredients}</Text>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => onRecipePress(meal)}
      >
        <Text style={styles.buttonText}>View Recipe</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#111827',
  },
  contentRow: { flexDirection: 'row' },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  details: { flex: 1, marginLeft: 16 },
  title: { fontSize: textScale(15), fontWeight: '700', color: '#1F2937' },
  badgeRow: { flexDirection: 'row', marginVertical: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: { fontSize: textScale(11), fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconInfo: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: textScale(12), color: '#9CA3AF', marginLeft: 4 },
  priceText: { fontSize: textScale(14), fontWeight: '700', color: '#FF6B35' },
  ingredientsSummary: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginTop: 12,

  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: textScale(14) },
});

export default MealCard;
