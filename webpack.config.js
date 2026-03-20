const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const appDir = __dirname;
const STUBS = path.resolve(appDir, 'web-stubs');

module.exports = (env, argv) => {
  const isProd = argv ? argv.mode === 'production' : true;

  return {
    entry: path.resolve(appDir, 'index.web.js'),
    output: {
      path: path.resolve(appDir, 'dist-web'),
      filename: '[contenthash].bundle.js',
      clean: true,
      publicPath: '/web/',
    },
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-source-map',

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: { drop_debugger: true },
          },
        }),
      ],
    },

    resolve: {
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx', '.json'],
      mainFields: ['browser', 'module', 'main'],
      fullySpecified: false,
      fallback: {
        fs: false,
        path: false,
        crypto: false,
        http2: false,
        'process/browser': require.resolve('process/browser'),
        url: require.resolve('url'),
        util: require.resolve('util'),
        buffer: require.resolve('buffer'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        stream: require.resolve('stream-browserify'),
      },
      conditionNames: ['browser', 'import', 'require', 'node', 'default'],
      alias: {
        // Core RN → Web
        'react-native$': 'react-native-web',

        // Deduplicate React
        'react': path.resolve(appDir, 'node_modules/react'),

        // react-dom compat shim — lazy-loads React 19 APIs removed from react-dom main entry
        'react-dom': path.resolve(STUBS, 'react-dom'),

        // Native-only → stubs
        'react-native-image-crop-picker': path.join(STUBS, 'react-native-image-crop-picker.js'),
        'react-native-linear-gradient': path.join(STUBS, 'react-native-linear-gradient.js'),
        'react-native-webview': path.join(STUBS, 'react-native-webview.js'),
        'react-native-safe-area-context': path.join(STUBS, 'safe-area-context.js'),
        'react-native-gesture-handler': path.join(STUBS, 'gesture-handler.js'),
        'react-native-screens': path.join(STUBS, 'screens.js'),

        // Navigation native-stack → NativeStackView web stub (rest of native-stack is JS and OK)
        '@react-navigation/native-stack/lib/module/views/NativeStackView': path.join(STUBS, 'NativeStackView.js'),

        // Break circular dep: auth.slice → auth.action → axiosRequest → store/auth.slice
        [path.resolve(appDir, 'src/helper/axiosRequest.js')]: path.join(STUBS, 'axiosRequest.js'),

        // Vector icons → per-family shims (each knows its font family)
        '@react-native-vector-icons/material-design-icons': path.join(STUBS, 'MaterialIcons.js'),
        '@expo/vector-icons/MaterialCommunityIcons':         path.join(STUBS, 'MaterialCommunityIcons.js'),
        '@expo/vector-icons':                                path.join(STUBS, 'vector-icon.js'),
        'react-native-vector-icons/Ionicons':              path.join(STUBS, 'Ionicons.js'),
        'react-native-vector-icons/Feather':               path.join(STUBS, 'Feather.js'),
        'react-native-vector-icons/FontAwesome5':          path.join(STUBS, 'FontAwesome5.js'),
        'react-native-vector-icons/FontAwesome5Pro':       path.join(STUBS, 'FontAwesome5Pro.js'),
        'react-native-vector-icons/FontAwesome':           path.join(STUBS, 'FontAwesome.js'),
        'react-native-vector-icons/MaterialIcons':         path.join(STUBS, 'MaterialIcons.js'),
        'react-native-vector-icons/MaterialCommunityIcons':path.join(STUBS, 'MaterialCommunityIcons.js'),
        'react-native-vector-icons/Entypo':                path.join(STUBS, 'Entypo.js'),
        'react-native-vector-icons/AntDesign':             path.join(STUBS, 'AntDesign.js'),
        'react-native-vector-icons/Octicons':              path.join(STUBS, 'Octicons.js'),
        'react-native-vector-icons/Fontisto':              path.join(STUBS, 'Fontisto.js'),
        'react-native-vector-icons/Foundation':            path.join(STUBS, 'Foundation.js'),
        'react-native-vector-icons/SimpleLineIcons':       path.join(STUBS, 'SimpleLineIcons.js'),
        'react-native-vector-icons/Zocial':                path.join(STUBS, 'Zocial.js'),
        '@react-native-community/geolocation':             path.join(STUBS, 'geolocation.js'),
      },
    },

    module: {
      rules: [
        // Force ALL node_modules JS to javascript/auto so packages with "type":"module"
        // don't break when they use CJS exports (prevents "exports is not defined")
        {
          test: /\.(js|mjs)$/,
          include: /node_modules/,
          type: 'javascript/auto',
          resolve: { fullySpecified: false },
        },

        // Transpile app source + selected RN node_modules
        // Use @react-native/babel-preset WITHOUT hermes-stable profile so that
        // destructuring/parameters are fully transformed (avoids TDZ in web V8)
        {
          test: /\.[jt]sx?$/,
          include: [
            path.resolve(appDir, 'src'),
            path.resolve(appDir, 'store'),
            path.resolve(appDir, 'App.jsx'),
            path.resolve(appDir, 'index.web.js'),
            path.resolve(STUBS),
            path.resolve(appDir, 'node_modules/react-native-web'),
            path.resolve(appDir, 'node_modules/react-native-safe-area-context'),
            path.resolve(appDir, 'node_modules/react-native-screens'),
            path.resolve(appDir, 'node_modules/react-native-paper'),
            path.resolve(appDir, 'node_modules/react-native-keyboard-aware-scroll-view'),
            path.resolve(appDir, 'node_modules/react-native-svg'),
            path.resolve(appDir, 'node_modules/@reduxjs'),
            path.resolve(appDir, 'node_modules/react-redux'),
            path.resolve(appDir, 'node_modules/@react-navigation'),
            path.resolve(appDir, 'node_modules/formik'),
            path.resolve(appDir, 'node_modules/yup'),
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['module:@react-native/babel-preset'],
              plugins: [
                ['@babel/plugin-transform-flow-strip-types'],
                ['@babel/plugin-transform-runtime', { helpers: true }],
              ],
            },
          },
        },

        // Assets
        {
          test: /\.(png|jpg|gif|svg|ttf|woff|woff2|eot)$/,
          type: 'asset/resource',
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(appDir, 'web-index.html'),
        filename: 'index.html',
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProd),
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),

      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'node_modules/react-native-vector-icons/Fonts/Feather.ttf',               to: 'fonts/Feather.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/Ionicons.ttf',              to: 'fonts/Ionicons.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf', to: 'fonts/FontAwesome5Free-Regular.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf',   to: 'fonts/FontAwesome5Free-Solid.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/FontAwesome.ttf',           to: 'fonts/FontAwesome.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/MaterialIcons.ttf',         to: 'fonts/MaterialIcons.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf',to: 'fonts/MaterialCommunityIcons.ttf' },
          { from: 'node_modules/react-native-vector-icons/Fonts/Entypo.ttf',               to: 'fonts/Entypo.ttf' },
        ],
      }),
    ],

    performance: { hints: false },
  };
};
