import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'userData';
const PENDING_SIGNUP_KEY = 'pending_signup';

export const saveAuth = async ({ token, user }) => {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getAuthToken = async () => AsyncStorage.getItem(TOKEN_KEY);

export const getAuthUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, 'chosen_address']);
};

export const savePendingSignup = async ({ email, mobile }) => {
  const payload = {
    email: email ?? '',
    mobile: mobile ?? '',
  };
  await AsyncStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload));
};

export const getPendingSignup = async () => {
  const raw = await AsyncStorage.getItem(PENDING_SIGNUP_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearPendingSignup = async () => {
  await AsyncStorage.removeItem(PENDING_SIGNUP_KEY);
};
