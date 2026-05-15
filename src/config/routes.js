export const AUTH_ROUTES = {
  login: '/api/auth/login',
  registerInitiate: '/api/auth/register/initiate',
  registerVerify: '/api/auth/register/verify',
  resendOtp: '/api/auth/resend-otp',
  checkVerificationStatus: '/api/auth/check-verification-status',
  forgotPassword: '/api/auth/forgot-password',
  forgotPasswordVerifyOTP: '/api/auth/forgot-password/verify-otp',
  forgotPasswordResendOTP: '/api/auth/forgot-password/resend-otp',
  resetPassword: '/api/auth/reset-password',
  logout: '/api/auth/logout',
  googleLogin: '/api/auth/google',
};

export const RESTAURANT_ROUTES = {
  getDetails: '/api/restaurants/:id/details',
  getMenu: '/api/menu/:restaurantId',
};

export const ORDER_ROUTES = {
  placeOrder: '/api/orders/place',
  getOrders: '/api/orders/my-orders',
  getOrderById: '/api/orders/:id/details',
  getOrderByIdCustomer: '/api/orders/:id/customer',
  
  //dummy api
  rateOrder: '/api/orders/:id/rate',
  rateRestaurant: '/api/restaurants/:id/rate',
  rateRider: '/api/riders/:id/rate',
  reportIssue: '/api/orders/:id/report-issue',
  uploadOrderPhotos: '/api/orders/:id/upload-photos',
};

export const SEARCH_ROUTES = {
  search: '/api/search', // Supports filters: ?q=pizza&isVeg=true&minPrice=100&maxPrice=500
  suggestions: '/api/search/suggestions',
};

export const HOME_ROUTES = {
  getHomeData: '/api/home',
};

export const CART_ROUTES = {
  getCart: '/api/cart',
  addItem: '/api/cart/item',
  removeItem: '/api/cart/item/:itemId',
  updateQuantity: '/api/cart/item/:itemId/quantity',
  updateMeta: '/api/cart/meta',
};

export const USER_ROUTES = {
  profile: '/api/user/profile',
  updateProfile: '/api/user/profile',
  verifyProfileOTP: '/api/user/profile/verify-otp',
  resendProfileOTP: '/api/user/profile/resend-otp',
  changePassword: '/api/user/change-password',
  addresses: '/api/user/address',
  addressById: '/api/user/address/:id',
  deleteAccount: '/api/user/account',
  saveFcmToken: '/api/user/fcm-token',
  removeFcmToken: '/api/user/fcm-token',
  notificationStatus: '/api/user/notification-status',
  foodPreferences: '/api/user/food-preferences',
};

export const FAVORITE_ROUTES = {
  getFavoriteRestaurants: '/api/user/favorites/restaurants',
  toggleFavoriteRestaurant: '/api/user/favorites/restaurants/:id',
  getFavoriteProducts: '/api/user/favorites/products',
  toggleFavoriteProduct: '/api/user/favorites/products/:id',
};

export const WALLET_ROUTES = {
  getWallet: '/api/wallet',
  getBalance: '/api/wallet/balance',
  getTransactions: '/api/wallet/transactions',
};
