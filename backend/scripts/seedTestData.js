const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  try {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await Promise.all([
      // Vendedor 1
      prisma.user.upsert({
        where: { email: 'vendedor1@test.com' },
        update: {},
        create: {
          email: 'vendedor1@test.com',
          username: 'vendedor1',
          password: hashedPassword,
          firstName: 'María',
          lastName: 'García',
          bio: 'Vendedora de ropa y accesorios',
          phone: '+1234567890',
          whatsapp: '+1234567890',
          instagram: 'maria_style',
          companyName: 'María Style'
        }
      }),
      // Vendedor 2
      prisma.user.upsert({
        where: { email: 'vendedor2@test.com' },
        update: {},
        create: {
          email: 'vendedor2@test.com',
          username: 'vendedor2',
          password: hashedPassword,
          firstName: 'Carlos',
          lastName: 'López',
          bio: 'Especialista en electrónicos',
          phone: '+1234567891',
          whatsapp: '+1234567891',
          instagram: 'carlos_electronics',
          companyName: 'Carlos Electronics'
        }
      }),
      // Comprador 1
      prisma.user.upsert({
        where: { email: 'comprador1@test.com' },
        update: {},
        create: {
          email: 'comprador1@test.com',
          username: 'comprador1',
          password: hashedPassword,
          firstName: 'Ana',
          lastName: 'Martínez',
          bio: 'Amante de la moda y tecnología',
          phone: '+1234567892',
          whatsapp: '+1234567892',
          instagram: 'ana_shopper'
        }
      }),
      // Comprador 2
      prisma.user.upsert({
        where: { email: 'comprador2@test.com' },
        update: {},
        create: {
          email: 'comprador2@test.com',
          username: 'comprador2',
          password: hashedPassword,
          firstName: 'Luis',
          lastName: 'Rodríguez',
          bio: 'Comprador frecuente',
          phone: '+1234567893',
          whatsapp: '+1234567893',
          instagram: 'luis_buyer'
        }
      })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create products for sellers
    const products = await Promise.all([
      // Productos de María
      prisma.product.create({
        data: {
          title: 'Vestido Elegante Negro',
          description: 'Vestido perfecto para ocasiones especiales',
          price: 89.99,
          images: ['https://via.placeholder.com/300x400/000000/FFFFFF?text=Vestido+Negro'],
          category: 'Ropa',
          stock: 5,
          userId: users[0].id
        }
      }),
      prisma.product.create({
        data: {
          title: 'Bolso de Cuero Marrón',
          description: 'Bolso de cuero genuino, perfecto para el día a día',
          price: 129.99,
          images: ['https://via.placeholder.com/300x300/8B4513/FFFFFF?text=Bolso+Cuero'],
          category: 'Accesorios',
          stock: 3,
          userId: users[0].id
        }
      }),
      prisma.product.create({
        data: {
          title: 'Zapatos de Tacón Rojo',
          description: 'Zapatos elegantes de tacón alto',
          price: 79.99,
          images: ['https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Zapatos+Rojo'],
          category: 'Calzado',
          stock: 0, // Sin stock para probar alertas
          userId: users[0].id
        }
      }),
      // Productos de Carlos
      prisma.product.create({
        data: {
          title: 'iPhone 14 Pro',
          description: 'Smartphone de última generación',
          price: 999.99,
          images: ['https://via.placeholder.com/300x300/000000/FFFFFF?text=iPhone+14'],
          category: 'Electrónicos',
          stock: 2,
          userId: users[1].id
        }
      }),
      prisma.product.create({
        data: {
          title: 'AirPods Pro',
          description: 'Auriculares inalámbricos con cancelación de ruido',
          price: 249.99,
          images: ['https://via.placeholder.com/300x300/FFFFFF/000000?text=AirPods'],
          category: 'Electrónicos',
          stock: 8,
          userId: users[1].id
        }
      }),
      prisma.product.create({
        data: {
          title: 'MacBook Air M2',
          description: 'Laptop ultradelgada con chip M2',
          price: 1199.99,
          images: ['https://via.placeholder.com/300x300/CCCCCC/000000?text=MacBook'],
          category: 'Electrónicos',
          stock: 1, // Stock bajo
          userId: users[1].id
        }
      })
    ]);

    console.log(`✅ Created ${products.length} products`);

    // Create orders
    const orders = await Promise.all([
      // Orden de Ana (comprador1) comprando a María (vendedor1)
      prisma.order.create({
        data: {
          userId: users[2].id, // Ana
          productId: products[0].id, // Vestido
          total: products[0].price,
          status: 'PENDING'
        }
      }),
      // Orden de Luis (comprador2) comprando a Carlos (vendedor2)
      prisma.order.create({
        data: {
          userId: users[3].id, // Luis
          productId: products[3].id, // iPhone
          total: products[3].price,
          status: 'CONFIRMED'
        }
      }),
      // Orden completada
      prisma.order.create({
        data: {
          userId: users[2].id, // Ana
          productId: products[1].id, // Bolso
          total: products[1].price,
          status: 'DELIVERED'
        }
      })
    ]);

    console.log(`✅ Created ${orders.length} orders`);

    // Create seller stats
    await Promise.all([
      prisma.sellerStats.upsert({
        where: { userId: users[0].id },
        update: {
          totalSales: 1,
          totalRevenue: products[1].price,
          productsSold: 1
        },
        create: {
          userId: users[0].id,
          totalSales: 1,
          totalRevenue: products[1].price,
          productsSold: 1
        }
      }),
      prisma.sellerStats.upsert({
        where: { userId: users[1].id },
        update: {
          totalSales: 1,
          totalRevenue: products[3].price,
          productsSold: 1
        },
        create: {
          userId: users[1].id,
          totalSales: 1,
          totalRevenue: products[3].price,
          productsSold: 1
        }
      })
    ]);

    console.log('✅ Created seller stats');

    // Create user settings
    await Promise.all(
      users.map(user =>
        prisma.userSettings.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id }
        })
      )
    );

    console.log('✅ Created user settings');

    // Create sample notifications
    const NotificationService = require('../src/services/NotificationService');

    // Notificación para María sobre nueva orden
    await NotificationService.createNotification(
      users[0].id,
      'ORDER_CREATED',
      'Nueva Orden Recibida',
      `Has recibido una nueva orden de ${users[2].firstName} ${users[2].lastName} por "${products[0].title}" por $${products[0].price}`,
      {
        orderId: orders[0].id,
        productTitle: products[0].title,
        buyerName: `${users[2].firstName} ${users[2].lastName}`,
        total: products[0].price
      }
    );

    // Notificación de stock bajo para Carlos
    await NotificationService.createNotification(
      users[1].id,
      'STOCK_LOW',
      'Stock Bajo',
      `El producto "${products[5].title}" tiene solo ${products[5].stock} unidades en stock`,
      {
        productId: products[5].id,
        productTitle: products[5].title,
        currentStock: products[5].stock,
        threshold: 5
      }
    );

    // Notificación de stock agotado para María
    await NotificationService.createNotification(
      users[0].id,
      'STOCK_OUT',
      'Sin Stock',
      `El producto "${products[2].title}" se ha quedado sin stock`,
      {
        productId: products[2].id,
        productTitle: products[2].title
      }
    );

    console.log('✅ Created sample notifications');

    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📱 Test Accounts:');
    console.log('Vendedor 1: vendedor1@test.com / password123');
    console.log('Vendedor 2: vendedor2@test.com / password123');
    console.log('Comprador 1: comprador1@test.com / password123');
    console.log('Comprador 2: comprador2@test.com / password123');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

