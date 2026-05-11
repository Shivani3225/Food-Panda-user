// Jest setup for React Native tests

jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {
      languageCode: 'en',
      countryCode: 'US',
      languageTag: 'en-US',
      isRTL: false,
    },
  ],
  findBestLanguageTag: () => ({ languageTag: 'en-US', isRTL: false }),
  getCountry: () => 'US',
  getCurrencies: () => ['USD'],
  getNumberFormatSettings: () => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  }),
  getCalendar: () => 'gregorian',
  getTemperatureUnit: () => 'celsius',
  getTimeZone: () => 'UTC',
  uses24HourClock: () => true,
  usesMetricSystem: () => true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = props => React.createElement(View, props, props.children);
  MockMapView.Marker = MockMapView;
  MockMapView.Callout = MockMapView;
  MockMapView.Polygon = MockMapView;
  MockMapView.Polyline = MockMapView;
  MockMapView.Circle = MockMapView;
  return MockMapView;
});
