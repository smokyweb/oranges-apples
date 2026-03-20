import React from 'react';
import { Text } from 'react-native';

// Glyph codepoint maps per font family
const GLYPH_MAPS = {
  Feather: {
    'mail': 61846, 'lock': 61843, 'eye': 61795, 'eye-off': 61796,
    'search': 61904, 'user': 61956, 'home': 61828,
    'chevron-right': 61744, 'chevron-left': 61743,
    'chevron-down': 61742, 'chevron-up': 61745,
    'x': 61973, 'check': 61739, 'plus': 61888, 'minus': 61859,
    'trash-2': 61941, 'edit': 61791, 'edit-2': 61792, 'edit-3': 61793, 'settings': 61907,
    'arrow-left': 61712, 'arrow-right': 61714,
    'refresh-cw': 61896, 'filter': 61806, 'grid': 61821, 'list': 61841,
    'camera': 61727, 'image': 61830, 'info': 61833, 'alert-circle': 61700,
    'log-out': 61845, 'bell': 61718, 'heart': 61822, 'star': 61924,
    'shopping-cart': 61910, 'package': 61879, 'truck': 61942,
    'user-plus': 61960, 'phone': 61884, 'map-pin': 61850,
  },
  Ionicons: {
    'home': 60547, 'home-outline': 60548,
    'person': 60838, 'person-outline': 60845,
    'eye': 60391, 'eye-off': 60392, 'eye-off-outline': 60393,
    'checkbox': 60187, 'square-outline': 61076,
    'close': 60235, 'close-circle': 60236,
    'log-out': 60625, 'log-out-outline': 60626,
    'cart': 60163, 'cart-outline': 60164,
    'search': 61024, 'search-outline': 61028,
    'chevron-back': 60202, 'chevron-forward': 60220,
    'add': 59908, 'add-circle': 59909,
    'trash': 61171, 'trash-outline': 61175,
    'create-outline': 60308,
    'notifications': 60790, 'notifications-outline': 60800,
    'settings-outline': 61037,
    'heart': 60523, 'heart-outline': 60536,
    'star': 61078, 'star-outline': 61082,
    'arrow-back': 59944, 'arrow-forward': 59956,
    'refresh': 60949,
    'nutrition': 60771, 'restaurant': 60969,
    'list': 60619, 'grid': 60481,
    'camera': 60148, 'image': 60561,
    'information-circle': 60569, 'information-circle-outline': 60570,
    'alert-circle': 59920, 'alert-circle-outline': 59921,
    'checkmark': 60198, 'checkmark-circle': 60199,
    'filter': 60432, 'menu': 60668,
    'mail': 60721, 'mail-outline': 60725,
    'help-circle': 60542, 'help-circle-outline': 60543,
    'help': 60538,
    'newspaper': 60787, 'newspaper-outline': 60788,
    'shield-checkmark': 61049, 'shield-checkmark-outline': 61050,
    'document-text': 60340, 'document-text-outline': 60341,
    'people': 60829, 'people-outline': 60836,
    'wallet': 61211, 'wallet-outline': 61212,
    'bar-chart': 59980, 'bar-chart-outline': 59981,
    'pie-chart': 60848, 'pie-chart-outline': 60849,
    'location': 60621, 'location-outline': 60622,
    'call': 60145, 'call-outline': 60146,
    'chatbubble': 60176, 'chatbubble-outline': 60177,
    'bookmark': 60050, 'bookmark-outline': 60051,
    'calendar': 60131, 'calendar-outline': 60132,
    'time': 61155, 'time-outline': 61156,
    'lock-closed': 60629, 'lock-closed-outline': 60630,
    'lock-open': 60631, 'lock-open-outline': 60632,
  },
  MaterialCommunityIcons: {
    'silverware-fork-knife': 985712, 'silverware': 984227, 'food': 983642,
    'food-apple': 983765, 'food-variant': 983769,
    'home': 984877, 'home-outline': 984878,
    'account': 983040, 'account-outline': 983079,
    'magnify': 984444, 'close': 984144, 'plus': 985449, 'minus': 984536,
    'trash-can': 987009, 'trash-can-outline': 987010,
    'pencil': 985361, 'cog': 984143, 'cog-outline': 986989,
    'heart': 984391, 'heart-outline': 984396, 'star': 986613, 'star-outline': 986616,
    'cart': 984015, 'cart-outline': 986818,
    'bell': 983966, 'bell-outline': 983969,
    'arrow-left': 983742, 'arrow-right': 983747,
    'chevron-right': 984138, 'chevron-left': 984136,
    'chevron-down': 984135, 'chevron-up': 984139,
    'dots-three-horizontal': 985412,
    'dots-vertical': 985422, 'menu': 984532,
    'information': 984504, 'information-outline': 984505,
    'alert-circle': 983524, 'alert-circle-outline': 983525,
    'check': 984065, 'check-circle': 984067, 'check-circle-outline': 984068,
    'filter': 983779, 'filter-outline': 987266,
    'refresh': 985655, 'camera': 984012, 'image': 984476,
    'email': 983568, 'email-outline': 983569,
    'lock': 984428, 'lock-outline': 984432,
    'eye': 983718, 'eye-off': 983720, 'eye-off-outline': 983721,
  },
  FontAwesome5: {
    // Food icons
    'leaf': 61548, 'egg': 63483, 'carrot': 63367, 'cheese': 63471,
    'bread-slice': 63468, 'fish': 62840, 'apple-alt': 62929,
    'pepper-hot': 63510, 'bone': 62935, 'drumstick-bite': 63191,
    'seedling': 62680, 'utensils': 62183, 'hamburger': 63493,
    'pizza-slice': 63499, 'ice-cream': 63203, 'coffee': 61684,
    // Shopping / nav
    'shopping-cart': 61562, 'store': 63158, 'truck': 61649,
    // User / nav
    'user': 61447, 'user-alt': 62470, 'users': 61578,
    'home': 61461, 'search': 61442,
    'times': 61453, 'check': 61452, 'plus': 61543, 'minus': 61544,
    'trash': 61944, 'trash-alt': 62459, 'edit': 61508, 'cog': 61459,
    'heart': 61444, 'star': 61445, 'bell': 61683, 'camera': 61488, 'image': 61502,
    'info-circle': 61530, 'exclamation-circle': 61527,
    'sign-out-alt': 62197, 'lock': 61475, 'envelope': 61664,
    'eye': 61550, 'eye-slash': 61552,
    'arrow-left': 61536, 'arrow-right': 61537,
    'chevron-right': 61524, 'chevron-left': 61523,
    'chevron-down': 61521, 'chevron-up': 61522,
    'filter': 61616, 'list': 61498, 'th-large': 61449, 'th': 61450,
    'dumbbell': 62689, 'running': 63183,
  },
  Entypo: {
    'dots-three-horizontal': 61825, 'dots-three-vertical': 61826,
    'menu': 61944, 'home': 61461, 'user': 61868,
    'chevron-right': 58902, 'chevron-left': 58901,
    'chevron-down': 58900, 'chevron-up': 58903,
    'cross': 10005, 'check': 10003, 'plus': 43, 'minus': 45,
    'trash': 61771, 'edit': 61761, 'cog': 9881,
    'heart': 10084, 'star': 11088, 'search': 61442,
    'bell': 61683, 'camera': 61610, 'image': 61502,
    'info': 9432, 'warning': 9888, 'refresh': 58927,
    'lock': 61475, 'mail': 9993, 'phone': 61684,
    'location-pin': 57345, 'map': 61517,
    'news': 61471, 'book': 61441, 'bookmarks': 61467,
    'share': 61442, 'export': 61601,
    'arrow-left': 8592, 'arrow-right': 8594,
    'arrow-long-left': 61696, 'arrow-long-right': 61699,
    'shopping-cart': 61562, 'wallet': 62073,
  },
  MaterialIcons: {
    'home': 59530, 'search': 59828, 'person': 59624, 'settings': 59881,
    'close': 58886, 'add': 57669, 'check': 58826, 'delete': 59506,
    'edit': 58313, 'star': 59886, 'favorite': 59517,
    'shopping-cart': 59951, 'notifications': 59601,
    'arrow-back': 58824, 'arrow-forward': 58836,
    'chevron-right': 58412, 'chevron-left': 58413,
    'visibility': 59636, 'visibility-off': 59637,
    'filter-list': 57682, 'camera': 58927, 'image': 58894,
    'info': 59534, 'warning': 57346, 'refresh': 58837,
    'menu': 58727, 'more-vert': 58836, 'email': 57688,
    'lock': 59600, 'logout': 60936,
  },
  FontAwesome: {
    'home': 61461, 'search': 61442, 'user': 61447, 'users': 61578,
    'bell': 61683, 'bell-o': 61684,
    'heart': 61444, 'heart-o': 61478,
    'star': 61445, 'star-o': 61446,
    'times': 61453, 'check': 61452, 'plus': 61543, 'minus': 61544,
    'trash': 61459, 'trash-o': 61584, 'edit': 61508, 'pencil': 61504,
    'cog': 61459, 'cogs': 61573, 'gear': 61459,
    'camera': 61488, 'image': 61502, 'picture-o': 61502,
    'info-circle': 61530, 'info': 61505,
    'exclamation-circle': 61527, 'warning': 61546,
    'lock': 61475, 'unlock': 61479,
    'envelope': 61664, 'envelope-o': 61665,
    'eye': 61550, 'eye-slash': 61552,
    'arrow-left': 61536, 'arrow-right': 61537,
    'arrow-up': 61538, 'arrow-down': 61539,
    'chevron-right': 61524, 'chevron-left': 61523,
    'chevron-down': 61521, 'chevron-up': 61522,
    'filter': 61616, 'list': 61643, 'th-large': 61449, 'th': 61450,
    'shopping-cart': 61562, 'tag': 61483, 'tags': 61484,
    'bar-chart': 61568, 'pie-chart': 61528, 'line-chart': 62145,
    'map-marker': 61505, 'location-arrow': 61516,
    'phone': 61589, 'mobile': 61707,
    'sign-out': 61579, 'sign-in': 61578,
    'refresh': 61460, 'spinner': 61467,
    'calendar': 61555, 'clock-o': 61463,
    'book': 61441, 'bookmark': 61467, 'bookmark-o': 61480,
    'file': 61500, 'file-text': 61501,
    'comments': 61538, 'comment': 61537, 'chat': 61538,
    'share': 61542, 'share-alt': 62004,
    'download': 61463, 'upload': 61548,
    'cloud': 61634, 'link': 61514,
    'paper-plane': 62062, 'send': 62062,
    'leaf': 61548, 'cutlery': 61685,
    'percent': 37, 'dollar': 36,
  },
};

