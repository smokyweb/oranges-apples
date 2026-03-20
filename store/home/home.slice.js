import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { LoadingStatus } from '../../src/helper/strings';
import { appSetting, addFamilyMember, getFamilyMembers, deleteFamilyMember, getPageContent, getShoppingLists, updateShoppingList, getRecipes, getFoodPreferences, addFoodPreferences, getMoreRecipes, getNutritionTypes, getShoppingListItems, deleteShoppingList, getFamilyNutrition, updateShoppingListMeals, getShoppinglistMeals, getSavedRecipes, getMyMeals, getTodayNutritionLogs } from './home.action';

const SLICE_FEATURE_KEY = 'home';

// Create entity adapter
const entityAdapter = createEntityAdapter();

const initialState = entityAdapter.getInitialState({
  appSettingData: null,
  appSettingError: null,
  appSettingLoading: LoadingStatus.NOT_LOADED,
  addMemberLoading: LoadingStatus.NOT_LOADED,
  addMemberError: null,
  familyMembers: [],
  familyMembersLoading: LoadingStatus.NOT_LOADED,
  familyMembersError: null,
  pageContent: null,
  pageContentLoading: LoadingStatus.NOT_LOADED,
  pageContentError: null,
  shoppingLists: [],
  shoppingListsLoading: LoadingStatus.NOT_LOADED,
  shoppingListsError: null,
  recipes: [],
  recipesLoading: LoadingStatus.NOT_LOADED,
  recipesError: null,
  isLoadingMore: false,
  foodPreferences: null,
  foodPreferencesLoading: LoadingStatus.NOT_LOADED,
  foodPreferencesError: null,
  nutritionTypes: [],
  nutritionTypesLoading: LoadingStatus.NOT_LOADED,
  nutritionTypesError: null,
  shoppingListItems: null,
  shoppingListItemsLoading: LoadingStatus.NOT_LOADED,
  shoppingListItemsError: null,
  familyNutrition: null,
  familyNutritionLoading: LoadingStatus.NOT_LOADED,
  familyNutritionError: null,
  updateShoppingListMealsLoading: LoadingStatus.NOT_LOADED,
  updateShoppingListMealsError: null,
  todayNutritionLogs: null,
  todayNutritionLogsLoading: LoadingStatus.NOT_LOADED,
  todayNutritionLogsError: null,
});

/**
 * Slice for all reducers
 */
