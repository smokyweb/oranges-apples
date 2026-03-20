import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {authReducer} from './auth/auth.slice';
import {homeReducer} from './home/home.slice';
import SharedPreference from '../src/helper/SharedPreference';

const combinedReducer = combineReducers({
  authReducer,
  homeReducer,
});

const rootReducers = (state, action) => {
  if (action?.type === 'USER_LOGOUT') {
    console.log('401 Unauth');
    // SharedPreference.clearAllData();
    SharedPreference.multiRemove([
      SharedPreference.keys.IS_AUTHENTICATE,
      SharedPreference.keys.TOKEN,
    ]);

    state = undefined;
  }

  return combinedReducer(state, action);
};

const store = configureStore({
  reducer: rootReducers,
});
export default store;
