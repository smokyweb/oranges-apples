import { useDispatch } from 'react-redux';
import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { images } from '../../resources/images';
import LinearGradient from 'react-native-linear-gradient';
import SharedPreference from '../../helper/SharedPreference';
import { stayLoginAction, userAccountAction } from '../../../store/auth/auth.action';

const SplashScreen = ({ navigation }) => {

  const dispatch = useDispatch();

      useEffect(()=>{
userDetails()
  },[])

  async function userDetails() {
    const userToken = await SharedPreference.getItem(
      SharedPreference.keys.TOKEN,
      '',
    );
    console.log('UserToken=====>>>', userToken)
    if (userToken) {
      dispatch(stayLoginAction());
      dispatch(userAccountAction());
    }
  }

  return (
    <View style={styles.logoContainer}>
      <Image
        source={images.logoo}
        style={{
          height: '50%',
          width: '100%',
          resizeMode:'contain'
          
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#1F5638'
  },
  gradientBackground: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
      backgroundColor:'#1F5638'
  },
  crowdText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  compassText: {
    color: '#8A56AC',
  },
});

export default SplashScreen;
