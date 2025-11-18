import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Intentar importar expo-constants si está disponible
let Constants: any = null;
try {
  Constants = require('expo-constants');
} catch (e) {
  // expo-constants no disponible, continuar sin él
}

const STORAGE_KEY = '@api_base_url';
// IP por defecto para desarrollo - actualiza esta IP según la IP de tu backend
// Puedes ver la IP en el terminal cuando ejecutas: npm run dev (en backend)
const DEFAULT_DEV_IP = '192.168.1.120'; // IP por defecto para desarrollo
const DEFAULT_PORT = '3000';

/**
 * Obtiene la IP del dispositivo desde expo-constants
 * En desarrollo, esto puede ayudar a detectar la IP local
 */
export function getDeviceIP(): string | null {
  try {
    // En desarrollo, Expo puede proveer la IP del dispositivo
    if (__DEV__ && Constants) {
      // Intentar obtener desde manifest2.expoGoDebuggerHostname
      if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
        const debuggerHost = Constants.manifest2.extra.expoGo.debuggerHost;
        const match = debuggerHost.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          console.log('📍 IP detectada desde manifest2:', match[1]);
          return match[1];
        }
      }
      
      // Intentar desde hostUri
      if (Constants.expoConfig?.hostUri) {
        // exp://192.168.1.100:8081 -> 192.168.1.100
        const match = Constants.expoConfig.hostUri.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          console.log('📍 IP detectada desde hostUri:', match[1]);
          return match[1];
        }
      }
      
      // Intentar desde manifest.debuggerHost
      if (Constants.manifest?.debuggerHost) {
        const match = Constants.manifest.debuggerHost.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
          console.log('📍 IP detectada desde manifest:', match[1]);
          return match[1];
        }
      }
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Error obteniendo IP del dispositivo:', error);
    return null;
  }
}

/**
 * Detecta la IP local para desarrollo
 * Intenta varias estrategias para encontrar la IP correcta
 */
export async function detectLocalIP(): Promise<string> {
  console.log('🔍 Detectando IP local...');
  
  // 1. Primero intenta obtener de AsyncStorage (configuración previa)
  const storedURL = await getStoredIP();
  if (storedURL) {
    console.log('✅ IP encontrada en AsyncStorage:', storedURL);
    // Si es una URL completa, extraer solo la IP
    const urlMatch = storedURL.match(/http:\/\/(\d+\.\d+\.\d+\.\d+):?(\d+)?/);
    if (urlMatch) {
      return storedURL; // Retornar URL completa
    }
    return storedURL;
  }

  // 2. Intenta obtener desde expo-constants (dispositivo físico)
  const deviceIP = getDeviceIP();
  if (deviceIP) {
    const detectedURL = `http://${deviceIP}:${DEFAULT_PORT}`;
    console.log('✅ IP detectada desde dispositivo:', detectedURL);
    return detectedURL;
  }

  // 3. Para emulador Android, usa la IP especial
  if (__DEV__ && Platform.OS === 'android') {
    console.log('⚠️ Emulador Android detectado, usando IP por defecto');
    return `http://${DEFAULT_DEV_IP}:${DEFAULT_PORT}`;
  }

  // 4. Fallback a la IP por defecto
  console.log('⚠️ Usando IP por defecto:', `http://${DEFAULT_DEV_IP}:${DEFAULT_PORT}`);
  return `http://${DEFAULT_DEV_IP}:${DEFAULT_PORT}`;
}

/**
 * Guarda la URL base del API en AsyncStorage
 */
export async function setAPIBaseURL(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, url);
    console.log('✅ URL del API guardada:', url);
  } catch (error) {
    console.error('Error guardando URL del API:', error);
    throw error;
  }
}

/**
 * Obtiene la URL base del API desde AsyncStorage
 */
export async function getStoredIP(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored;
  } catch (error) {
    console.error('Error obteniendo URL del API:', error);
    return null;
  }
}

/**
 * Limpia la URL almacenada (vuelve a los valores por defecto)
 */
export async function clearStoredIP(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('✅ URL del API limpiada');
  } catch (error) {
    console.error('Error limpiando URL del API:', error);
  }
}

/**
 * Obtiene la URL base del API según el entorno
 * - En desarrollo: usa la IP local detectada o almacenada
 * - En producción: usa la URL de producción
 */
export async function getAPIBaseURL(): Promise<string> {
  console.log('🌐 Inicializando URL del API...');
  
  // En producción, siempre usa la URL de producción
  if (!__DEV__) {
    const prodURL = 'https://tu-url.railway.app'; // ⚠️ ACTUALIZAR con tu URL de producción
    console.log('✅ Modo producción, usando:', prodURL);
    return prodURL;
  }

  // En desarrollo, detecta o usa la IP almacenada
  const storedURL = await getStoredIP();
  
  if (storedURL && storedURL.startsWith('http')) {
    // Si ya hay una URL almacenada, úsala
    console.log('✅ URL encontrada en almacenamiento:', storedURL);
    return storedURL;
  }

  // Si no hay URL almacenada, detecta la IP
  const detectedURL = await detectLocalIP();
  
  // Guarda la IP detectada para próximas ejecuciones
  await setAPIBaseURL(detectedURL);
  
  console.log('✅ URL del API configurada:', detectedURL);
  return detectedURL;
}

/**
 * Configura manualmente la URL del API
 * Útil para cuando cambias de red o necesitas apuntar a un servidor específico
 */
export async function configureAPIURL(
  ip?: string, 
  port: string = DEFAULT_PORT, 
  useHTTPS: boolean = false
): Promise<string> {
  let url: string;

  if (ip) {
    // URL personalizada
    const protocol = useHTTPS ? 'https' : 'http';
    url = `${protocol}://${ip}${port ? `:${port}` : ''}`;
  } else {
    // Detectar automáticamente
    url = await detectLocalIP();
    url = `http://${url}:${port}`;
  }

  await setAPIBaseURL(url);
  return url;
}

