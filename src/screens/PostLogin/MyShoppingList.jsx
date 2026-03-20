import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import React from 'react'
import WrapperContainer from '../../components/WrapperContainer'
import Header from '../../components/Header'
import CustomIcon, { ICON_TYPE } from '../../components/CustomIcon'
import { textScale, moderateScale } from '../../helper/responsiveSize'
import { colors } from '../../resources/colors'
import { RouteName } from '../../helper/strings'
import NavigationService from '../../navigation/NavigationService'
import { useDispatch, useSelector } from 'react-redux'
import { getShoppingLists } from '../../../store/home/home.action'

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const MyShoppingList = () => {
  const dispatch = useDispatch();
  const { shoppingLists } = useSelector(store => store.homeReducer);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await dispatch(getShoppingLists());
    setRefreshing(false);
  }, [dispatch]);

  console.log('shoppingLists data ===>>>', JSON.stringify(shoppingLists));

  const ListItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => NavigationService.navigate(RouteName.LIST_DETAILS, { listData: item })}
    >
      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{item.name}</Text>
        <Text style={styles.listCreated}>Created: {formatDate(item.created_at)}</Text>
        <View style={styles.listDetails}>
          <Text style={styles.listBudget}>$ {item.budget}</Text>
          <Text style={styles.listDuration}>• {item.timeline} days</Text>
        </View>
        {/* <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
          <Text style={[styles.statusText,{color:item?.textColor}]}>{item.status}</Text>
        </View> */}
      </View>
      <CustomIcon
        origin={ICON_TYPE.IONICONS}
        name="chevron-forward"
        size={20}
        color={colors.grey}
      />
    </TouchableOpacity>
  )

  return (
    <WrapperContainer>
      <Header title="My Shopping Lists"
        onBackPress={() => NavigationService.goBack()} />

      <FlatList
        data={shoppingLists?.data || []}
        renderItem={({ item }) => <ListItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </WrapperContainer>
  )
}

export default MyShoppingList

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: textScale(16),
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
    textTransform: 'capitalize'
  },
  listCreated: {
    fontSize: textScale(12),
    color: colors.grey,
    marginBottom: 8,
  },
  listDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listBudget: {
    fontSize: textScale(14),
    fontWeight: '600',
    color: colors.black,
  },
  listDuration: {
    fontSize: textScale(14),
    color: colors.grey,
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: textScale(10),
    fontWeight: '600',
    color: 'white',
  },
})