// Font family name for each icon library
const FONT_FAMILY = {
  Feather: 'Feather',
  Ionicons: 'Ionicons',
  FontAwesome5: 'FontAwesome5Free-Solid',
  FontAwesome: 'FontAwesome',
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  AntDesign: 'AntDesign',
  Entypo: 'Entypo',
  FontAwesome5Pro: 'FontAwesome5Free-Regular',
};

// Detect which font family from the module path context
// The stub is used for all families — detect from the `family` prop or default to Ionicons
const VectorIcon = ({ name = '', size = 20, color = '#000', style, family }) => {
  const resolvedFamily = family || 'Ionicons';
  const glyphMap = GLYPH_MAPS[resolvedFamily] || GLYPH_MAPS.Ionicons;
  const codepoint = glyphMap[name];

  if (codepoint) {
    const fontFamily = FONT_FAMILY[resolvedFamily] || resolvedFamily;
    return (
      <Text
        style={[{
          fontFamily,
          fontSize: size,
          color,
          lineHeight: size * 1.2,
          textAlign: 'center',
        }, style]}
        selectable={false}
      >
        {String.fromCodePoint(codepoint)}
      </Text>
    );
  }

  // Fallback to emoji map for unmapped icons
  const EMOJI_FALLBACK = {
    'home': '🏠', 'search': '🔍', 'person': '👤', 'close': '✕',
    'checkbox': '☑', 'square-outline': '☐', 'check': '✓',
    'add': '+', 'minus': '−', 'trash': '🗑', 'edit': '✏',
    'settings': '⚙', 'notifications': '🔔', 'cart': '🛒',
    'heart': '♥', 'star': '★', 'eye': '👁', 'eye-off': '🚫',
    'log-out-outline': '⏏', 'refresh': '↻', 'filter': '⚡',
    'leaf': '🌿', 'egg': '🥚', 'carrot': '🥕', 'cheese': '🧀',
    'bread-slice': '🍞', 'arrow-back': '←', 'arrow-forward': '→',
    'chevron-right': '›', 'chevron-left': '‹',
  };

  return (
    <Text
      style={[{ fontSize: Math.max(size * 0.85, 12), color, lineHeight: size * 1.2, textAlign: 'center' }, style]}
      selectable={false}
    >
      {EMOJI_FALLBACK[name] || '•'}
    </Text>
  );
};

// Export per-family constructors so `Ionicons.render` etc. work
const makeFamily = (familyName) => {
  const Comp = (props) => <VectorIcon {...props} family={familyName} />;
  Comp.displayName = familyName;
  return Comp;
};

export const Ionicons = makeFamily('Ionicons');
export const Feather = makeFamily('Feather');
export const FontAwesome5 = makeFamily('FontAwesome5');
export const FontAwesome = makeFamily('FontAwesome');
export const MaterialIcons = makeFamily('MaterialIcons');
export const MaterialCommunityIcons = makeFamily('MaterialCommunityIcons');
export const AntDesign = makeFamily('AntDesign');
export const Entypo = makeFamily('Entypo');

export default VectorIcon;
