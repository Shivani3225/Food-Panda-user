import apiClient from '../config/apiClient';
import { USER_ROUTES } from '../config/routes';
import { clearAuth } from './storage';

export const deleteAccount = async (reason) => {
  const payload = {
    reason: reason || 'No reason provided',
  };
  
  const response = await apiClient.delete(USER_ROUTES.deleteAccount, {
    data: payload,
  });
  
  // Clear local auth data after successful deletion
  await clearAuth();
  
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get(USER_ROUTES.profile);
  return response.data;
};

export const updateUserProfile = async (formData) => {
  const response = await apiClient.put(USER_ROUTES.updateProfile, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const verifyProfileOtp = async (otp) => {
  const response = await apiClient.post(USER_ROUTES.verifyProfileOTP, { otp });
  return response.data;
};

export const resendProfileOtp = async () => {
  const response = await apiClient.post(USER_ROUTES.resendProfileOTP);
  return response.data;
};

export const saveFcmToken = async (fcmToken) => {
  const response = await apiClient.post(USER_ROUTES.saveFcmToken, { fcmToken });
  return response.data;
};

export const removeFcmToken = async () => {
  const response = await apiClient.delete(USER_ROUTES.removeFcmToken);
  return response.data;
};

export const getNotificationStatus = async () => {
  const response = await apiClient.get(USER_ROUTES.notificationStatus);
  return response.data;
};

export const updateFoodPreferences = async (preferences) => {
  const response = await apiClient.post(USER_ROUTES.foodPreferences, { foodPreferences: preferences });
  return response.data;
};
