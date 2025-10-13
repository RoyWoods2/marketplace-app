const { PrismaClient } = require('@prisma/client');
const NotificationService = require('../src/services/NotificationService');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding notification data...');

  try {
    // Get some users to create notifications for
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, firstName: true, lastName: true }
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed script first.');
      return;
    }

    // Create sample notifications for each user
    for (const user of users) {
      // Create user settings if they don't exist
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      });

      // Create seller stats if they don't exist
      await prisma.sellerStats.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      });

      // Create sample notifications
      const notifications = [
        {
          type: 'ORDER_CREATED',
          title: 'Nueva Orden Recibida',
          message: `Has recibido una nueva orden de Juan Pérez por "Producto de Prueba" por $25.99`,
          data: {
            orderId: 'order_123',
            productTitle: 'Producto de Prueba',
            buyerName: 'Juan Pérez',
            total: 25.99,
            action: 'view_order'
          }
        },
        {
          type: 'STOCK_LOW',
          title: 'Stock Bajo',
          message: 'El producto "Camiseta Básica" tiene solo 3 unidades en stock',
          data: {
            productId: 'prod_123',
            productTitle: 'Camiseta Básica',
            currentStock: 3,
            threshold: 5,
            action: 'update_stock'
          }
        },
        {
          type: 'ORDER_STATUS_CHANGED',
          title: 'Estado de Orden Actualizado',
          message: 'Tu orden de "Zapatos Deportivos" ahora está: CONFIRMED',
          data: {
            orderId: 'order_456',
            productTitle: 'Zapatos Deportivos',
            newStatus: 'CONFIRMED',
            sellerName: 'María García',
            action: 'view_order'
          }
        }
      ];

      for (const notification of notifications) {
        await NotificationService.createNotification(
          user.id,
          notification.type,
          notification.title,
          notification.message,
          notification.data
        );
      }
    }

    console.log(`✅ Created ${notifications.length * users.length} sample notifications`);
    console.log('✅ Notification seeding completed successfully');

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
