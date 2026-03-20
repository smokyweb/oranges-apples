import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import WrapperContainer from '../../components/WrapperContainer'
import Header from '../../components/Header'
import CustomButton from '../../components/CustomButton'
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon'
import { textScale, moderateScale, verticalScale } from '../../helper/responsiveSize'
import { colors } from '../../resources/colors'
import NavigationService from '../../navigation/NavigationService'
import Spacer from '../../components/Spacer'
import LoaderOverlay from '../../components/LoaderOverlay'
import { getFoodPreferences, addFoodPreferences } from '../../../store/home/home.action'
import CustomInput from '../../components/CustomInput'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const FoodPreferences = () => {
  const dispatch = useDispatch()
  const { foodPreferences } = useSelector(state => state.homeReducer)
  
  const [selectedDietary, setSelectedDietary] = useState([])
  const [selectedFoods, setSelectedFoods] = useState([])
  const [selectedDislikes, setSelectedDislikes] = useState([])
  const [favoriteSearch, setFavoriteSearch] = useState('')
  const [dislikeSearch, setDislikeSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Low Carb', 'Low Sodium', 'Halal', 'Kosher', 'Whole 30']
  const popularSuggestions = ['Fruits', 'Vegetables', 'Poultry', 'Seafood', 'Pasta', 'Beans', 'Nuts']
  const commonDislikes = ['Seafood', 'Organ Meats', 'Spicy Foods', 'Strong Cheeses']

  useEffect(() => {
    dispatch(getFoodPreferences())
  }, [])

  useEffect(() => {
    if (foodPreferences) {
      setSelectedDietary(foodPreferences.dietary || [])
      setSelectedFoods(foodPreferences.favorites || [])
      setSelectedDislikes(foodPreferences.dislikes || [])
    }
  }, [foodPreferences])

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const TagButton = ({ title, selected, onPress, color = colors.secondary, textColor,borderRadius }) => (
    <TouchableOpacity
      style={[styles.tag, selected && { backgroundColor: color , borderRadius:borderRadius ?? 20}]}
      onPress={onPress}
    >
      <Text style={[styles.tagText, selected && { color: textColor?? 'white' }]}>{title}</Text>
      {selected && (
        <CustomIcon
          origin={ICON_TYPE.IONICONS}
          name="close"
          size={16}
          color={textColor ?? "white"}
          style={{ marginLeft: 4 }}
        />
      )}
    </TouchableOpacity>
  )



  const addFavoriteFood = () => {
    if (favoriteSearch.trim() && !selectedFoods.includes(favoriteSearch.trim())) {
      setSelectedFoods([...selectedFoods, favoriteSearch.trim()])
      setFavoriteSearch('')
    }
  }

  const addDislikeFood = () => {
    if (dislikeSearch.trim() && !selectedDislikes.includes(dislikeSearch.trim())) {
      setSelectedDislikes([...selectedDislikes, dislikeSearch.trim()])
      setDislikeSearch('')
    }
  }

  const handleSavePreferences = async () => {
    const payload = {
      dietary: selectedDietary,
      favorites: selectedFoods,
      dislikes: selectedDislikes,
    }
    setLoading(true)
    try {
      await dispatch(addFoodPreferences(payload)).unwrap()
      Alert.alert('Success', 'Food preferences saved successfully!')
       dispatch(getFoodPreferences())
      NavigationService.goBack()
    } catch (error) {
      Alert.alert('Error', 'Failed to save food preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <WrapperContainer>
      <Header 
        title="Food Preferences" 
        onBackPress={()=>NavigationService.goBack()}
        rightIcon={
          <TouchableOpacity onPress={handleSavePreferences} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        }
      />
      
      <KeyboardAwareScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions & Styles</Text>
       
          <View style={styles.tagContainer}>
            {dietaryOptions.map((option) => (
              <TagButton
                key={option}
                title={option}
                selected={selectedDietary.includes(option)}
                onPress={() => toggleSelection(option, selectedDietary, setSelectedDietary)}
              />
            ))}
          </View>
        </View>

        {/* Favorite Foods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Foods</Text>
          <Text style={styles.sectionSubtitle}>We'll prioritize these</Text>
          
          {/* <SearchInput
            placeholder="Add foods you enjoy..."
            value={favoriteSearch}
            onChangeText={setFavoriteSearch}
            onSubmit={addFavoriteFood}
          /> */}
             <View style={styles.searchContainer}>
      <View style={{flex: 1}}>
        <CustomInput
            placeholder={'Add foods you enjoy...'}
            value={favoriteSearch}
            onChangeText={setFavoriteSearch}
        />
      </View>
      <TouchableOpacity onPress={addFavoriteFood} style={styles.addButton}>
        <CustomIcon
          origin={ICON_TYPE.IONICONS}
          name="add"
          size={20}
          color={colors.white}
        />
      </TouchableOpacity>
    </View>
       
          
          <View style={styles.tagContainer}>
            {selectedFoods.map((food) => (
              <TagButton
                key={food}
                title={food}
                selected={true}
                onPress={() => toggleSelection(food, selectedFoods, setSelectedFoods)}
                color={'#BBF7D0'}
                textColor={colors.primary}
                borderRadius={10}
              />
            ))}
          </View>
          
          <Text style={styles.suggestionTitle}>Popular suggestions:</Text>
          <View style={styles.tagContainer}>
            {popularSuggestions.map((suggestion) => (
              <TagButton
                key={suggestion}
                title={suggestion}
                selected={false}
                onPress={() => toggleSelection(suggestion, selectedFoods, setSelectedFoods)}
              />
            ))}
          </View>
        </View>

        {/* Food Dislikes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Dislikes</Text>
          <Text style={styles.sectionSubtitle}>We'll avoid these</Text>
               <View style={styles.searchContainer}>
      <View style={{flex: 1}}>
        <CustomInput
            placeholder={'Add foods to avoid...'}
            value={dislikeSearch}
            onChangeText={setDislikeSearch}
        />
      </View>
      <TouchableOpacity onPress={addDislikeFood} style={styles.addButton}>
        <CustomIcon
          origin={ICON_TYPE.IONICONS}
          name="add"
          size={20}
          color={colors.white}
        />
      </TouchableOpacity>
    </View>
          
          <View style={styles.tagContainer}>
            {selectedDislikes.map((dislike) => (
              <TagButton
                key={dislike}
                title={dislike}
                selected={true}
                onPress={() => toggleSelection(dislike, selectedDislikes, setSelectedDislikes)}
            
                        color={'#FECACA'}
                textColor={colors.danger}
                borderRadius={10}
              />
            ))}
          </View>
          
          <Text style={styles.suggestionTitle}>Common dislikes:</Text>
          <View style={styles.tagContainer}>
            {commonDislikes.map((dislike) => (
              <TagButton
                key={dislike}
                title={dislike}
                selected={false}
                onPress={() => toggleSelection(dislike, selectedDislikes, setSelectedDislikes)}
                color={'#fff'}
                borderRadius={5}
              />
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>
      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <CustomButton
          title="Save Preferences"
          onPress={handleSavePreferences}
          style={styles.saveButton}
          disabled={loading}
        />
        <TouchableOpacity style={styles.cancelButton} onPress={() => NavigationService.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <Spacer height={verticalScale(30)} />
      
      <LoaderOverlay visible={loading} />
      
    </WrapperContainer>
  )
}

export default FoodPreferences

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    paddingVertical:verticalScale(10)
  },
  saveText: {
    fontSize: textScale(16),
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: textScale(18),
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: textScale(14),
    color: colors.grey,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: textScale(14),
    color: colors.black,
   
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: verticalScale(8),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    marginRight: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  tagText: {
    fontSize: textScale(12),
    fontWeight: '500',
    color: colors.black,
  },
  suggestionTitle: {
    fontSize: textScale(14),
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8,
    marginTop: 8,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: textScale(16),
    fontWeight: '600',
    color: colors.grey,
  },
  addButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    width: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
     marginBottom:15
  },
})