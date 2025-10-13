const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔐 Probando login...');
    
    const email = 'admin@marketplace.com';
    const password = 'admin';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('🔑 Comparando contraseña...');
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    console.log('✅ Contraseña válida:', isValidPassword);
    
    if (isValidPassword) {
      console.log('🎉 Login exitoso!');
      console.log('📧 Email:', user.email);
      console.log('👤 Username:', user.username);
      console.log('📝 Nombre:', user.firstName, user.lastName);
    } else {
      console.log('❌ Contraseña inválida');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
