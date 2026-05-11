import apiClient from '../config/apiClient';
import { USER_ROUTES } from '../config/routes';

export const getAddresses = async () => {
  const response = await apiClient.get(USER_ROUTES.profile);
  const saved = response?.data?.savedAddresses || [];
  return { addresses: saved };
};

export const addAddress = async payload => {
  const response = await apiClient.post(USER_ROUTES.addresses, payload);
  return response.data;
};

export const updateAddress = async (id, payload) => {
  const endpoint = USER_ROUTES.addressById.replace(':id', id);
  const response = await apiClient.put(endpoint, payload);
  return response.data;
};

export const deleteAddress = async id => {
  const endpoint = USER_ROUTES.addressById.replace(':id', id);
  const response = await apiClient.delete(endpoint);
  return response.data;
};
