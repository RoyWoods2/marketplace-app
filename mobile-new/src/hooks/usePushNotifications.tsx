import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  // useAuth debe ser llamado dentro de AuthProvider
  // Este hook debe ser usado dentro de AppNavigator que ya está dentro de AuthProvider
  const { user, token } = useAuth();

  // Registrar token en el backend cuando el usuario cambia
  const registerPushToken = useCallback(async (pushToken: string) => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/push-notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          pushToken: pushToken,
        }),
      });

      if (!response.ok) {
        console.error('Failed to register push token');
      } else {
        console.log('✅ Push token registered successfully');
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }, [user, token]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(pushToken => {
      if (pushToken) {
        setExpoPushToken(pushToken);
        // Registrar token en el backend cuando el usuario esté disponible
        if (user && token) {
          registerPushToken(pushToken);
        }
      }
    });

    // Listener para notificaciones recibidas mientras la app está en primer plano
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      // Aquí puedes navegar a la pantalla correspondiente según el tipo de notificación
      // Por ejemplo: navigation.navigate('OrderDetail', { orderId: data.orderId });
    });

    return () => {
      // Remover suscripciones de forma segura
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (error) {
          console.log('Error removing notification listener:', error);
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (error) {
          console.log('Error removing response listener:', error);
        }
      }
    };
  }, [user, token, registerPushToken]);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Necesitarás configurar esto en app.json
    })).data;
    
    console.log('Expo Push Token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

