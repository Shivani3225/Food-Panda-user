module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    'FILTER_QUICK_REFERENCE.js',
    'src/screens/Home/HomePage copy.jsx',
    'src/screens/Auth/LoginScreen copy.jsx',
    'src/screens/Auth/LoginScreen copy 2.jsx',
  ],
  overrides: [
    {
      files: ['jest.setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};
