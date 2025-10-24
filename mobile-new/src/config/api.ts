// API Configuration
export const API_BASE_URL = 'http://192.168.1.120:3001';
export const API_URL = `${API_BASE_URL}/api`;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Users
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_BY_ID: (id: string) => `${API_BASE_URL}/api/products/${id}`,
  
  // Orders
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_BY_ID: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
  ORDER_STATUS: (id: string) => `${API_BASE_URL}/api/orders/${id}/status`,
  
  // Seller
  SELLER_DASHBOARD: `${API_BASE_URL}/api/seller/dashboard`,
  SELLER_ORDERS: `${API_BASE_URL}/api/seller/orders`,
  SELLER_PRODUCTS: `${API_BASE_URL}/api/seller/products`,
  SELLER_LOW_STOCK: `${API_BASE_URL}/api/seller/products/low-stock`,
  SELLER_ORDER_STATUS: (id: string) => `${API_BASE_URL}/api/seller/orders/${id}/status`,
  SELLER_PRODUCT_STOCK: (id: string) => `${API_BASE_URL}/api/seller/products/${id}/stock`,
  SELLER_CONFIRM_PAYMENT: (id: string) => `${API_BASE_URL}/api/seller/orders/${id}/confirm-payment`,
  SELLER_DELIVER_TO_BRANCH: (id: string) => `${API_BASE_URL}/api/seller/orders/${id}/deliver-to-branch`,
  
  // Buyer
  BUYER_DASHBOARD: `${API_BASE_URL}/api/buyer/dashboard`,
  BUYER_ORDERS: `${API_BASE_URL}/api/buyer/orders`,
  BUYER_ORDER_TRACKING: (id: string) => `${API_BASE_URL}/api/buyer/orders/${id}/tracking`,
  
  // Admin
  ADMIN_DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
  ADMIN_BRANCHES: `${API_BASE_URL}/api/admin/branches`,
  ADMIN_CREATE_BRANCH: `${API_BASE_URL}/api/admin/branches`,
  ADMIN_BRANCH_ORDERS: (branchId: string) => `${API_BASE_URL}/api/admin/branches/${branchId}/orders-ready`,
  ADMIN_SCAN_QR: `${API_BASE_URL}/api/admin/scan-qr`,
  ADMIN_CONFIRM_PICKUP: `${API_BASE_URL}/api/admin/confirm-pickup`,
  
  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/api/notifications/read-all`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,
  NOTIFICATION_SETTINGS: `${API_BASE_URL}/api/notifications/settings`,
  
  // Reels
  REELS: `${API_BASE_URL}/api/reels`,
  REEL_LIKE: (id: string) => `${API_BASE_URL}/api/reels/${id}/like`,
};

export default API_BASE_URL;
