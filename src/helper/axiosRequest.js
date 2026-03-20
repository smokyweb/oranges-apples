import axios from 'axios';
import { API } from './config';
import SharedPreference from './SharedPreference';
import store from '../../store';
import { Alert } from 'react-native';
import { userLogout } from '../../store/auth/auth.slice';

const axiosRequest = axios.create({
  baseURL: API.BASE_URL,
});

//All response from axios
let isLogoutDispatching = false;

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

        // Immediate store reset to clear authentication state
        store.dispatch({ type: 'USER_LOGOUT' });

        // Clear sensitive data from storage
        SharedPreference.multiRemove([
          SharedPreference.keys.IS_AUTHENTICATE,
          SharedPreference.keys.TOKEN,
          SharedPreference.keys.USER_DATA,
          SharedPreference.keys.USER_ID
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
  },
);

// All request from axios
axiosRequest.interceptors.request.use(
  async config => {
    const token = await SharedPreference.getItem('@token', '');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Config==', JSON.stringify(config));
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export default axiosRequest;
