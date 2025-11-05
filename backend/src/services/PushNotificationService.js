const { PrismaClient } = require('@prisma/client');
const { Expo } = require('expo-server-sdk');

const prisma = new PrismaClient();

// Crear cliente Expo
const expo = new Expo();

class PushNotificationService {
  // Validar si un token es válido
  static isValidPushToken(token) {
    return Expo.isExpoPushToken(token);
  }

  // Enviar notificación push a un usuario
  static async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Obtener usuario y su push token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true, settings: true }
      });

      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return null;
      }

      // Verificar si el token es válido
      if (!this.isValidPushToken(user.pushToken)) {
        console.log(`Invalid push token for user ${userId}`);
        return null;
      }

      // Verificar configuración de notificaciones del usuario
      const settings = user.settings;
      if (settings && !settings.notificationsEnabled) {
        console.log(`Notifications disabled for user ${userId}`);
        return null;
      }

      // Crear el mensaje
      const message = {
        to: user.pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: {
          ...data,
          userId,
          timestamp: new Date().toISOString()
        },
        priority: 'high',
        channelId: 'default'
      };

      // Enviar la notificación
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Verificar errores en los tickets
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('Push notification error:', ticket.message);
          
          // Si el token es inválido, limpiarlo
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await prisma.user.update({
              where: { id: userId },
              data: { pushToken: null }
            });
          }
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
      return null;
    }
  }

  // Enviar notificación push a múltiples usuarios
  static async sendPushNotificationToMultiple(userIds, title, body, data = {}) {
    try {
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          pushToken: { not: null }
        },
        select: { id: true, pushToken: true, settings: true }
      });

      const validTokens = users
        .filter(user => {
          if (!user.pushToken || !this.isValidPushToken(user.pushToken)) {
            return false;
          }
          const settings = user.settings;
          return !settings || settings.notificationsEnabled;
        })
        .map(user => user.pushToken);

      if (validTokens.length === 0) {
        console.log('No valid push tokens found');
        return [];
      }

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        priority: 'high'
      }));

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error in sendPushNotificationToMultiple:', error);
      return [];
    }
  }

  // Registrar push token de un usuario
  static async registerPushToken(userId, pushToken) {
    try {
      if (!this.isValidPushToken(pushToken)) {
        throw new Error('Invalid push token');
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { pushToken }
      });

      return user;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  // Remover push token de un usuario
  static async unregisterPushToken(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { pushToken: null }
      });
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  }
}

module.exports = PushNotificationService;

