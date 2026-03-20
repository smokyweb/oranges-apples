import React, { JSX } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RouteName } from '../helper/strings';
import SignUp from '../screens/PreLogin/SignUp';
import Login from '../screens/PreLogin/Login';
import VerifyEmail from '../screens/PreLogin/VerifyEmail';
import SetupHousehold from '../screens/PreLogin/SetupHousehold';
import AddFamilyMember from '../screens/PreLogin/AddFamilyMember';
import AccountReady from '../screens/PreLogin/AccountReady';
import MainTabNavigator from './MainTabNavigator';
import EditProfile from '../screens/PostLogin/EditProfile';
import RecipeDetails from '../screens/PostLogin/RecipeDetails';
import AboutUs from '../screens/PostLogin/AboutUs';
import ContactUs from '../screens/PostLogin/ContactUs';
import Faq from '../screens/PostLogin/Faq';
import News from '../screens/PostLogin/News';
import PrivacyPolicy from '../screens/PostLogin/PrivacyPolicy';
import TermsOfService from '../screens/PostLogin/TermsOfService';
import NutritionalFacts from '../screens/PostLogin/NutritionalFacts';
import NewShoppingList from '../screens/PostLogin/NewShoppingList';
import ResetPassword from '../screens/PreLogin/ResetPassword';
import ListDetails from '../screens/PostLogin/ListDetails';
import MealPlan from '../screens/PostLogin/MealPlan';
import FoodPreferences from '../screens/PostLogin/FoodPreferences';
import MyShoppingList from '../screens/PostLogin/MyShoppingList';


const Stack = createNativeStackNavigator();

function PreLoginNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      
      }}
      >
      <Stack.Screen name={RouteName.LOGIN} component={Login} />
      <Stack.Screen name={RouteName.SIGNUP} component={SignUp} />
      <Stack.Screen name={RouteName.VERIFY_EMAIL} component={VerifyEmail} />
      <Stack.Screen name={RouteName.SETUP_HOUSEHOLD} component={SetupHousehold} />
      <Stack.Screen name={RouteName.ADD_FAMILY_MEMBER} component={AddFamilyMember} />
      <Stack.Screen name={RouteName.ACCOUNT_READY} component={AccountReady} />
      <Stack.Screen name={RouteName.MAIN_TAB} component={MainTabNavigator} />
<Stack.Screen name={RouteName.EDIT_PROFILE} component={EditProfile} />
<Stack.Screen name={RouteName.RECIPE_DETAILS} component={RecipeDetails} />
<Stack.Screen name={RouteName.ABOUT_US} component={AboutUs} />
<Stack.Screen name={RouteName.CONTACT_US} component={ContactUs} />
<Stack.Screen name={RouteName.FAQ} component={Faq} />
<Stack.Screen name={RouteName.NEWS} component={News} />
<Stack.Screen name={RouteName.PRIVACY_POLICY} component={PrivacyPolicy} />
<Stack.Screen name={RouteName.TERMS_AND_CONDITIONS} component={TermsOfService} />
<Stack.Screen name={RouteName.NUTRITIONAL_FACTS} component={NutritionalFacts} />
<Stack.Screen name={RouteName.NEW_SHOPPING_LIST} component={NewShoppingList} />
<Stack.Screen name={RouteName.RESET_PASSWORD} component={ResetPassword} />
<Stack.Screen name={RouteName.LIST_DETAILS} component={ListDetails} />
<Stack.Screen name={RouteName.MEAL_PLAN} component={MealPlan} />
<Stack.Screen name={RouteName.FOOD_PREFERENCES} component={FoodPreferences} />
<Stack.Screen name={RouteName.MY_SHOPPING_LIST} component={MyShoppingList} />

    </Stack.Navigator>
  );
}


export default PreLoginNavigation;
