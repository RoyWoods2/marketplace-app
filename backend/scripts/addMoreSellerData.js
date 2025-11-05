const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addMoreSellerData() {
  try {
    console.log('📊 Agregando más datos de ventas e ingresos para vendedor1...');

    // Buscar el vendedor1
    const seller = await prisma.user.findUnique({
      where: { email: 'vendedor1@example.com' },
      include: {
        products: true,
      },
    });

    if (!seller) {
      console.error('❌ Vendedor no encontrado');
      return;
    }

    console.log(`✅ Vendedor encontrado: ${seller.firstName} ${seller.lastName}`);
    console.log(`📦 Productos disponibles: ${seller.products.length}`);

    if (seller.products.length === 0) {
      console.error('❌ El vendedor no tiene productos');
      return;
    }

    // Buscar clientes para crear órdenes
    const clients = await prisma.user.findMany({
      where: { userType: 'CLIENT' },
      take: 5,
    });

    if (clients.length === 0) {
      console.error('❌ No hay clientes disponibles');
      return;
    }

    console.log(`👥 Clientes disponibles: ${clients.length}`);

    // Buscar sucursales
    const branches = await prisma.branch.findMany({
      take: 3,
    });

    // Generar órdenes para los últimos 90 días
    const orders = [];
    const now = new Date();
    const products = seller.products;

    // Crear órdenes distribuidas en los últimos 90 días
    for (let day = 0; day < 90; day++) {
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - day);
      
      // Crear 0-3 órdenes por día (aleatorio pero con más probabilidad en días recientes)
      const ordersPerDay = day < 7 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 2);
      
      for (let i = 0; i < ordersPerDay; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const client = clients[Math.floor(Math.random() * clients.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const total = product.price * quantity;

        // Estados variados (más entregadas en días pasados)
        const statusOptions = ['PENDING', 'PAYMENT_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'DELIVERED', 'DELIVERED'];
        const status = day < 7 
          ? statusOptions[Math.floor(Math.random() * 4)] // Días recientes: estados más tempranos
          : statusOptions[Math.floor(Math.random() * statusOptions.length)]; // Días pasados: más variados

        // Tipo de entrega aleatorio
        const deliveryType = Math.random() > 0.5 ? 'PICKUP' : 'DELIVERY';
        const branch = deliveryType === 'PICKUP' && branches.length > 0 
          ? branches[Math.floor(Math.random() * branches.length)] 
          : null;

        // Generar QR codes únicos
        const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const qrSecretToken = `SECRET-${Math.random().toString(36).substr(2, 16)}`;
        const pickupCode = `PC-${Math.floor(Math.random() * 10000)}`;

        // Crear fecha con hora aleatoria del día
        const orderDateTime = new Date(orderDate);
        orderDateTime.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8 AM y 8 PM
        orderDateTime.setMinutes(Math.floor(Math.random() * 60));

        orders.push({
          userId: client.id,
          productId: product.id,
          quantity,
          total,
          status,
          deliveryType,
          deliveryAddress: deliveryType === 'DELIVERY' 
            ? `Calle ${Math.floor(Math.random() * 1000)}, Departamento ${Math.floor(Math.random() * 100)}`
            : null,
          branchId: branch?.id || null,
          qrCode,
          qrSecretToken,
          pickupCode,
          paymentMethod: Math.random() > 0.5 ? 'TRANSFERENCIA' : 'EFECTIVO',
          notes: Math.random() > 0.7 ? `Nota especial ${Math.floor(Math.random() * 100)}` : null,
          createdAt: orderDateTime,
          updatedAt: orderDateTime,
        });
      }
    }

    console.log(`📝 Creando ${orders.length} órdenes...`);

    // Crear órdenes en lotes para mejor rendimiento
    const batchSize = 50;
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      await prisma.order.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`✅ Creadas ${Math.min(i + batchSize, orders.length)}/${orders.length} órdenes`);
    }

    // Actualizar estadísticas del vendedor
    const allOrders = await prisma.order.findMany({
      where: {
        product: {
          userId: seller.id,
        },
        status: 'DELIVERED',
      },
    });

    const totalSales = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    const productsSold = allOrders.reduce((sum, order) => sum + order.quantity, 0);

    await prisma.sellerStats.upsert({
      where: { userId: seller.id },
      update: {
        totalSales,
        totalRevenue,
        productsSold,
        lastUpdated: new Date(),
      },
      create: {
        userId: seller.id,
        totalSales,
        totalRevenue,
        productsSold,
      },
    });

    console.log('\n📊 RESUMEN DE DATOS AGREGADOS:');
    console.log(`🛒 Órdenes creadas: ${orders.length}`);
    console.log(`💰 Ventas totales: ${totalSales}`);
    console.log(`💵 Ingresos totales: $${totalRevenue.toFixed(2)}`);
    console.log(`📦 Productos vendidos: ${productsSold}`);

    // Distribución por estado
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    console.log('\n📈 Distribución por Estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n✅ ¡Datos agregados exitosamente!');

  } catch (error) {
    console.error('❌ Error agregando datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMoreSellerData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

