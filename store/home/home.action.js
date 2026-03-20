import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosRequest from '../../src/helper/axiosRequest';



export const getPageData = createAsyncThunk(
  'home/getPageData',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'getPagesByUrl',
        method: 'GET',
        params: params,
        signal: thunkAPI.signal,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const addFamilyMember = createAsyncThunk(
  'home/addFamilyMember',
  async (memberData, thunkAPI) => {
    try {
      const formData = new FormData();

      if (memberData.profileImage) {
        formData.append('profile_image', {
          uri: memberData.profileImage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      }

      formData.append('name', memberData.name);
      formData.append('gender', memberData.sex);
      formData.append('age', memberData.age.toString());
      formData.append('height_feet', memberData.heightFeet || '');
      formData.append('height_inches', memberData.heightInches || '');
      formData.append('weight', memberData.weight || '');
      formData.append('physical_activity_level', memberData.activityLevel);

      memberData.allergies.forEach(allergy => {
        formData.append('allergies[]', allergy);
      });

      const response = await axiosRequest({
        url: 'family-members',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const deleteFamilyMember = createAsyncThunk(
  'home/deleteFamilyMember',
  async (memberId, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: `family-members/${memberId}?_method=delete`,
        method: 'POST',

      });
      return memberId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getFamilyMembers = createAsyncThunk(
  'home/getFamilyMembers',
  async (_, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'family-members',
        method: 'GET',
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getPageContent = createAsyncThunk(
  'home/getPageContent',
  async (pageUrl, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'get_page_content',
        method: 'GET',
        params: { page_url: pageUrl },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

// Global map to track abort controllers for singleton thunks
const activeControllers = {};

const abortAndTrack = (key) => {
  if (activeControllers[key]) {
    activeControllers[key].abort();
  }
  activeControllers[key] = new AbortController();
  return activeControllers[key].signal;
};

export const getRecipes = createAsyncThunk(
  'home/getRecipes',
  async (query = 'All', thunkAPI) => {
    const signal = abortAndTrack('getRecipes');
    try {
      const response = await axiosRequest({
        url: 'recipes',
        method: 'GET',
        params: { query },
        signal: signal,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);


export const getShoppinglistMeals = createAsyncThunk(
  'home/getShoppinglistMeals',
  async (listId, thunkAPI) => {
    const signal = abortAndTrack('getShoppinglistMeals');
    try {
      const response = await axiosRequest({
        url: `get-shopping-list-meals?shopping_list_id=${listId}`,
        method: 'GET',
        signal: signal,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const updateShoppingList = createAsyncThunk(
  'home/updateShoppingList',
  async (listData, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'update-shopping-list',
        method: 'POST',
        data: listData,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getShoppingLists = createAsyncThunk(
  'home/getShoppingLists',
  async (_, thunkAPI) => {
    const signal = abortAndTrack('getShoppingLists');
    try {
      const response = await axiosRequest({
        url: 'shopping-lists',
        method: 'GET',
        signal: signal,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getFoodPreferences = createAsyncThunk(
  'home/getFoodPreferences',
  async (_, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: '/get-food-preferences',
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const addFoodPreferences = createAsyncThunk(
  'home/addFoodPreferences',
  async (preferencesData, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: '/add-food-preferences',
        method: 'POST',
        data: preferencesData,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getMoreRecipes = createAsyncThunk(
  'home/getMoreRecipes',
  async (nextUrl, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: '/recipes/next',
        method: 'POST',
        data: { next_url: nextUrl },
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const appSetting = createAsyncThunk(
  'home/appSetting',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'getAppSettingData',
        method: 'GET',

      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getNutritionTypes = createAsyncThunk(
  'home/getNutritionTypes',
  async (_, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'get-nutrition-types',
        method: 'GET',
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getWalmartPrice = createAsyncThunk(
  'home/getWalmartPrice',
  async (params, thunkAPI) => {
    try {
      const { query, page = 1 } = typeof params === 'string' ? { query: params } : params;
      const response = await axiosRequest({
        url: `walmart/product-search`,
        method: 'GET',
        params: { query, page },
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getKrogerPrice = createAsyncThunk(
  'home/getKrogerPrice',
  async (params, thunkAPI) => {
    try {
      const { query, limit = 10 } = typeof params === 'string' ? { query: params } : params;
      const response = await axiosRequest({
        url: `kroger/products`,
        method: 'GET',
        params: { query, limit },
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const addShoppingListItem = createAsyncThunk(
  'home/addShoppingListItem',
  async (data, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'add-shopping-list-item',
        method: 'POST',
        data,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getShoppingListItems = createAsyncThunk(
  'home/getShoppingListItems',
  async (shoppingListId, thunkAPI) => {
    const signal = abortAndTrack('getShoppingListItems');
    try {
      const response = await axiosRequest({
        url: 'shopping-list-items',
        method: 'GET',
        params: { shopping_list_id: shoppingListId },
        signal: signal,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const deleteShoppingList = createAsyncThunk(
  'home/deleteShoppingList',
  async (id, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: `shopping-lists/${id}`,
        method: 'POST',
        data: { _method: 'delete' },
      });
      return { id, response };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getFamilyNutrition = createAsyncThunk(
  'home/getFamilyNutrition',
  async (_, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'family-nutrition',
        method: 'GET',
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const updateShoppingListMeals = createAsyncThunk(
  'home/updateShoppingListMeals',
  async (data, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'update-shopping-list-meals',
        method: 'POST',
        data,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getSavedRecipes = createAsyncThunk(
  'home/getSavedRecipes',
  async (_, thunkAPI) => {
    const signal = abortAndTrack('getSavedRecipes');
    try {
      const response = await axiosRequest({
        url: 'get-favorite-recipes',
        method: 'GET',
        signal: signal,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getTodayNutritionLogs = createAsyncThunk(
  'home/getTodayNutritionLogs',
  async (_, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'get-today-nutrition-logs',
        method: 'GET',
      });
      console.log({ response })
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const getMyMeals = createAsyncThunk(
  'home/getMyMeals',
  async (_, thunkAPI) => {
    const signal = abortAndTrack('getMyMeals');
    try {
      const response = await axiosRequest({
        url: 'get-my-meals',
        method: 'GET',
        signal: signal,
      });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);