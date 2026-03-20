import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosRequest from '../../src/helper/axiosRequest';
import SharedPreference from '../../src/helper/SharedPreference';
export const stayLoginAction = createAsyncThunk(
  'auth/stayLoginAction',
  async (params, thunkAPI) => {
    try {
      let response = await SharedPreference.getItem(
        SharedPreference.keys.IS_AUTHENTICATE,
        'false',
      );
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const signUpAction = createAsyncThunk(
  'auth/signUpAction',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'register',
        method: 'POST',
        data: params,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const signInAction = createAsyncThunk(
  'auth/signInAction',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'login',
        method: 'POST',
        data: params,
      });
      console.log('signInAction Resp===>>', response);
      
      SharedPreference.setItem(
        SharedPreference.keys.TOKEN,
        response?.access_token,
      );
      SharedPreference.setItem(SharedPreference.keys.IS_AUTHENTICATE, 'true');
      // SharedPreference.setItem(SharedPreference.keys.USER_ID, response?.data?.id)
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const signInActionForToken = createAsyncThunk(
  'auth/signInActionForToken',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'login',
        method: 'POST',
        data: params,
      });
      console.log('signInActionForToken Resp===>>', response);
      
    SharedPreference.setItem(
        SharedPreference.keys.TOKEN,
        response?.access_token,
      );
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const userAccountAction = createAsyncThunk(
  'auth/userAccountAction',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'user-profile',
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

export const logoutAction = createAsyncThunk(
  'auth/logoutAction',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'logout',
        method: 'POST',
      });
      const res = await SharedPreference.multiRemove([
        SharedPreference.keys.IS_AUTHENTICATE,
        SharedPreference.keys.TOKEN,
      ]);
      
      console.log('resfdvd', response);
      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);

export const deviceDetails = createAsyncThunk(
  'auth/deviceDetails', async(params,thunkAPI) =>{
     try {
      const response = await axiosRequest({
        url: 'save_device_details',
        method: 'POST',
        data:params
      });

      console.log('deviceResp--->>', response);
      return response.data
    
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  }
)

export const sendVerificationCodeAction = createAsyncThunk(
  'auth/sendVerificationCodeAction',
  async (params, thunkAPI) => {
    try {
      const response = await axiosRequest({
        url: 'send-verification-code',
        method: 'POST',
        data: params,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response ? error.response?.data : error?.message,
      );
    }
  },
);
