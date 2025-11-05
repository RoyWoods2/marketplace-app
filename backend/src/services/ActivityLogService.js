const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ActivityLogService {
  // Crear un log de actividad
  static async logActivity({
    userId = null,
    action,
    entityType,
    entityId,
    description,
    metadata = {},
    ipAddress = null,
    userAgent = null
  }) {
    try {
      const log = await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          description,
          metadata: JSON.stringify(metadata),
          ipAddress,
          userAgent
        }
      });

      return log;
    } catch (error) {
      console.error('Error logging activity:', error);
      // No lanzar error para que no afecte el flujo principal
      return null;
    }
  }

  // Log cuando se crea una orden
  static async logOrderCreated(orderId, userId, metadata = {}) {
    return this.logActivity({
      userId,
      action: 'ORDER_CREATED',
      entityType: 'Order',
      entityId: orderId,
      description: `Orden creada: ${orderId}`,
      metadata
    });
  }

  // Log cuando se actualiza una orden
  static async logOrderUpdated(orderId, userId, oldStatus, newStatus, metadata = {}) {
    return this.logActivity({
      userId,
      action: 'ORDER_UPDATED',
      entityType: 'Order',
      entityId: orderId,
      description: `Orden actualizada de ${oldStatus} a ${newStatus}`,
      metadata: { oldStatus, newStatus, ...metadata }
    });
  }

  // Log cuando se crea un producto
  static async logProductCreated(productId, userId, productTitle, metadata = {}) {
    return this.logActivity({
      userId,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: productId,
      description: `Producto creado: ${productTitle}`,
      metadata
    });
  }

  // Log cuando se actualiza un producto
  static async logProductUpdated(productId, userId, metadata = {}) {
    return this.logActivity({
      userId,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: productId,
      description: `Producto actualizado: ${productId}`,
      metadata
    });
  }

  // Log cuando se elimina un producto
  static async logProductDeleted(productId, userId, productTitle) {
    return this.logActivity({
      userId,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: productId,
      description: `Producto eliminado: ${productTitle}`,
      metadata: {}
    });
  }

  // Log cuando un usuario inicia sesión
  static async logUserLogin(userId, ipAddress, userAgent) {
    return this.logActivity({
      userId,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: userId,
      description: `Usuario inició sesión`,
      ipAddress,
      userAgent,
      metadata: {}
    });
  }

  // Log cuando un usuario se registra
  static async logUserRegister(userId, email) {
    return this.logActivity({
      userId,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: userId,
      description: `Nuevo usuario registrado: ${email}`,
      metadata: { email }
    });
  }

  // Log cuando se envía una notificación
  static async logNotificationSent(notificationId, userId, notificationType) {
    return this.logActivity({
      userId: null, // Sistema
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: notificationId,
      description: `Notificación enviada a usuario ${userId}: ${notificationType}`,
      metadata: { userId, notificationType }
    });
  }

  // Obtener logs de actividad
  static async getActivityLogs({
    userId = null,
    entityType = null,
    entityId = null,
    action = null,
    limit = 100,
    offset = 0,
    startDate = null,
    endDate = null
  }) {
    try {
      const where = {};

      if (userId) where.userId = userId;
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (action) where.action = action;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const logs = await prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      return logs;
    } catch (error) {
      console.error('Error getting activity logs:', error);
      throw error;
    }
  }

  // Limpiar logs antiguos (más de 90 días)
  static async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      throw error;
    }
  }
}

module.exports = ActivityLogService;

