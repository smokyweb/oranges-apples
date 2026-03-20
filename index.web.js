import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('OrangesToApples', () => App);

const rootTag = document.getElementById('root');
if (!rootTag) {
  console.error('[OTA] Root element not found!');
} else {
  console.log('[OTA] Mounting app on', rootTag);
  AppRegistry.runApplication('OrangesToApples', {
    rootTag,
    initialProps: {},
    mode: 'concurrent', // Use concurrent mode → calls render() not renderLegacy()
  });
}
