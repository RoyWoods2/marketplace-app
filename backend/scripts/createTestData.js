const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Creando datos de prueba...');

    // Crear superusuario admin
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@marketplace.com' },
      update: {
        phone: '+56985710114',
        whatsapp: '+56985710114',
        instagram: '__cnp_',
        companyName: 'Tech Solutions Pro',
      },
      create: {
        email: 'admin@marketplace.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        bio: 'Superusuario del marketplace',
        phone: '+56985710114',
        whatsapp: '+56985710114',
        instagram: '__cnp_',
        companyName: 'Tech Solutions Pro',
      },
    });

    console.log('✅ Superusuario creado:', adminUser.email);

    // Crear usuario de prueba
    const testUser = await prisma.user.upsert({
      where: { email: 'test@marketplace.com' },
      update: {},
      create: {
        email: 'test@marketplace.com',
        username: 'testuser',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        bio: 'Usuario de prueba',
        phone: '+0987654321',
        whatsapp: '+0987654321',
        instagram: 'test_user',
        companyName: 'Fashion Store',
      },
    });

    console.log('✅ Usuario de prueba creado:', testUser.email);

    // Crear más usuarios de prueba
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'fashion@marketplace.com' },
        update: {},
        create: {
          email: 'fashion@marketplace.com',
          username: 'fashionista',
          password: hashedPassword,
          firstName: 'María',
          lastName: 'González',
          bio: 'Especialista en moda y tendencias',
          phone: '+56987654321',
          whatsapp: '+56987654321',
          instagram: 'maria_fashion',
          companyName: 'Fashion Boutique',
        },
      }),
      prisma.user.upsert({
        where: { email: 'tech@marketplace.com' },
        update: {},
        create: {
          email: 'tech@marketplace.com',
          username: 'techguru',
          password: hashedPassword,
          firstName: 'Carlos',
          lastName: 'Rodríguez',
          bio: 'Especialista en tecnología y gadgets',
          phone: '+56912345678',
          whatsapp: '+56912345678',
          instagram: 'carlos_tech',
          companyName: 'TechGadgets Pro',
        },
      }),
      prisma.user.upsert({
        where: { email: 'home@marketplace.com' },
        update: {},
        create: {
          email: 'home@marketplace.com',
          username: 'homedecor',
          password: hashedPassword,
          firstName: 'Ana',
          lastName: 'Martínez',
          bio: 'Decoradora de interiores',
          phone: '+56998765432',
          whatsapp: '+56998765432',
          instagram: 'ana_home',
          companyName: 'Home Decor Studio',
        },
      }),
      prisma.user.upsert({
        where: { email: 'sports@marketplace.com' },
        update: {},
        create: {
          email: 'sports@marketplace.com',
          username: 'sportsman',
          password: hashedPassword,
          firstName: 'Luis',
          lastName: 'Fernández',
          bio: 'Entrenador personal y vendedor de equipos deportivos',
          phone: '+56945678901',
          whatsapp: '+56945678901',
          instagram: 'luis_sports',
          companyName: 'Sports World',
        },
      }),
    ]);

    console.log('✅ Usuarios adicionales creados:', users.length);

    // Crear productos de prueba
    const products = await Promise.all([
      prisma.product.upsert({
        where: { id: 'product-1' },
        update: {},
        create: {
          id: 'product-1',
          title: 'iPhone 15 Pro',
          description: 'El último iPhone con características avanzadas',
          price: 999.99,
          images: ['https://via.placeholder.com/400x300/007AFF/FFFFFF?text=iPhone+15+Pro'],
          category: 'Electrónicos',
          stock: 5,
          userId: adminUser.id,
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-2' },
        update: {},
        create: {
          id: 'product-2',
          title: 'Nike Air Max',
          description: 'Zapatillas deportivas cómodas y elegantes',
          price: 120.00,
          images: ['https://via.placeholder.com/400x300/FF3B30/FFFFFF?text=Nike+Air+Max'],
          category: 'Ropa',
          stock: 10,
          userId: testUser.id,
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-3' },
        update: {},
        create: {
          id: 'product-3',
          title: 'MacBook Pro M3 14"',
          description: 'Laptop profesional con chip M3, pantalla Liquid Retina XDR de 14 pulgadas, 16GB RAM, 512GB SSD.',
          price: 2499.99,
          images: ['https://via.placeholder.com/400x300/007AFF/FFFFFF?text=MacBook+Pro+M3'],
          category: 'Tecnología',
          stock: 3,
          userId: users[1].id, // techguru
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-4' },
        update: {},
        create: {
          id: 'product-4',
          title: 'Vestido Elegante Negro',
          description: 'Vestido de noche elegante en color negro, tela de alta calidad, corte clásico.',
          price: 89.99,
          images: ['https://via.placeholder.com/400x300/000000/FFFFFF?text=Vestido+Negro'],
          category: 'Moda',
          stock: 12,
          userId: users[0].id, // fashionista
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-5' },
        update: {},
        create: {
          id: 'product-5',
          title: 'Zapatillas Nike Air Max',
          description: 'Zapatillas deportivas Nike Air Max, tecnología de amortiguación Air Max.',
          price: 129.99,
          images: ['https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=Nike+Air+Max'],
          category: 'Deportes',
          stock: 15,
          userId: users[3].id, // sportsman
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-6' },
        update: {},
        create: {
          id: 'product-6',
          title: 'Lámpara de Mesa LED',
          description: 'Lámpara de mesa LED con luz cálida y fría ajustable, diseño moderno.',
          price: 45.99,
          images: ['https://via.placeholder.com/400x300/FFD700/000000?text=Lámpara+LED'],
          category: 'Hogar',
          stock: 20,
          userId: users[2].id, // homedecor
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-7' },
        update: {},
        create: {
          id: 'product-7',
          title: 'Set de Maquillaje Completo',
          description: 'Set de maquillaje profesional con base, corrector, sombras, labial y brochas.',
          price: 79.99,
          images: ['https://via.placeholder.com/400x300/FF69B4/FFFFFF?text=Makeup+Set'],
          category: 'Belleza',
          stock: 10,
          userId: users[0].id, // fashionista
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-8' },
        update: {},
        create: {
          id: 'product-8',
          title: 'Libro "El Arte de la Programación"',
          description: 'Libro técnico sobre programación avanzada, algoritmos y estructuras de datos.',
          price: 34.99,
          images: ['https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Programming+Book'],
          category: 'Libros',
          stock: 25,
          userId: users[1].id, // techguru
        },
      }),
      prisma.product.upsert({
        where: { id: 'product-9' },
        update: {},
        create: {
          id: 'product-9',
          title: 'Juego de Construcción LEGO',
          description: 'Set de construcción LEGO para niños, incluye 500+ piezas, instrucciones detalladas.',
          price: 59.99,
          images: ['https://via.placeholder.com/400x300/FF0000/FFFFFF?text=LEGO+Set'],
          category: 'Juguetes',
          stock: 18,
          userId: testUser.id,
        },
      }),
    ]);

    console.log('✅ Productos creados:', products.length);

    // Crear reels de prueba
    const reels = await Promise.all([
      prisma.reel.upsert({
        where: { id: 'reel-1' },
        update: {},
        create: {
          id: 'reel-1',
          title: 'iPhone 15 Pro - Unboxing',
          description: 'Descubre las nuevas características del iPhone 15 Pro. ¡Increíble calidad de cámara!',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://via.placeholder.com/300x400/007AFF/FFFFFF?text=iPhone+15+Pro',
          duration: 30,
          views: 150,
          likes: 25,
          userId: adminUser.id,
          productId: products[0].id,
        },
      }),
      prisma.reel.upsert({
        where: { id: 'reel-2' },
        update: {},
        create: {
          id: 'reel-2',
          title: 'Nike Air Max - Review',
          description: 'Probando las nuevas Nike Air Max. ¡Súper cómodas para el día a día!',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail: 'https://via.placeholder.com/300x400/FF3B30/FFFFFF?text=Nike+Air+Max',
          duration: 45,
          views: 89,
          likes: 12,
          userId: testUser.id,
          productId: products[1].id,
        },
      }),
      prisma.reel.upsert({
        where: { id: 'reel-3' },
        update: {},
        create: {
          id: 'reel-3',
          title: 'MacBook Pro M3 - Demo',
          description: 'Mostrando el rendimiento del nuevo MacBook Pro M3. ¡Perfecto para trabajo!',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://via.placeholder.com/300x400/34C759/FFFFFF?text=MacBook+Pro',
          duration: 60,
          views: 234,
          likes: 45,
          userId: adminUser.id,
          productId: products[0].id,
        },
      }),
    ]);

    console.log('✅ Reels creados:', reels.length);

    console.log('🎉 ¡Datos de prueba creados exitosamente!');
    console.log('\n📱 Credenciales de acceso:');
    console.log('👤 Superusuario: admin@marketplace.com / admin');
    console.log('👤 Usuario prueba: test@marketplace.com / admin');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
