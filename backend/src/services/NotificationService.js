const { PrismaClient } = require('@prisma/client');
const PushNotificationService = require('./PushNotificationService');
const ActivityLogService = require('./ActivityLogService');

const prisma = new PrismaClient();

class NotificationService {
  // Create a new notification
  static async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: JSON.stringify(data)
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: { isRead: true }
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Notify seller about new order
  static async notifyNewOrder(sellerId, orderId, productTitle, buyerName, total) {
    try {
      // Verificar si debe notificar
      const shouldNotify = await this.shouldNotify(sellerId, 'ORDER_CREATED');
      
      const notification = await this.createNotification(
        sellerId,
        'ORDER_CREATED',
        'Nueva Orden Recibida',
        `Has recibido una nueva orden de ${buyerName} por "${productTitle}" por $${total}`,
        {
          orderId,
          productTitle,
          buyerName,
          total,
          action: 'view_order'
        }
      );

      // Enviar push notification
      if (shouldNotify) {
        await PushNotificationService.sendPushNotification(
          sellerId,
          'Nueva Orden Recibida',
          `Has recibido una nueva orden de ${buyerName} por "${productTitle}" por $${total}`,
          {
            orderId,
            productTitle,
            buyerName,
            total,
            action: 'view_order',
            type: 'ORDER_CREATED'
          }
        );
      }

      // Log de actividad
      await ActivityLogService.logNotificationSent(notification.id, sellerId, 'ORDER_CREATED');

      return notification;
    } catch (error) {
      console.error('Error notifying new order:', error);
      throw error;
    }
  }

  // Notify buyer about order status change
  static async notifyOrderStatusChange(buyerId, orderId, productTitle, newStatus, sellerName) {
    try {
      const statusMessages = {
        'PAYMENT_PENDING': 'Esperando confirmación de pago',
        'PAYMENT_CONFIRMED': 'Pago confirmado, preparando producto',
        'PREPARING': 'Producto en preparación',
        'READY_FOR_PICKUP': '¡Tu producto está listo para retiro!',
        'PICKED_UP': 'Producto retirado exitosamente',
        'DELIVERED': 'Tu orden ha sido entregada',
        'CANCELLED': 'Tu orden ha sido cancelada'
      };

      const title = statusMessages[newStatus] || 'Estado de orden actualizado';
      const message = `Tu orden de "${productTitle}" de ${sellerName} ahora está: ${statusMessages[newStatus] || newStatus}`;

      // Verificar si debe notificar
      const shouldNotify = await this.shouldNotify(buyerId, 'ORDER_STATUS_CHANGED');
      
      const notification = await this.createNotification(
        buyerId,
        'ORDER_STATUS_CHANGED',
        title,
        message,
        {
          orderId,
          productTitle,
          newStatus,
          sellerName,
          action: 'view_order'
        }
      );

      // Enviar push notification (especialmente importante para READY_FOR_PICKUP)
      if (shouldNotify) {
        await PushNotificationService.sendPushNotification(
          buyerId,
          title,
          message,
          {
            orderId,
            productTitle,
            newStatus,
            sellerName,
            action: 'view_order',
            type: 'ORDER_STATUS_CHANGED'
          }
        );
      }

      // Log de actividad
      await ActivityLogService.logNotificationSent(notification.id, buyerId, 'ORDER_STATUS_CHANGED');

      return notification;
    } catch (error) {
      console.error('Error notifying order status change:', error);
      throw error;
    }
  }

  // Notify client that product is ready for pickup
  static async notifyProductReady(clientId, orderId, productTitle, pickupCode, branchId) {
    try {
      const notification = await this.createNotification(
        clientId,
        'PRODUCT_READY',
        '¡Tu producto está listo para retiro!',
        `Tu pedido de "${productTitle}" está listo para retirar. Código de retiro: ${pickupCode}`,
        {
          orderId,
          productTitle,
          pickupCode,
          branchId,
          action: 'view_order'
        }
      );

      return notification;
    } catch (error) {
      console.error('Error notifying product ready:', error);
      throw error;
    }
  }

