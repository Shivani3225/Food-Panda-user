import apiClient from '../config/apiClient';
import { AUTH_ROUTES } from '../config/routes';
import { saveAuth } from './storage';

export const loginApi = async ({ email, password }) => {
  const payload = {
    email: (email ?? '').trim(),
    password,
  };

  const response = await apiClient.post(AUTH_ROUTES.login, payload);
  // Return the raw axios response so AuthContext can access response.data
  return response;
};

export const registerInitiate = async ({
  name,
  email,
  password,
  mobile,
  role = 'customer',
  countryCode,
  country,
}) => {
  const payload = {
    name: (name ?? '').trim(),
    email: (email ?? '').trim(),
    password,
    mobile: (mobile ?? '').trim(),
    role,
  };

  if (countryCode) payload.countryCode = countryCode;
  if (country) payload.country = country;

  console.log('Signup payload being sent:', payload);

  const response = await apiClient.post(AUTH_ROUTES.registerInitiate, payload);
  console.log('API Response from registerInitiate:', response?.data);
  if (response?.data?.testOtp || response?.data?.otp) {
    console.log('OTP received from registerInitiate:', response.data.testOtp || response.data.otp);
  }
  return response?.data ?? {};
};

export const registerVerify = async ({ mobile, otp }) => {
  const payload = {
    mobile: (mobile ?? '').trim(),
    otp: (otp ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.registerVerify, payload);
  const data = response?.data ?? {};

  const token = data?.token || data?.accessToken || data?.data?.token;
  const user = data?.user || data?.data?.user;

  if (token || user) {
    await saveAuth({ token, user });
  }

  return data;
};

export const resendOtp = async ({ mobile, email }) => {
  const payload = {
    mobile: (mobile ?? '').trim(),
    email: (email ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.resendOtp, payload);
  console.log('API Response from resendOtp:', response?.data);
  if (response?.data?.testOtp || response?.data?.otp) {
    console.log('OTP received from resendOtp:', response.data.testOtp || response.data.otp);
  }
  return response?.data ?? {};
};

export const checkVerificationStatus = async ({ mobile, email }) => {
  const payload = {
    mobile: (mobile ?? '').trim(),
    email: (email ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.checkVerificationStatus, payload);
  return response?.data ?? {};
};

export const forgotPasswordInitiate = async ({ email, mobile }) => {
  const payload = {
    email: (email ?? '').trim(),
    mobile: (mobile ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.forgotPassword, payload);
  if (response?.data?.otp) {
    console.log('OTP received from forgotPasswordInitiate:', response.data.otp);
  }
  return response?.data ?? {};
};

export const forgotPasswordVerifyOTP = async ({ email, mobile, otp }) => {
  const payload = {
    email: (email ?? '').trim(),
    mobile: (mobile ?? '').trim(),
    otp: (otp ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.forgotPasswordVerifyOTP, payload);
  return response?.data ?? {};
};

export const forgotPasswordResendOTP = async ({ email, mobile }) => {
  const payload = {
    email: (email ?? '').trim(),
    mobile: (mobile ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.forgotPasswordResendOTP, payload);
  if (response?.data?.otp) {
    console.log('OTP received from forgotPasswordResendOTP:', response.data.otp);
  }
  return response?.data ?? {};
};

export const resetPassword = async ({ resetToken, newPassword }) => {
  const payload = {
    resetToken: (resetToken ?? '').trim(),
    newPassword,
  };

  const response = await apiClient.post(AUTH_ROUTES.resetPassword, payload);
  return response?.data ?? {};
};

export const logoutApi = async () => {
  const response = await apiClient.post(AUTH_ROUTES.logout);
  return response?.data ?? {};
};
