module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native|' +
      '@react-native|' +
      '@react-navigation|' +
      'react-native-vector-icons|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'react-native-svg|' +
      'react-native-reanimated|' +
      'react-native-markdown-display|' +
      'react-native-health-connect|' +
      'react-native-image-picker|' +
      '@react-native-async-storage|' +
      '@react-native-google-signin|' +
      '@tanstack|' +
      'victory-native' +
    ')/)',
  ],
  moduleNameMapper: {
    'react-native-vector-icons/(.*)': '<rootDir>/__mocks__/react-native-vector-icons.js',
  },
};