  // Notify seller that product was picked up
  static async notifyProductPickedUp(sellerId, orderId, productTitle, clientName) {
    try {
      const notification = await this.createNotification(
        sellerId,
        'PRODUCT_PICKED_UP',
        'Producto retirado',
        `${clientName} ha retirado su pedido de "${productTitle}"`,
        {
          orderId,
          productTitle,
          clientName,
          action: 'view_order'
        }
      );

      return notification;
    } catch (error) {
      console.error('Error notifying product picked up:', error);
      throw error;
    }
  }

  // Notify client to contact seller for payment
  static async notifyContactSeller(clientId, orderId, productTitle, sellerInfo) {
    try {
      const whatsappInfo = sellerInfo?.whatsapp ? `WhatsApp: ${sellerInfo.whatsapp}` : 'Contacta al vendedor';
      
      const notification = await this.createNotification(
        clientId,
        'CONTACT_SELLER',
        'Contacta al vendedor para completar tu compra',
        `Contacta al vendedor para coordinar el pago de "${productTitle}". ${whatsappInfo}`,
        {
          orderId,
          productTitle,
          sellerInfo: sellerInfo || {},
          action: 'contact_seller'
        }
      );

      return notification;
    } catch (error) {
      console.error('Error notifying contact seller:', error);
      throw error;
    }
  }

  // Notify seller about low stock
  static async notifyLowStock(sellerId, productId, productTitle, currentStock, threshold = 5) {
    try {
      const notification = await this.createNotification(
        sellerId,
        'STOCK_LOW',
        'Stock Bajo',
        `El producto "${productTitle}" tiene solo ${currentStock} unidades en stock`,
        {
          productId,
          productTitle,
          currentStock,
          threshold,
          action: 'update_stock'
        }
      );

      return notification;
    } catch (error) {
      console.error('Error notifying low stock:', error);
      throw error;
    }
  }

  // Notify seller about out of stock
  static async notifyOutOfStock(sellerId, productId, productTitle) {
    try {
      const notification = await this.createNotification(
        sellerId,
        'STOCK_OUT',
        'Sin Stock',
        `El producto "${productTitle}" se ha quedado sin stock`,
        {
          productId,
          productTitle,
          action: 'update_stock'
        }
      );

      return notification;
    } catch (error) {
      console.error('Error notifying out of stock:', error);
      throw error;
    }
  }

  // Check and notify about low stock products
  static async checkLowStockProducts(sellerId, threshold = 5) {
    try {
      const lowStockProducts = await prisma.product.findMany({
        where: {
          userId: sellerId,
          isActive: true,
          stock: {
            lte: threshold
          }
        },
        select: {
          id: true,
          title: true,
          stock: true
        }
      });

      for (const product of lowStockProducts) {
        if (product.stock === 0) {
          await this.notifyOutOfStock(sellerId, product.id, product.title);
        } else {
          await this.notifyLowStock(sellerId, product.id, product.title, product.stock, threshold);
        }
      }

      return lowStockProducts.length;
    } catch (error) {
      console.error('Error checking low stock products:', error);
      throw error;
    }
  }

  // Get user settings
  static async getUserSettings(userId) {
    try {
      let settings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!settings) {
        settings = await prisma.userSettings.create({
          data: { userId }
        });
      }

      return settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // Update user settings
  static async updateUserSettings(userId, settingsData) {
    try {
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: settingsData,
        create: {
          userId,
          ...settingsData
        }
      });

      return settings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Check if user should receive notification
  static async shouldNotify(userId, notificationType) {
    try {
      const settings = await this.getUserSettings(userId);

      if (!settings.notificationsEnabled) {
        return false;
      }

      switch (notificationType) {
        case 'STOCK_LOW':
        case 'STOCK_OUT':
          return settings.stockAlertsEnabled;
        case 'ORDER_CREATED':
        case 'ORDER_STATUS_CHANGED':
          return settings.orderAlertsEnabled;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return true; // Default to true if error
    }
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          isRead: true
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
