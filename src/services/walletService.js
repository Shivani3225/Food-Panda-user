import apiClient from '../config/apiClient';
import { WALLET_ROUTES } from '../config/routes';

/**
 * Fetch wallet data including balance and transactions
 * @returns {Promise} Wallet data with balance and transactions
 */
export const getWallet = async () => {
  try {
    const response = await apiClient.get(WALLET_ROUTES.getWallet);
    return response?.data ?? {};
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    throw error;
  }
};

/**
 * Fetch wallet balance only
 * @returns {Promise} Wallet balance data
 */
export const getWalletBalance = async () => {
  try {
    const response = await apiClient.get(WALLET_ROUTES.getBalance);
    return response?.data ?? { balance: 0 };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};

/**
 * Fetch wallet transactions
 * @param {Object} params Query parameters (limit, offset, etc.)
 * @returns {Promise} Transactions array
 */
export const getWalletTransactions = async (params = {}) => {
  try {
    const response = await apiClient.get(WALLET_ROUTES.getTransactions, {
      params: {
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
        ...params,
      },
    });
    return response?.data ?? { transactions: [] };
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    throw error;
  }
};
