import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import CustomButton from '../../components/CustomButton';
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon';
import { colors } from '../../resources/colors';
import {
  moderateScale,
  moderateScaleVertical,
  textScale,
} from '../../helper/responsiveSize';
import NavigationService from '../../navigation/NavigationService';
import { RouteName } from '../../helper/strings';

const AccountReady = ({ navigation }) => {
  const BenefitCard = ({ title, sub, icon, iconBg, borderCol }) => (
    <View style={[styles.card, { borderColor: borderCol }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <CustomIcon
          origin={ICON_TYPE.IONICONS}
          name={icon}
          size={24}
          color={colors.white}
        />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
    </View>
  );

  return (
    <WrapperContainer>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <View
            style={{
              padding: moderateScale(10),
              backgroundColor: '#10B981',

              width: moderateScale(130),
              justifyContent: 'center',
              alignItems: 'center',
              height: moderateScale(130),
              borderRadius: 80,
            }}
          >
            <View style={styles.successCircle}>
              <CustomIcon
                origin={ICON_TYPE.IONICONS}
                name="checkmark"
                size={60}
                color={colors.white}
              />
            </View>
          </View>
          <Text style={styles.mainTitle}>You're all set!</Text>
          <Text style={styles.mainSub}>
            Let's create your first shopping list
          </Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          <BenefitCard
            title="Create lists in seconds"
            sub="Quick and easy list creation to save your time"
            icon="flash"
            iconBg="#10B981"
            borderCol="#22C55E"
          />
          <BenefitCard
            title="Stay within budget"
            sub="Track spending and never overspend again"
            icon="wallet"
            iconBg="#FF7043"
            borderCol="#FACC15"
          />
          <BenefitCard
            title="Meet nutrition goals"
            sub="Smart suggestions for healthier choices"
            icon="heart"
            iconBg="#10B981"
            borderCol="#22C55E"
          />
        </View>

        <View style={styles.footer}>
          <CustomButton
            title="Create My First List"
            useGradient={true}
            onPress={() => NavigationService.navigate(RouteName.LOGIN)}
          />

          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => NavigationService.navigate(RouteName.LOGIN)}
          >
            <Text style={styles.exploreText}>Explore the app</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </WrapperContainer>
  );
};

export default AccountReady;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScaleVertical(30),
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginTop: moderateScaleVertical(40),
    marginBottom: moderateScaleVertical(30),
  },
  successCircle: {
    width: moderateScale(115),
    height: moderateScale(115),
    borderRadius: 60,
    backgroundColor: '#28C76F',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for the circle
    elevation: 10,
    shadowColor: '#28C76F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  mainTitle: {
    fontSize: textScale(28),
    fontWeight: '800',
    color: '#1A1C1E',
    marginTop: moderateScaleVertical(25),
  },
  mainSub: {
    fontSize: textScale(16),
    color: '#6B7280',
    marginTop: moderateScaleVertical(10),
  },
  benefitsContainer: {
    width: '100%',
    marginVertical: moderateScaleVertical(10),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderWidth: 0.8,
    borderRadius: 16,
    marginBottom: moderateScaleVertical(16),
    backgroundColor: colors.white,
  },
  iconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    marginLeft: moderateScale(16),
    flex: 1,
  },
  cardTitle: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#1A1C1E',
  },
  cardSub: {
    fontSize: textScale(13),
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    width: '100%',
    marginTop: moderateScaleVertical(20),
  },
  exploreBtn: {
    width: '100%',
    height: moderateScaleVertical(54),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScaleVertical(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  exploreText: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: '#1A1C1E',
  },
});
