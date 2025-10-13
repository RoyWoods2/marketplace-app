const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding completo de datos de prueba...');

  try {
    // Limpiar datos existentes (opcional - comentar si quieres mantener datos existentes)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.notification.deleteMany();
    await prisma.reel.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();

    // Crear sucursales
    console.log('🏢 Creando sucursales...');
    const branches = await Promise.all([
      prisma.branch.create({
        data: {
          name: 'Sucursal Centro',
          address: 'Av. Principal 123, Centro',
          phone: '+1234567890',
          email: 'centro@marketplace.com',
          isActive: true,
        },
      }),
      prisma.branch.create({
        data: {
          name: 'Sucursal Norte',
          address: 'Calle Norte 456, Zona Norte',
          phone: '+1234567891',
          email: 'norte@marketplace.com',
          isActive: true,
        },
      }),
      prisma.branch.create({
        data: {
          name: 'Sucursal Sur',
          address: 'Av. Sur 789, Zona Sur',
          phone: '+1234567892',
          email: 'sur@marketplace.com',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Creadas ${branches.length} sucursales`);

    // Crear usuarios
    console.log('👥 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Admin
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@marketplace.com',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        userType: 'ADMIN',
        phone: '+1234567893',
        whatsapp: '+1234567893',
        instagram: '@admin_marketplace',
        facebook: 'admin.marketplace',
        companyName: 'Marketplace Admin',
        bio: 'Administrador del sistema de marketplace',
      },
    });

    // Vendedores
    const sellers = await Promise.all([
      prisma.user.create({
        data: {
          username: 'vendedor1',
          email: 'vendedor1@example.com',
          password: hashedPassword,
          firstName: 'María',
          lastName: 'González',
          userType: 'SELLER',
          phone: '+1234567894',
          whatsapp: '+1234567894',
          instagram: '@maria_artesana',
          facebook: 'maria.gonzalez.artesana',
          companyName: 'Artesanías María',
          bio: 'Especialista en artesanías hechas a mano',
        },
      }),
      prisma.user.create({
        data: {
          username: 'vendedor2',
          email: 'vendedor2@example.com',
          password: hashedPassword,
          firstName: 'Carlos',
          lastName: 'Rodríguez',
          userType: 'SELLER',
          phone: '+1234567895',
          whatsapp: '+1234567895',
          instagram: '@carlos_cocina',
          facebook: 'carlos.rodriguez.cocina',
          companyName: 'Delicias de Carlos',
          bio: 'Chef especializado en repostería artesanal',
        },
      }),
      prisma.user.create({
        data: {
          username: 'vendedor3',
          email: 'vendedor3@example.com',
          password: hashedPassword,
          firstName: 'Ana',
          lastName: 'Martínez',
          userType: 'SELLER',
          phone: '+1234567896',
          whatsapp: '+1234567896',
          instagram: '@ana_jewelry',
          facebook: 'ana.martinez.jewelry',
          companyName: 'Joyería Ana',
          bio: 'Diseñadora de joyas únicas y personalizadas',
        },
      }),
    ]);

    // Clientes
    const clients = await Promise.all([
      prisma.user.create({
        data: {
          username: 'cliente1',
          email: 'cliente1@example.com',
          password: hashedPassword,
          firstName: 'Juan',
          lastName: 'Pérez',
          userType: 'CLIENT',
          phone: '+1234567897',
          whatsapp: '+1234567897',
          instagram: '@juan_perez',
          facebook: 'juan.perez',
          bio: 'Amante de las artesanías y productos únicos',
        },
      }),
      prisma.user.create({
        data: {
          username: 'cliente2',
          email: 'cliente2@example.com',
          password: hashedPassword,
          firstName: 'Laura',
          lastName: 'Sánchez',
          userType: 'CLIENT',
          phone: '+1234567898',
          whatsapp: '+1234567898',
          instagram: '@laura_sanchez',
          facebook: 'laura.sanchez',
          bio: 'Coleccionista de joyas y accesorios únicos',
        },
      }),
      prisma.user.create({
        data: {
          username: 'cliente3',
          email: 'cliente3@example.com',
          password: hashedPassword,
          firstName: 'Pedro',
          lastName: 'López',
          userType: 'CLIENT',
          phone: '+1234567899',
          whatsapp: '+1234567899',
          instagram: '@pedro_lopez',
          facebook: 'pedro.lopez',
          bio: 'Fanático de la repostería artesanal',
        },
      }),
    ]);

    console.log(`✅ Creados ${1 + sellers.length + clients.length} usuarios`);

    // Crear productos
    console.log('📦 Creando productos...');
    const products = await Promise.all([
      // Productos de María (Artesanías)
      prisma.product.create({
        data: {
          title: 'Macramé Decorativo',
          description: 'Hermoso macramé hecho a mano para decorar tu hogar. Incluye planta suculenta.',
          price: 25.99,
          stock: 10,
          category: 'Artesanías',
          images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
          userId: sellers[0].id,
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          title: 'Jarrón de Cerámica',
          description: 'Jarrón de cerámica artesanal con diseño único. Perfecto para flores secas.',
          price: 45.00,
          stock: 5,
          category: 'Artesanías',
          images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'],
          userId: sellers[0].id,
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          title: 'Mantel Bordado',
          description: 'Mantel bordado a mano con motivos tradicionales. 100% algodón.',
          price: 35.50,
          stock: 8,
          category: 'Textiles',
          images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
          userId: sellers[0].id,
          isActive: true,
        },
      }),

      // Productos de Carlos (Repostería)
      prisma.product.create({
        data: {
          title: 'Torta de Chocolate',
          description: 'Deliciosa torta de chocolate con relleno de ganache. Perfecta para ocasiones especiales.',
          price: 28.99,
          stock: 3,
          category: 'Repostería',
          images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'],
          userId: sellers[1].id,
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          title: 'Cupcakes Personalizados',
          description: 'Set de 6 cupcakes con decoración personalizada. Sabores a elegir.',
          price: 18.50,
          stock: 15,
          category: 'Repostería',
          images: ['https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'],
          userId: sellers[1].id,
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          title: 'Galletas Decoradas',
          description: 'Paquete de 12 galletas decoradas con glaseado real. Diseños personalizados.',
          price: 22.00,
          stock: 20,
          category: 'Repostería',
          images: ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400'],
          userId: sellers[1].id,
          isActive: true,
        },
      }),

      // Productos de Ana (Joyería)
      prisma.product.create({
        data: {
          title: 'Collar de Plata',
          description: 'Elegante collar de plata 925 con piedra semipreciosa. Diseño exclusivo.',
          price: 85.00,
          stock: 4,
          category: 'Joyería',
          images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'],
          userId: sellers[2].id,
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          title: 'Anillo de Oro',
          description: 'Anillo de oro 18k con diseño minimalista. Disponible en varios tallas.',
          price: 120.00,
          stock: 2,
          category: 'Joyería',
          images: ['https://images.unsplash.com/photo-1603561596112-db7d5c1a7b86?w=400'],
          userId: sellers[2].id,
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          title: 'Pulsera de Perlas',
          description: 'Pulsera de perlas naturales con cierre de oro. Elegante y versátil.',
          price: 65.00,
          stock: 6,
          category: 'Joyería',
          images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'],
          userId: sellers[2].id,
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Creados ${products.length} productos`);

    // Crear órdenes de prueba
    console.log('🛒 Creando órdenes de prueba...');
    const orders = await Promise.all([
      // Orden 1: Cliente 1 -> Producto de María
      prisma.order.create({
        data: {
          userId: clients[0].id,
          productId: products[0].id,
          quantity: 1,
          status: 'PAYMENT_CONFIRMED',
          paymentMethod: 'TRANSFERENCIA',
          notes: 'Por favor, entregar en sucursal centro',
          branchId: branches[0].id,
          pickupCode: 'PC001',
          qrCode: 'QR001',
          qrSecretToken: 'secret001',
          total: 25.99,
        },
      }),
      // Orden 2: Cliente 2 -> Producto de Carlos
      prisma.order.create({
        data: {
          userId: clients[1].id,
          productId: products[3].id,
          quantity: 1,
          status: 'PREPARING',
          paymentMethod: 'EFECTIVO',
          notes: 'Torta sin nueces por alergia',
          branchId: branches[1].id,
          pickupCode: 'PC002',
          qrCode: 'QR002',
          qrSecretToken: 'secret002',
          total: 28.99,
        },
      }),
      // Orden 3: Cliente 3 -> Producto de Ana
      prisma.order.create({
        data: {
          userId: clients[2].id,
          productId: products[6].id,
          quantity: 1,
          status: 'READY_FOR_PICKUP',
          paymentMethod: 'TRANSFERENCIA',
          notes: 'Anillo talla 7',
          branchId: branches[2].id,
          pickupCode: 'PC003',
          qrCode: 'QR003',
          qrSecretToken: 'secret003',
          total: 85.00,
        },
      }),
      // Orden 4: Cliente 1 -> Producto de Carlos
      prisma.order.create({
        data: {
          userId: clients[0].id,
          productId: products[4].id,
          quantity: 2,
          status: 'PENDING',
          paymentMethod: 'EFECTIVO',
          notes: 'Cupcakes de chocolate y vainilla',
          branchId: branches[0].id,
          pickupCode: 'PC004',
          qrCode: 'QR004',
          qrSecretToken: 'secret004',
          total: 37.00, // 2 cupcakes a $18.50 cada uno
        },
      }),
    ]);

    console.log(`✅ Creadas ${orders.length} órdenes`);

    // Crear notificaciones de prueba
    console.log('🔔 Creando notificaciones de prueba...');
    const notifications = await Promise.all([
      // Notificaciones para vendedores
      prisma.notification.create({
        data: {
          userId: sellers[0].id,
          type: 'ORDER_CREATED',
          title: 'Nueva Orden Recibida',
          message: 'Tienes una nueva orden: Macramé Decorativo',
          data: { orderId: orders[0].id, productId: products[0].id },
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: sellers[1].id,
          type: 'ORDER_CREATED',
          title: 'Nueva Orden Recibida',
          message: 'Tienes una nueva orden: Torta de Chocolate',
          data: { orderId: orders[1].id, productId: products[3].id },
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: sellers[2].id,
          type: 'ORDER_CREATED',
          title: 'Nueva Orden Recibida',
          message: 'Tienes una nueva orden: Collar de Plata',
          data: { orderId: orders[2].id, productId: products[6].id },
          isRead: true,
        },
      }),
      // Notificaciones para clientes
      prisma.notification.create({
        data: {
          userId: clients[0].id,
          type: 'ORDER_STATUS_CHANGED',
          title: 'Orden Confirmada',
          message: 'Tu orden de Macramé Decorativo ha sido confirmada',
          data: { orderId: orders[0].id },
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: clients[1].id,
          type: 'ORDER_STATUS_CHANGED',
          title: 'Orden en Preparación',
          message: 'Tu orden de Torta de Chocolate está siendo preparada',
          data: { orderId: orders[1].id },
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: clients[2].id,
          type: 'PRODUCT_READY',
          title: 'Producto Listo para Retiro',
          message: 'Tu Collar de Plata está listo para retirar en Sucursal Sur',
          data: { orderId: orders[2].id, branchId: branches[2].id },
          isRead: false,
        },
      }),
    ]);

    console.log(`✅ Creadas ${notifications.length} notificaciones`);

    // Crear reels de prueba
    console.log('🎬 Creando reels de prueba...');
    const reels = await Promise.all([
      // Reels de María (Artesanías)
      prisma.reel.create({
        data: {
          title: 'Proceso de Macramé',
          description: 'Te muestro cómo hago este hermoso macramé paso a paso ✨',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
          duration: 120, // 2 minutos
          views: 1250,
          likes: 89,
          userId: sellers[0].id,
          productId: products[0].id,
          isActive: true,
        },
      }),
      prisma.reel.create({
        data: {
          title: 'Cerámica en Acción',
          description: 'Momentos únicos en mi taller de cerámica 🏺',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          duration: 90, // 1.5 minutos
          views: 890,
          likes: 67,
          userId: sellers[0].id,
          productId: products[1].id,
          isActive: true,
        },
      }),

      // Reels de Carlos (Repostería)
      prisma.reel.create({
        data: {
          title: 'Decorando Torta de Chocolate',
          description: 'Día perfecto para decorar esta deliciosa torta 🍫',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
          duration: 180, // 3 minutos
          views: 2100,
          likes: 156,
          userId: sellers[1].id,
          productId: products[3].id,
          isActive: true,
        },
      }),
      prisma.reel.create({
        data: {
          title: 'Cupcakes Decorados',
          description: 'Set de cupcakes con decoración personalizada 🧁',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400',
          duration: 150, // 2.5 minutos
          views: 1680,
          likes: 134,
          userId: sellers[1].id,
          productId: products[4].id,
          isActive: true,
        },
      }),
      prisma.reel.create({
        data: {
          title: 'Galletas de Temporada',
          description: 'Galletas decoradas para esta época del año 🍪',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
          duration: 100, // 1.6 minutos
          views: 950,
          likes: 78,
          userId: sellers[1].id,
          productId: products[5].id,
          isActive: true,
        },
      }),

      // Reels de Ana (Joyería)
      prisma.reel.create({
        data: {
          title: 'Creando Collar de Plata',
          description: 'Proceso artesanal de creación de joyería 💎',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
          duration: 240, // 4 minutos
          views: 3200,
          likes: 245,
          userId: sellers[2].id,
          productId: products[6].id,
          isActive: true,
        },
      }),
      prisma.reel.create({
        data: {
          title: 'Anillo de Oro Minimalista',
          description: 'Diseño elegante y minimalista en oro 18k ✨',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1603561596112-db7d5c1a7b86?w=400',
          duration: 200, // 3.3 minutos
          views: 2800,
          likes: 198,
          userId: sellers[2].id,
          productId: products[7].id,
          isActive: true,
        },
      }),
      prisma.reel.create({
        data: {
          title: 'Pulsera de Perlas',
          description: 'Pulsera elegante con perlas naturales 🌟',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
          duration: 160, // 2.6 minutos
          views: 1450,
          likes: 112,
          userId: sellers[2].id,
          productId: products[8].id,
          isActive: true,
        },
      }),

      // Reels sin producto asociado (contenido general)
      prisma.reel.create({
        data: {
          title: 'Tips de Artesanía',
          description: 'Consejos útiles para principiantes en artesanía 🎨',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
          duration: 300, // 5 minutos
          views: 4500,
          likes: 320,
          userId: sellers[0].id,
          productId: null, // Reel educativo sin producto específico
          isActive: true,
        },
      }),
      prisma.reel.create({
        data: {
          title: 'Secretos de Repostería',
          description: 'Los mejores secretos para repostería perfecta 🍰',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
          duration: 270, // 4.5 minutos
          views: 3800,
          likes: 285,
          userId: sellers[1].id,
          productId: null, // Reel educativo sin producto específico
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Creados ${reels.length} reels`);

    // Mostrar resumen
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log(`🏢 Sucursales: ${branches.length}`);
    console.log(`👥 Usuarios: ${1 + sellers.length + clients.length} (1 Admin, ${sellers.length} Vendedores, ${clients.length} Clientes)`);
    console.log(`📦 Productos: ${products.length}`);
    console.log(`🛒 Órdenes: ${orders.length}`);
    console.log(`🔔 Notificaciones: ${notifications.length}`);
    console.log(`🎬 Reels: ${reels.length}`);

    console.log('\n🔑 CREDENCIALES DE PRUEBA:');
    console.log('Admin: admin@marketplace.com / 123456');
    console.log('Vendedor 1: vendedor1@example.com / 123456');
    console.log('Vendedor 2: vendedor2@example.com / 123456');
    console.log('Vendedor 3: vendedor3@example.com / 123456');
    console.log('Cliente 1: cliente1@example.com / 123456');
    console.log('Cliente 2: cliente2@example.com / 123456');
    console.log('Cliente 3: cliente3@example.com / 123456');

    console.log('\n✅ ¡Seeding completado exitosamente!');

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
