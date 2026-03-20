import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = {
  IS_AUTHENTICATE: '@isAuthenticate',
  TOKEN: '@token',
  USER_DATA:'@userData',
  DEVICE_TOKEN: '@deviceToken',
  USER_ID:'@userId'

};
const getItem = async (key, value) => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (data != null) {
      return data;
    } else {
      setItem(key, value);
      return value;                                                                           
    }
  } catch (error) {
    console.log('AsyncStorage:GetItem', error);  
  }

  return '';
};

const setDefaultItem = async (key, value) => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (data === null) {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.log('AsyncStorage:setDefaultItem', error);
  }
};

const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log('AsyncStorage:SetItem', error);
  }
};

const removeItem = async key => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log('AsyncStorage:RemoveItem', error);
  }
};

const getAllKeys = async () => {
  let keys = [];
  try {
    keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.log('AsyncStorage:GetAllKeys', error);
  }
};

const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.log('AsyncStorage:ClearAllData', error);
  }
};

//values - [ ['@MyApp_user', 'myUserValue'], ['@MyApp_key', 'myKeyValue'] ]
const multiSet = async values => {
  try {
    await AsyncStorage.multiSet(values);
  } catch (error) {
    console.log('AsyncStorage:MultiSet', error);
  }
};

//keys - ['@MyApp_USER_1', '@MyApp_USER_2']
const multiRemove = async keys => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.log('AsyncStorage:MultiRemove', error);
  }
};

const SharedPreference = {
  getItem,
  setItem,
  setDefaultItem,
  removeItem,
  getAllKeys,
  multiSet,
  multiRemove,
  clearAllData,
  keys,
};
export default SharedPreference;