const reduxSlice = createSlice({
  name: SLICE_FEATURE_KEY,
  initialState: initialState,
  reducers: {
    resetSliceState: state => {
      return {
        ...initialState,
      };
    },
  },
  extraReducers: builder => {
    builder

      .addCase(appSetting.pending, (state, action) => {
        state.appSettingLoading = LoadingStatus.LOADING;
      })
      .addCase(appSetting.fulfilled, (state, action) => {
        state.appSettingLoading = LoadingStatus.LOADED;
        state.appSettingData = action?.payload;
      })
      .addCase(appSetting.rejected, (state, action) => {
        state.appSettingLoading = LoadingStatus.FAILED;
        state.appSettingError = action.payload;
      })
      .addCase(addFamilyMember.pending, (state) => {
        state.addMemberLoading = LoadingStatus.LOADING;
      })
      .addCase(addFamilyMember.fulfilled, (state) => {
        state.addMemberLoading = LoadingStatus.LOADED;
      })
      .addCase(addFamilyMember.rejected, (state, action) => {
        state.addMemberLoading = LoadingStatus.FAILED;
        state.addMemberError = action.payload;
      })
      .addCase(getFamilyMembers.pending, (state) => {
        state.familyMembersLoading = LoadingStatus.LOADING;
      })
      .addCase(getFamilyMembers.fulfilled, (state, action) => {
        state.familyMembersLoading = LoadingStatus.LOADED;
        state.familyMembers = action.payload;
      })
      .addCase(getFamilyMembers.rejected, (state, action) => {
        state.familyMembersLoading = LoadingStatus.FAILED;
        state.familyMembersError = action.payload;
      })
      .addCase(deleteFamilyMember.fulfilled, (state, action) => {
        state.familyMembers = state.familyMembers.filter(member => member.id !== action.payload);
      })
      .addCase(getPageContent.pending, (state) => {
        state.pageContentLoading = LoadingStatus.LOADING;
      })
      .addCase(getPageContent.fulfilled, (state, action) => {
        state.pageContentLoading = LoadingStatus.LOADED;
        state.pageContent = action.payload;
      })
      .addCase(getPageContent.rejected, (state, action) => {
        state.pageContentLoading = LoadingStatus.FAILED;
        state.pageContentError = action.payload;
      })
      .addCase(getShoppingLists.pending, (state) => {
        state.shoppingListsLoading = LoadingStatus.LOADING;
      })
      .addCase(getShoppingLists.fulfilled, (state, action) => {
        state.shoppingListsLoading = LoadingStatus.LOADED;
        state.shoppingLists = action.payload;
      })
      .addCase(getShoppingLists.rejected, (state, action) => {
        state.shoppingListsLoading = LoadingStatus.FAILED;
        state.shoppingListsError = action.payload;
      })
      .addCase(updateShoppingList.pending, (state) => {
        state.shoppingListsLoading = LoadingStatus.LOADING;
      })
      .addCase(updateShoppingList.fulfilled, (state, action) => {
        state.shoppingListsLoading = LoadingStatus.LOADED;
      })
      .addCase(updateShoppingList.rejected, (state, action) => {
        state.shoppingListsLoading = LoadingStatus.FAILED;
        state.shoppingListsError = action.payload;
      })
      .addCase(getRecipes.pending, (state) => {
        state.recipesLoading = LoadingStatus.LOADING;
      })
      .addCase(getRecipes.fulfilled, (state, action) => {
        state.recipesLoading = LoadingStatus.LOADED;
        state.recipes = action.payload;
      })
      .addCase(getRecipes.rejected, (state, action) => {
        state.recipesLoading = LoadingStatus.FAILED;
        state.recipesError = action.payload;
      })
      .addCase(getMoreRecipes.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(getMoreRecipes.fulfilled, (state, action) => {
        state.isLoadingMore = false;
        const payload = action.payload?.data || action.payload;
        if (state.recipes?.hits && payload?.hits) {
          state.recipes = {
            ...state.recipes,
            ...payload,
            hits: [...state.recipes.hits, ...payload.hits]
          };
        } else if (payload) {
          state.recipes = payload;
        }
      })
      .addCase(getMoreRecipes.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.recipesError = action.payload;
      })
      .addCase(getFoodPreferences.pending, (state) => {
        state.foodPreferencesLoading = LoadingStatus.LOADING;
      })
      .addCase(getFoodPreferences.fulfilled, (state, action) => {
        state.foodPreferencesLoading = LoadingStatus.LOADED;
        state.foodPreferences = action.payload;
      })
      .addCase(getFoodPreferences.rejected, (state, action) => {
        state.foodPreferencesLoading = LoadingStatus.FAILED;
        state.foodPreferencesError = action.payload;
      })
      .addCase(addFoodPreferences.pending, (state) => {
        state.foodPreferencesLoading = LoadingStatus.LOADING;
      })
      .addCase(addFoodPreferences.fulfilled, (state, action) => {
        state.foodPreferencesLoading = LoadingStatus.LOADED;
      })
      .addCase(addFoodPreferences.rejected, (state, action) => {
        state.foodPreferencesLoading = LoadingStatus.FAILED;
        state.foodPreferencesError = action.payload;
      })
      .addCase(getNutritionTypes.pending, (state) => {
        state.nutritionTypesLoading = LoadingStatus.LOADING;
      })
      .addCase(getNutritionTypes.fulfilled, (state, action) => {
        state.nutritionTypesLoading = LoadingStatus.LOADED;
        state.nutritionTypes = action.payload;
      })
      .addCase(getNutritionTypes.rejected, (state, action) => {
        state.nutritionTypesLoading = LoadingStatus.FAILED;
        state.nutritionTypesError = action.payload;
      })
      .addCase(getShoppingListItems.pending, (state) => {
        state.shoppingListItemsLoading = LoadingStatus.LOADING;
      })
      .addCase(getShoppingListItems.fulfilled, (state, action) => {
        state.shoppingListItemsLoading = LoadingStatus.LOADED;
        state.shoppingListItems = action.payload;
      })
      .addCase(getShoppingListItems.rejected, (state, action) => {
        state.shoppingListItemsLoading = LoadingStatus.FAILED;
        state.shoppingListItemsError = action.payload;
      })
      .addCase(deleteShoppingList.fulfilled, (state, action) => {
        if (state.shoppingLists?.data) {
          state.shoppingLists.data = state.shoppingLists.data.filter(list => list.id !== action.payload.id);
        }
      })
      .addCase(getFamilyNutrition.pending, (state) => {
        state.familyNutritionLoading = LoadingStatus.LOADING;
      })
      .addCase(getFamilyNutrition.fulfilled, (state, action) => {
        state.familyNutritionLoading = LoadingStatus.LOADED;
        state.familyNutrition = action.payload;
      })
      .addCase(getFamilyNutrition.rejected, (state, action) => {
        state.familyNutritionLoading = LoadingStatus.FAILED;
        state.familyNutritionError = action.payload;
      })
      .addCase(updateShoppingListMeals.pending, (state) => {
        state.updateShoppingListMealsLoading = LoadingStatus.LOADING;
      })
      .addCase(updateShoppingListMeals.fulfilled, (state, action) => {
        state.updateShoppingListMealsLoading = LoadingStatus.LOADED;
      })
      .addCase(updateShoppingListMeals.rejected, (state, action) => {
        state.updateShoppingListMealsLoading = LoadingStatus.FAILED;
        state.updateShoppingListMealsError = action.payload;
      })
      .addCase(getShoppinglistMeals.pending, (state) => {
        state.recipesLoading = LoadingStatus.LOADING;
      })
      .addCase(getShoppinglistMeals.fulfilled, (state, action) => {
        state.recipesLoading = LoadingStatus.LOADED;
        state.recipes = action.payload;
      })
      .addCase(getShoppinglistMeals.rejected, (state, action) => {
        state.recipesLoading = LoadingStatus.FAILED;
        state.recipesError = action.payload;
      })
      .addCase(getSavedRecipes.pending, (state) => {
        state.recipesLoading = LoadingStatus.LOADING;
      })
      .addCase(getSavedRecipes.fulfilled, (state, action) => {
        state.recipesLoading = LoadingStatus.LOADED;
        state.recipes = action.payload;
      })
      .addCase(getSavedRecipes.rejected, (state, action) => {
        state.recipesLoading = LoadingStatus.FAILED;
        state.recipesError = action.payload;
      })
      .addCase(getMyMeals.pending, (state) => {
        state.recipesLoading = LoadingStatus.LOADING;
      })
      .addCase(getMyMeals.fulfilled, (state, action) => {
        state.recipesLoading = LoadingStatus.LOADED;
        state.recipes = action.payload;
      })
      .addCase(getMyMeals.rejected, (state, action) => {
        state.recipesLoading = LoadingStatus.FAILED;
        state.recipesError = action.payload;
      })
      .addCase(getTodayNutritionLogs.pending, (state) => {
        state.todayNutritionLogsLoading = LoadingStatus.LOADING;
      })
      .addCase(getTodayNutritionLogs.fulfilled, (state, action) => {
        state.todayNutritionLogsLoading = LoadingStatus.LOADED;
        state.todayNutritionLogs = action.payload;
      })
      .addCase(getTodayNutritionLogs.rejected, (state, action) => {
        state.todayNutritionLogsLoading = LoadingStatus.FAILED;
        state.todayNutritionLogsError = action.payload;
      });
  },
});

export const {
  resetSliceState,
} = reduxSlice.actions;

export const homeReducer = reduxSlice.reducer;
