const appJson = require('./app.json');
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || appJson.expo.android?.config?.googleMaps?.apiKey || 'AIzaSyAdezYYmmFzsMWzbSYkr1UtHBan7HitQK0';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      ...appJson.expo.android.config,
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  ios: {
    ...appJson.expo.ios,
    config: {
      googleMapsApiKey,
    },
  },
};
