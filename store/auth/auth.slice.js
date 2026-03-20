import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import { logoutAction, sendVerificationCodeAction, signInAction, signUpAction, stayLoginAction, userAccountAction } from "./auth.action";
import { LoadingStatus } from '../../src/helper/strings';

const SLICE_FEATURE_KEY = 'auth';

// Create entity adapter
const entityAdapter = createEntityAdapter();

const initialState = entityAdapter.getInitialState({
  isAuthenticated: false,
  token: null,
    userAccountLoadingStatus: LoadingStatus.NOT_LOADED,
  userAccountError: null,
  userAccount: null,

  signUpLoadingStatus:LoadingStatus.NOT_LOADED,
  signUpError:null,
  signInLoadingStatus: LoadingStatus.NOT_LOADED,
  signInError:null,

  logoutLoadingStatus:LoadingStatus.NOT_LOADED,
  logoutError:null,
  
  sendVerificationCodeLoadingStatus: LoadingStatus.NOT_LOADED,
  sendVerificationCodeError: null,
  
  showAlert:true
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
    onSourceOfInput: (state, action) => {
      console.log('fghjkl===>>>', action.payload);
      state.sourcesOfInputData = action.payload;
    },
        userLogout: (state) => {
      state.isAuthenticated = false;
    },
    hideAlert: (state) => {
      state.showAlert = false;
      state.alertMessage = '';
    },
    
  },
    extraReducers: builder => {
    builder
      .addCase(stayLoginAction.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload === 'true'; 
      })
      .addCase(userAccountAction.pending, state => {
        state.userAccountLoadingStatus = LoadingStatus.LOADING;
      })
      .addCase(userAccountAction.fulfilled, (state,action) => {
        state.userAccountLoadingStatus = LoadingStatus.LOADED;
        state.userAccount = action.payload
       
      })
      .addCase(userAccountAction.rejected, (state, action) => {
        state.userAccountLoadingStatus = LoadingStatus.FAILED;
        state.userAccountError = action.payload;
      })

            .addCase(signUpAction.pending, state => {
        state.signUpLoadingStatus = LoadingStatus.LOADING;
      })
      .addCase(signUpAction.fulfilled, (state,action) => {
        state.signUpLoadingStatus = LoadingStatus.LOADED;
  
      })
      .addCase(signUpAction.rejected, (state, action) => {
        state.signUpLoadingStatus = LoadingStatus.FAILED;
        state.signUpError = action.payload;
      })


            .addCase(signInAction.pending, state => {
        state.signInLoadingStatus = LoadingStatus.LOADING;
      })
      .addCase(signInAction.fulfilled, (state,action) => {
        state.signInLoadingStatus = LoadingStatus.LOADED;
     state.isAuthenticated = true;
      })
      .addCase(signInAction.rejected, (state, action) => {
        state.signInLoadingStatus = LoadingStatus.FAILED;
        state.signInError = action.payload;
      })

         .addCase(logoutAction.pending, state => {
        state.logoutLoadingStatus = LoadingStatus.LOADING;
      })
      .addCase(logoutAction.fulfilled, state => {
        state.logoutLoadingStatus = LoadingStatus.LOADED;
        state.isAuthenticated = false;
      })
      .addCase(logoutAction.rejected, (state, action) => {
        state.logoutLoadingStatus = LoadingStatus.FAILED;
        state.logoutError = action.payload;
      })
      
      .addCase(sendVerificationCodeAction.pending, state => {
        state.sendVerificationCodeLoadingStatus = LoadingStatus.LOADING;
      })
      .addCase(sendVerificationCodeAction.fulfilled, state => {
        state.sendVerificationCodeLoadingStatus = LoadingStatus.LOADED;
      })
      .addCase(sendVerificationCodeAction.rejected, (state, action) => {
        state.sendVerificationCodeLoadingStatus = LoadingStatus.FAILED;
        state.sendVerificationCodeError = action.payload;
      })
    }

});

export const {
  resetSliceState,
  onSourceOfInput,
  userLogout, hideAlert
} = reduxSlice.actions;

export const authReducer = reduxSlice.reducer;
