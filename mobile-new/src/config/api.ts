// API Configuration
// La IP ahora es dinámica y se detecta automáticamente en desarrollo
// Para configurar manualmente, usa: configureAPIURL('192.168.1.100', '3000')
// Para producción, actualiza PRODUCTION_URL abajo

import { getAPIBaseURL, configureAPIURL, clearStoredIP } from '../utils/networkConfig';

// Detectar si estamos en desarrollo o producción
const isDevelopment = __DEV__;

// URL de producción (Railway/AWS)
// ⚠️ ACTUALIZAR ESTA URL con tu URL de producción después de deployar
const PRODUCTION_URL = 'https://tu-url.railway.app'; // ⚠️ ACTUALIZAR ESTA URL

// Variable para almacenar la URL base (se inicializa dinámicamente)
// Valor por defecto - se actualizará cuando se detecte la IP correcta
let _API_BASE_URL: string = isDevelopment 
  ? 'http://192.168.1.120:3000' // Valor por defecto temporal hasta que se detecte
  : PRODUCTION_URL;

// Factory function para crear endpoints dinámicos
function createEndpoints(baseURL: string) {
  return {
    // Auth
    LOGIN: `${baseURL}/api/auth/login`,
    REGISTER: `${baseURL}/api/auth/register`,
    
    // Users
    USER_PROFILE: `${baseURL}/api/users/profile`,
    
    // Products
    PRODUCTS: `${baseURL}/api/products`,
    PRODUCT_BY_ID: (id: string) => `${baseURL}/api/products/${id}`,
    
    // Orders
    ORDERS: `${baseURL}/api/orders`,
    ORDER_BY_ID: (id: string) => `${baseURL}/api/orders/${id}`,
    ORDER_STATUS: (id: string) => `${baseURL}/api/orders/${id}/status`,
    ORDER_QR: (id: string) => `${baseURL}/api/orders/${id}/qr`,
    
    // Seller
    SELLER_DASHBOARD: `${baseURL}/api/seller/dashboard`,
    SELLER_ORDERS: `${baseURL}/api/seller/orders`,
    SELLER_PRODUCTS: `${baseURL}/api/seller/products`,
    SELLER_LOW_STOCK: `${baseURL}/api/seller/products/low-stock`,
    SELLER_ORDER_STATUS: (id: string) => `${baseURL}/api/seller/orders/${id}/status`,
    SELLER_PRODUCT_STOCK: (id: string) => `${baseURL}/api/seller/products/${id}/stock`,
    SELLER_CONFIRM_PAYMENT: (id: string) => `${baseURL}/api/seller/orders/${id}/confirm-payment`,
    SELLER_DELIVER_TO_BRANCH: (id: string) => `${baseURL}/api/seller/orders/${id}/deliver-to-branch`,
    
    // Buyer
    BUYER_DASHBOARD: `${baseURL}/api/buyer/dashboard`,
    BUYER_ORDERS: `${baseURL}/api/buyer/orders`,
    BUYER_ORDER_TRACKING: (id: string) => `${baseURL}/api/buyer/orders/${id}/tracking`,
    
    // Admin
    ADMIN_DASHBOARD: `${baseURL}/api/admin/dashboard`,
    ADMIN_BRANCHES: `${baseURL}/api/admin/branches`,
    ADMIN_CREATE_BRANCH: `${baseURL}/api/admin/branches`,
    ADMIN_BRANCH_ORDERS: (branchId: string) => `${baseURL}/api/admin/branches/${branchId}/orders-ready`,
    ADMIN_SCAN_QR: `${baseURL}/api/admin/scan-qr`,
    ADMIN_CONFIRM_PICKUP: `${baseURL}/api/admin/confirm-pickup`,
    
    // Notifications
    NOTIFICATIONS: `${baseURL}/api/notifications`,
    NOTIFICATION_READ: (id: string) => `${baseURL}/api/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: `${baseURL}/api/notifications/read-all`,
    NOTIFICATIONS_UNREAD_COUNT: `${baseURL}/api/notifications/unread-count`,
    NOTIFICATION_SETTINGS: `${baseURL}/api/notifications/settings`,
    
    // Reels
    REELS: `${baseURL}/api/reels`,
    REEL_LIKE: (id: string) => `${baseURL}/api/reels/${id}/like`,
  };
}

// Exportar endpoints - se actualizará dinámicamente cuando cambie _API_BASE_URL
export const API_ENDPOINTS: ReturnType<typeof createEndpoints> = createEndpoints(_API_BASE_URL);

// Función para actualizar los endpoints
function updateEndpoints() {
  const newEndpoints = createEndpoints(_API_BASE_URL);
  // Actualizar cada propiedad del objeto para mantener la referencia
  Object.keys(newEndpoints).forEach(key => {
    (API_ENDPOINTS as any)[key] = (newEndpoints as any)[key];
  });
}

// Función para inicializar la URL del API (llamada explícitamente)
export async function initializeAPIBaseURL(): Promise<void> {
  try {
    console.log('🔄 Inicializando API Base URL...');
    _API_BASE_URL = await getAPIBaseURL();
    updateEndpoints(); // Actualizar endpoints con la nueva URL
    console.log('✅ API Base URL inicializada:', _API_BASE_URL);
  } catch (error) {
    console.error('⚠️ Error inicializando API URL, usando valor por defecto:', error);
  }
}

// Inicializar automáticamente al cargar el módulo
initializeAPIBaseURL();

// Función para obtener la URL base (sincrónica para uso inmediato)
export function getAPIBaseURLSync(): string {
  return _API_BASE_URL;
}

// Función para actualizar la URL base dinámicamente
export async function updateAPIBaseURL(ip?: string, port?: string): Promise<string> {
  const newURL = await configureAPIURL(ip, port);
  _API_BASE_URL = newURL;
  updateEndpoints(); // Actualizar endpoints cuando cambia la URL
  console.log('🔄 API Base URL actualizada:', _API_BASE_URL);
  return newURL;
}

// Función para resetear la configuración de red
export async function resetNetworkConfig(): Promise<void> {
  await clearStoredIP();
  _API_BASE_URL = isDevelopment ? 'http://192.168.1.120:3000' : PRODUCTION_URL;
  updateEndpoints();
  console.log('🔄 Configuración de red reseteada');
}

// Exportar la URL base (sincrónica por compatibilidad)
export const API_BASE_URL = _API_BASE_URL;

// Función para obtener la URL completa del API (dinámica)
export function getAPIURL(): string {
  return `${_API_BASE_URL}/api`;
}

export const API_URL = getAPIURL();

// Endpoints dinámicos que se actualizan cuando cambia la URL base
export function getAPIEndpoints() {
  return createEndpoints(_API_BASE_URL);
}

export default API_BASE_URL;
