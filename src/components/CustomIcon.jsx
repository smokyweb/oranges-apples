import React from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/Zocial';
export const ICON_TYPE = {
  ANT_ICON: 'AntDesign',
  ENTYPO: 'Entypo',
  FEATHER_ICONS: 'Feather',
  FONT_AWESOME: 'FontAwesome',
  FONT_AWESOME5: 'FontAwesome5',
  FONT_AWESOME5_BRANDS: 'FontAwesome5Brands',
  FONTISTO: 'Fontisto',
  FOUNDATION: 'Foundation',
  IONICONS: 'Ionicons',
  MATERIAL_COMMUNITY: 'MaterialCommunityIcons',
  MATERIAL_ICONS: 'MaterialIcons',
  OCTICONS: 'Octicons',
  SIMPLE_LINE_ICONS: 'SimpleLineIcons',
  ZOCIAL: 'Zocial',
};

const CustomIcon = ({origin, name, color, size, paddingLeft, style}) => {
  let colorx = color || '#aaaaaa';
  let sizex = size || 24;
  let namex = name || 'right';
  let paddingx = paddingLeft || null;

  let Element = Ionicons;

  switch (origin) {
    case ICON_TYPE.ANT_ICON:
      Element = AntDesign;
      break;

    case ICON_TYPE.ENTYPO:
      Element = Entypo;
      break;

    case ICON_TYPE.FEATHER_ICONS:
      Element = Feather;
      break;

    case ICON_TYPE.FONT_AWESOME5:
      Element = FontAwesome5;
      break;

    case ICON_TYPE.FONT_AWESOME:
      Element = FontAwesome;
      break;

    case ICON_TYPE.FONT_AWESOME5_BRANDS:
      Element = FontAwesome5Pro;
      break;

    case ICON_TYPE.FONTISTO:
      Element = Fontisto;
      break;

    case ICON_TYPE.FOUNDATION:
      Element = Foundation;
      break;

    case ICON_TYPE.IONICONS:
      Element = Ionicons;
      break;

    case ICON_TYPE.MATERIAL_ICONS:
      Element = MaterialIcons;
      break;

    case ICON_TYPE.MATERIAL_COMMUNITY:
      Element = MaterialCommunityIcons;
      break;

    case ICON_TYPE.OCTICONS:
      Element = Octicons;
      break;

    case ICON_TYPE.SIMPLE_LINE_ICONS:
      Element = SimpleLineIcons;
      break;

    case ICON_TYPE.ZOCIAL:
      Element = Zocial;
      break;

    default:
      Element = Ionicons;
      break;
  }

  return (
    <Element
      name={namex}
      size={sizex}
      color={colorx}
      style={[{paddingLeft: paddingx}, style]}
    />
  );
};

export default CustomIcon;
