const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración de nuevas funcionalidades...');

  try {
    // 1. Crear sucursales por defecto
    console.log('📦 Creando sucursales por defecto...');
    
    const branch1 = await prisma.branch.upsert({
      where: { id: 'default_branch_1' },
      update: {},
      create: {
        id: 'default_branch_1',
        name: 'Sucursal Principal',
        address: 'Av. Principal 123, Ciudad',
        phone: '+1234567890',
        email: 'principal@marketplace.com',
      },
    });

    const branch2 = await prisma.branch.upsert({
      where: { id: 'default_branch_2' },
      update: {},
      create: {
        id: 'default_branch_2',
        name: 'Sucursal Norte',
        address: 'Calle Norte 456, Ciudad',
        phone: '+1234567891',
        email: 'norte@marketplace.com',
      },
    });

    console.log('✅ Sucursales creadas:', branch1.name, branch2.name);

    // 2. Crear usuario administrador por defecto
    console.log('👤 Creando usuario administrador...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@marketplace.com' },
      update: {},
      create: {
        email: 'admin@marketplace.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        userType: 'ADMIN',
        isActive: true,
        phone: '+1234567890',
      },
    });

    console.log('✅ Usuario administrador creado:', admin.username);

    // 3. Crear usuario vendedor de prueba
    console.log('👤 Creando usuario vendedor de prueba...');
    
    const sellerPassword = await bcrypt.hash('vendedor123', 10);
    
    const seller = await prisma.user.upsert({
      where: { email: 'vendedor@test.com' },
      update: {},
      create: {
        email: 'vendedor@test.com',
        username: 'vendedor_test',
        password: sellerPassword,
        firstName: 'Juan',
        lastName: 'Vendedor',
        userType: 'SELLER',
        isActive: true,
        phone: '+1234567892',
        whatsapp: '+1234567892',
        instagram: 'juan_vendedor',
        facebook: 'juan.vendedor',
        companyName: 'Emprendimiento Juan',
      },
    });

    console.log('✅ Usuario vendedor creado:', seller.username);

    // 4. Crear usuario cliente de prueba
    console.log('👤 Creando usuario cliente de prueba...');
    
    const clientPassword = await bcrypt.hash('cliente123', 10);
    
    const client = await prisma.user.upsert({
      where: { email: 'cliente@test.com' },
      update: {},
      create: {
        email: 'cliente@test.com',
        username: 'cliente_test',
        password: clientPassword,
        firstName: 'María',
        lastName: 'Cliente',
        userType: 'CLIENT',
        isActive: true,
        phone: '+1234567893',
      },
    });

    console.log('✅ Usuario cliente creado:', client.username);

    // 5. Crear productos de prueba para el vendedor
    console.log('🛍️ Creando productos de prueba...');
    
    const product1 = await prisma.product.upsert({
      where: { id: 'test_product_1' },
      update: {},
      create: {
        id: 'test_product_1',
        title: 'Artesanía en Madera',
        description: 'Hermosa artesanía tallada a mano en madera de roble',
        price: 150.00,
        images: ['https://via.placeholder.com/300x300/8B4513/FFFFFF?text=Artesania+Madera'],
        category: 'Artesanías',
        stock: 5,
        userId: seller.id,
      },
    });

    const product2 = await prisma.product.upsert({
      where: { id: 'test_product_2' },
      update: {},
      create: {
        id: 'test_product_2',
        title: 'Jabones Artesanales',
        description: 'Jabones naturales hechos con ingredientes orgánicos',
        price: 25.00,
        images: ['https://via.placeholder.com/300x300/87CEEB/FFFFFF?text=Jabones+Naturales'],
        category: 'Belleza',
        stock: 20,
        userId: seller.id,
      },
    });

    console.log('✅ Productos de prueba creados:', product1.title, product2.title);

    // 6. Crear orden de prueba con el nuevo flujo
    console.log('📦 Creando orden de prueba...');
    
    const { generateQRCode } = require('../src/services/QRService');
    const { qrCode, qrSecretToken } = generateQRCode('test_order_1');
    
    const order = await prisma.order.upsert({
      where: { id: 'test_order_1' },
      update: {},
      create: {
        id: 'test_order_1',
        userId: client.id,
        productId: product1.id,
        total: product1.price,
        quantity: 1,
        qrCode,
        qrSecretToken,
        status: 'PENDING',
        branchId: branch1.id,
        notes: 'Orden de prueba para el nuevo flujo',
      },
    });

    console.log('✅ Orden de prueba creada:', order.id);

    // 7. Crear configuraciones de usuario
    console.log('⚙️ Creando configuraciones de usuario...');
    
    await prisma.userSettings.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        notificationsEnabled: true,
        stockAlertsEnabled: true,
        orderAlertsEnabled: true,
      },
    });

    await prisma.userSettings.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        userId: seller.id,
        notificationsEnabled: true,
        stockAlertsEnabled: true,
        orderAlertsEnabled: true,
      },
    });

    await prisma.userSettings.upsert({
      where: { userId: client.id },
      update: {},
      create: {
        userId: client.id,
        notificationsEnabled: true,
        stockAlertsEnabled: false,
        orderAlertsEnabled: true,
      },
    });

    console.log('✅ Configuraciones de usuario creadas');

    // 8. Crear estadísticas de vendedor
    console.log('📊 Creando estadísticas de vendedor...');
    
    await prisma.sellerStats.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        userId: seller.id,
        totalSales: 0,
        totalRevenue: 0,
        productsSold: 0,
      },
    });

    console.log('✅ Estadísticas de vendedor creadas');

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n📋 Resumen de datos creados:');
    console.log(`- Sucursales: ${branch1.name}, ${branch2.name}`);
    console.log(`- Usuario Admin: ${admin.username} (admin@marketplace.com / admin123)`);
    console.log(`- Usuario Vendedor: ${seller.username} (vendedor@test.com / vendedor123)`);
    console.log(`- Usuario Cliente: ${client.username} (cliente@test.com / cliente123)`);
    console.log(`- Productos: ${product1.title}, ${product2.title}`);
    console.log(`- Orden de prueba: ${order.id}`);
    console.log('\n💡 Puedes usar estos datos para probar el sistema completo.');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });
