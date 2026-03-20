// Web stub for axiosRequest — breaks the circular dependency:
// auth.slice → auth.action → axiosRequest → store/auth.slice
// by lazy-loading store and userLogout inside function bodies, not at module init time.
import axios from 'axios';
import { API } from '../src/helper/config';
import SharedPreference from '../src/helper/SharedPreference';
import { Alert } from 'react-native';

const axiosRequest = axios.create({
  baseURL: API.BASE_URL,
});

let isLogoutDispatching = false;

// Lazy getters — evaluated at runtime (not at import/init time), breaking the circular dep
function getStore() { return require('../store').default || require('../store'); }
function getUserLogout() { return require('../store/auth/auth.slice').userLogout; }

axiosRequest.interceptors.response.use(
  response => {
    console.log('Response=======>', JSON.stringify(response.data));
    return response.data;
  },
  error => {
    console.log('Error interceptor =======>', error?.response?.status, error.response);
    if (error?.response?.status === 401 && !error?.config?.url?.includes('login')) {
      if (!isLogoutDispatching) {
        isLogoutDispatching = true;
        console.log('Unauthorized access detected, logging out...');
        getStore().dispatch({ type: 'USER_LOGOUT' });
        SharedPreference.multiRemove([
          SharedPreference.keys.IS_AUTHENTICATE,
          SharedPreference.keys.TOKEN,
          SharedPreference.keys.USER_DATA,
          SharedPreference.keys.USER_ID,
        ]);
        Alert.alert(
          'Session Expired',
          'For your security, you have been logged out because your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => { isLogoutDispatching = false; } }]
        );
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

axiosRequest.interceptors.request.use(
  async config => {
    const token = await SharedPreference.getItem('@token', '');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log('Config==', JSON.stringify(config));
    return config;
  },
  error => Promise.reject(error)
);

export default axiosRequest;
