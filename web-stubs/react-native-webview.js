import React from 'react';
import { View } from 'react-native';

const WebView = ({ source, style }) => {
  if (source?.html) {
    return (
      <View style={[{ flex: 1 }, style]}>
        <iframe
          srcDoc={source.html}
          style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
          sandbox="allow-same-origin"
        />
      </View>
    );
  }
  return (
    <View style={[{ flex: 1 }, style]}>
      <iframe
        src={source?.uri || ''}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </View>
  );
};

// Support both default and named import: import WebView from '...' AND import { WebView } from '...'
export { WebView };
export default WebView;
