const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true
      }
    });

    console.log('📋 Usuarios encontrados:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Nombre: ${user.firstName} ${user.lastName}`);
      console.log(`- Password hash: ${user.password.substring(0, 20)}...`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
