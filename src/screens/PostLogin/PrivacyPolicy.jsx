import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native'
import React, { useEffect } from 'react'
import { WebView } from 'react-native-webview'
import { useDispatch, useSelector } from 'react-redux'
import { getPageContent } from '../../../store/home/home.action'
import { LoadingStatus } from '../../helper/strings'
import WrapperContainer from '../../components/WrapperContainer'
import Header from '../../components/Header'
import NavigationService from '../../navigation/NavigationService'
import { textScale, width } from '../../helper/responsiveSize'
import { colors } from '../../resources/colors'

const PrivacyPolicy = () => {
  const dispatch = useDispatch();
  const { pageContent, pageContentLoading } = useSelector(state => state.homeReducer);
  console.log('PageContent===>>', pageContent)
  
  useEffect(() => {
    dispatch(getPageContent('privacy-policy'));
  }, [dispatch]);


  const htmlContent = `
    <meta name="viewport" content="width=${width}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      body {
        margin: 0; 
        font-family: Arial, sans-serif;
        font-size: ${
          Platform.OS === 'ios' ? textScale(12) : textScale(6)
        }px; / Increase the base font size /
        line-height: 24px;
        padding: 20;
   
       
        
      }
           img {
        width: 100%;
        height: auto;
        margin-horizontal:20;
        border-radius:20;
      }
      ul{
        padding-left: 5px;
      }
      li{
        margin-bottom: 14px;
        padding-left: 00px;
      }
      p {
        font-size: ${
          Platform.OS === 'ios' ? textScale(16) : textScale(14)
        }px; / Increase font size for paragraphs /
        line-height: 24px;
             
             font-weight:400
      }
      h1, h2, h3, h4, h5, h6 {
        fontSize: ${Platform.OS === 'ios' ? textScale(8) : textScale(5)}
             color:#fff
      }
    
      video{
        width:100%;
        margin-bottom: 20px;
      }
      ppb_view_technical_gear{
      width: 100px; 
      height: 50px;
      }  
    </style>
   
    ${pageContent?.content}  
  
  `;
  
  return (
    <WrapperContainer>
      <Header title="Privacy Policy" onBackPress={() => NavigationService.goBack()} />
      {pageContentLoading === LoadingStatus.LOADING ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#28C76F" />
        </View>
      ) : pageContent ? (
        <WebView
          source={{ html:htmlContent }}
          style={styles.webview}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.loaderContainer}>
          <Text>No content available</Text>
        </View>
      )}
    </WrapperContainer>
  )
}

export default PrivacyPolicy

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: textScale(14),
    color: colors.textColor || '#666',
  },
})