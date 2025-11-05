const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSellerStats() {
  try {
    console.log('🔧 Verificando y corrigiendo SellerStats...');

    // Obtener todos los usuarios que son vendedores
    const sellers = await prisma.user.findMany({
      where: {
        userType: 'SELLER'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 Encontrados ${sellers.length} vendedores`);

    // Verificar y crear SellerStats para cada vendedor
    for (const seller of sellers) {
      try {
        const existingStats = await prisma.sellerStats.findUnique({
          where: { userId: seller.id }
        });

        if (!existingStats) {
          await prisma.sellerStats.create({
            data: {
              userId: seller.id,
              totalSales: 0,
              totalRevenue: 0,
              productsSold: 0
            }
          });
          console.log(`✅ Creado SellerStats para ${seller.firstName} ${seller.lastName} (${seller.email})`);
        } else {
          console.log(`✓ SellerStats ya existe para ${seller.firstName} ${seller.lastName}`);
        }
      } catch (error) {
        console.error(`❌ Error procesando ${seller.email}:`, error.message);
      }
    }

    // Limpiar SellerStats huérfanos (sin usuario asociado)
    const allStats = await prisma.sellerStats.findMany({
      select: {
        id: true,
        userId: true
      }
    });

    let orphanCount = 0;
    for (const stat of allStats) {
      const user = await prisma.user.findUnique({
        where: { id: stat.userId }
      });

      if (!user) {
        await prisma.sellerStats.delete({
          where: { id: stat.id }
        });
        orphanCount++;
        console.log(`🗑️ Eliminado SellerStats huérfano para userId: ${stat.userId}`);
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Vendedores procesados: ${sellers.length}`);
    console.log(`   - SellerStats huérfanos eliminados: ${orphanCount}`);

  } catch (error) {
    console.error('❌ Error en fixSellerStats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSellerStats();

