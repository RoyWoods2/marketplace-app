const express = require('express');
const { PrismaClient } = require('@prisma/client');
const PushNotificationService = require('../services/PushNotificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Registrar token de push notifications
router.post('/register-token', async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      return res.status(400).json({ error: 'User ID and push token are required' });
    }

    const user = await PushNotificationService.registerPushToken(userId, pushToken);

    res.json({
      message: 'Push token registered successfully',
      user: {
        id: user.id,
        pushToken: user.pushToken
      }
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Remover token de push notifications
router.delete('/unregister-token', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await PushNotificationService.unregisterPushToken(userId);

    res.json({ message: 'Push token unregistered successfully' });
  } catch (error) {
    console.error('Unregister push token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enviar notificación push (para testing o admin)
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'User ID, title, and body are required' });
    }

    const tickets = await PushNotificationService.sendPushNotification(
      userId,
      title,
      body,
      data || {}
    );

    res.json({
      message: 'Push notification sent',
      tickets
    });
  } catch (error) {
    console.error('Send push notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enviar notificación de prueba a tu propio usuario
router.post('/test', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verificar que el usuario tiene un push token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.pushToken) {
      return res.status(400).json({ 
        error: 'User does not have a push token registered. Please make sure notifications are enabled in the app.' 
      });
    }

    const testTitle = '🧪 Notificación de Prueba';
    const testBody = `Hola ${user.firstName || 'Usuario'}, esta es una notificación de prueba enviada en tiempo real.`;

    const tickets = await PushNotificationService.sendPushNotification(
      userId,
      testTitle,
      testBody,
      {
        type: 'TEST',
        timestamp: new Date().toISOString(),
        action: 'test_notification'
      }
    );

    res.json({
      message: 'Test notification sent successfully',
      title: testTitle,
      body: testBody,
      tickets,
      user: {
        id: userId,
        hasPushToken: !!user.pushToken
      }
    });
  } catch (error) {
    console.error('Test push notification error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;

