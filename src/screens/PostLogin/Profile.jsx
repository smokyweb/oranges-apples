import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
  verticalScale,
} from '../../helper/responsiveSize';
import LinearGradient from 'react-native-linear-gradient';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';
import { useSelector, useDispatch } from 'react-redux';
import { fonts } from '../../resources/fonts';
import Spacer from '../../components/Spacer';
import { getFamilyMembers, deleteFamilyMember, getFoodPreferences } from '../../../store/home/home.action';

const Profile = () => {
  const dispatch = useDispatch();
  const {userAccount} = useSelector(store=>store.authReducer);
  const {familyMembers, shoppingLists, foodPreferences} = useSelector(store=>store.homeReducer);
  console.log('FamilyMember===>>>', JSON.stringify(familyMembers))
  console.log('ShoppingLists===>>>', JSON.stringify(shoppingLists))
  
  useEffect(() => {
    dispatch(getFamilyMembers());
    dispatch(getFoodPreferences());
  }, [dispatch]);
  
  const handleDeleteMember = (memberId, memberName) => {
    Alert.alert(
      'Delete Family Member',
      `Are you sure you want to delete ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteFamilyMember(memberId))
        }
      ]
    );
  };


  const savedLists = [
    { title: 'Weekly Groceries', updated: 'Updated 1 day ago' },
    { title: 'Keto Meal Prep', updated: 'Updated 1 week ago' },
  ];

  // Remove hardcoded arrays since we're using Redux data
  // const dietaryPreferences = ['Keto', 'Vegan', 'Vegetarian', 'Low Carb'];
  // const foodDislikes = ['Mushrooms', 'Olives'];

  return (
    <WrapperContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#FF6B35', '#4CAF50']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.logoIcon}
          >
            <CustomIcon name={'apple-alt'} origin={ICON_TYPE.FONT_AWESOME5} color={'#fff'} size={20} />
          </LinearGradient>
          <Text style={styles.logoText}>Oranges to Apples</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
     <CustomIcon origin={ICON_TYPE.FONT_AWESOME} name="bell" size={22} color={'#4B5563'} />
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>Profile</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: userAccount?.profile_image || 'https://www.gravatar.com/avatar/?d=mp&s=100' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userAccount?.name}</Text>
              <Text style={styles.profileEmail}>{userAccount?.email}</Text>
            </View>
            <TouchableOpacity 
            onPress={()=>NavigationService.navigate(RouteName.EDIT_PROFILE)}
            style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Info</Text>
            {/* <TouchableOpacity onPress={()=>NavigationService.navigate(RouteName.ADD_FAMILY_MEMBER)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity> */}
              <Pressable onPress={()=>NavigationService.navigate(RouteName.ADD_MEMBER)}>

        <Text style={[styles.viewAllText,{textAlign:'right'}]}>Add Family Member</Text>
  </Pressable>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Household Size</Text>
            <Text style={styles.infoValue}>{familyMembers?.length || 0} people</Text>
          </View>
          
          <Text style={styles.subSectionTitle}>Family Members</Text>
          <View style={styles.membersGrid}>
            {familyMembers?.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <TouchableOpacity 
                  style={styles.memberInfo}
                  onPress={() => NavigationService.navigate(RouteName.ADD_MEMBER, { memberData: member })}
                >
                  <Text style={styles.memberAge}>{member.age > 18 ? 'Adult' : 'Child'}</Text>
                  <Text style={styles.memberName}>{member.name}, {member.age}{member.gender?.charAt(0)}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteMember(member.id, member.name)}
                >
                  <CustomIcon origin={ICON_TYPE.IONICONS} name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
  {/* <Pressable onPress={()=>NavigationService.navigate(RouteName.ADD_MEMBER)}>

        <Text style={[styles.viewAllText,{textAlign:'right'}]}>Add Family Member</Text>
  </Pressable> */}
      <Spacer height={verticalScale(5)} />
        {/* My Saved Lists Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Saved Lists</Text>
            <TouchableOpacity 
            onPress={()=>NavigationService.navigate(RouteName.MY_SHOPPING_LIST)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {shoppingLists?.data?.map((list, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.listItem}
              onPress={() => NavigationService.navigate(RouteName.NEW_SHOPPING_LIST, { editMode: true, listData: list })}
            >
              <View style={styles.listContent}>
                <View>
                  <Text style={styles.listTitle}>{list.name}</Text>
                  <Text style={styles.listUpdated}>Budget: ${list.budget}</Text>
                </View>
                <CustomIcon origin={ICON_TYPE.FONT_AWESOME5} name="chevron-right" size={16} color={colors.textColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Food Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Food Preferences</Text>
            <TouchableOpacity 
            onPress={()=> NavigationService.navigate(RouteName.FOOD_PREFERENCES)}
            >
              <CustomIcon origin={ICON_TYPE.FONT_AWESOME5} name="edit" size={16} color="#FF8A65" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subSectionTitle}>Dietary Preferences</Text>
          <View style={styles.tagsContainer}>
            {foodPreferences?.dietary?.length> 0 ? foodPreferences?.dietary?.map((pref, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{pref}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No dietary preferences set</Text>
            )}
          </View>
          
          <Text style={styles.subSectionTitle}>Favorite Foods</Text>
          <View style={styles.tagsContainer}>
            {foodPreferences?.favorites?.length > 0 ? foodPreferences?.favorites?.map((favorite, index) => (
              <View key={index} style={[styles.tag, styles.favoriteTag]}>
                <CustomIcon origin={ICON_TYPE.IONICONS} name="heart" size={16} color="#4CAF50" />
                <Text style={[styles.tagText, styles.favoriteText]}>{favorite}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No favorite foods set</Text>
            )}
          </View>
          
          <Text style={styles.subSectionTitle}>Food Dislikes</Text>
          <View style={styles.tagsContainer}>
            {foodPreferences?.dislikes?.length >0 ? foodPreferences?.dislikes?.map((dislike, index) => (
              <View key={index} style={[styles.tag, styles.dislikeTag]}>
                <CustomIcon origin={ICON_TYPE.ENTYPO} name="cross" size={20} color="#C62828" />
                <Text style={[styles.tagText, styles.dislikeText]}>{dislike}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No food dislikes set</Text>
            )}
          </View>
          
          {/* <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllBtnText}>View All ({(foodPreferences?.dietary?.length || 0) + (foodPreferences?.dislikes?.length || 0)} Items)</Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </WrapperContainer>
  );
};

export default Profile;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
  
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: { 
    fontSize: textScale(16), 
    fontWeight: '700', 
    color: '#1A1C1E' 
  },
  notifBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  mainTitle: {
    fontSize: textScale(22),
    fontWeight: '800',
    textAlign: 'center',
    color: '#1A1C1E',
    marginVertical: moderateScaleVertical(10),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flex: 1,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: textScale(16),
    // fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
    textTransform: 'capitalize',
    fontFamily:fonts.interSemiBold
  },
  profileEmail: {
    fontSize: textScale(12),
    color: '#6B7280',
  },
  editBtn: {
    backgroundColor: '#FF8A65',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    color: colors.white,
    fontSize: textScale(12),
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#1A1C1E',
  },
  editText: {
    fontSize: textScale(12),
    color: '#FF8A65',
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: textScale(12),
    color: '#FF8A65',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: textScale(14),
    color: '#6B7280',
  },
  infoValue: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#1A1C1E',
  },
  subSectionTitle: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#1A1C1E',
    marginBottom: 12,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  memberName: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#1A1C1E',
    textTransform:'capitalize'
  },
  memberAge: {
    fontSize: textScale(12),
    color: '#6B7280',
    marginBottom: 4,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: '#1A1C1E',
    marginBottom: 4,
    textTransform:'capitalize'
  },
  listUpdated: {
    fontSize: textScale(12),
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: textScale(12),
    color: '#2E7D32',
    fontWeight: '500',
  },
  dislikeTag: {
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dislikeText: {
    color: '#C62828',
    marginLeft: 4,
  },
  favoriteTag: {
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteText: {
    color: '#4CAF50',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: textScale(12),
    color: '#9CA3AF',
  
    textAlign:'center'
  },
  viewAllBtn: {
    alignSelf: 'flex-start',
  },
  viewAllBtnText: {
    fontSize: textScale(12),
    color: '#FF8A65',
    fontWeight: '600',
  },
});