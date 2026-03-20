import React, { JSX } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { RouteName } from '../helper/strings';
import MainTabNavigator from './MainTabNavigator'
import EditProfile from '../screens/PostLogin/EditProfile';
import AboutUs from '../screens/PostLogin/AboutUs';
import ContactUs from '../screens/PostLogin/ContactUs';
import Faq from '../screens/PostLogin/Faq';
import News from '../screens/PostLogin/News';
import PrivacyPolicy from '../screens/PostLogin/PrivacyPolicy';
import TermsOfService from '../screens/PostLogin/TermsOfService';
import RecipeDetails from '../screens/PostLogin/RecipeDetails';
import NutritionalFacts from '../screens/PostLogin/NutritionalFacts';
import NewShoppingList from '../screens/PostLogin/NewShoppingList';
import ListDetails from '../screens/PostLogin/ListDetails';
import MealPlan from '../screens/PostLogin/MealPlan';
import FoodPreferences from '../screens/PostLogin/FoodPreferences';
import MyShoppingList from '../screens/PostLogin/MyShoppingList';
import NewsDetails from '../screens/PostLogin/NewsDetails';
import AddMember from '../screens/PostLogin/AddMember';
const Stack = createNativeStackNavigator();

function PostLoginNavigation() {

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation:'none'
      }}
    >
<Stack.Screen name={RouteName.MAIN_TAB} component={MainTabNavigator} />
<Stack.Screen name={RouteName.EDIT_PROFILE} component={EditProfile} />
<Stack.Screen name={RouteName.ABOUT_US} component={AboutUs} />
<Stack.Screen name={RouteName.CONTACT_US} component={ContactUs} />
<Stack.Screen name={RouteName.FAQ} component={Faq} />
<Stack.Screen name={RouteName.NEWS} component={News} />
<Stack.Screen name={RouteName.NEWS_DETAILS} component={NewsDetails} />
<Stack.Screen name={RouteName.PRIVACY_POLICY} component={PrivacyPolicy} />
<Stack.Screen name={RouteName.TERMS_AND_CONDITIONS} component={TermsOfService} />
<Stack.Screen name={RouteName.RECIPE_DETAILS} component={RecipeDetails} />
<Stack.Screen name={RouteName.NUTRITIONAL_FACTS} component={NutritionalFacts} />
<Stack.Screen name={RouteName.NEW_SHOPPING_LIST} component={NewShoppingList} />
<Stack.Screen name={RouteName.LIST_DETAILS} component={ListDetails} />
<Stack.Screen name={RouteName.MEAL_PLAN} component={MealPlan} />
<Stack.Screen name={RouteName.FOOD_PREFERENCES} component={FoodPreferences} />
<Stack.Screen name={RouteName.MY_SHOPPING_LIST} component={MyShoppingList} />
<Stack.Screen name={RouteName.ADD_MEMBER} component={AddMember} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PostLoginNavigation;
