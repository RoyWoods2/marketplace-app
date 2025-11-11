#!/usr/bin/env node

/**
 * Script para obtener la IP local de tu computadora
 * Útil para configurar el desarrollo local con Expo
 */

const os = require('os');
const { exec } = require('child_process');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

console.log('🔍 Buscando tu IP local...\n');

const addresses = getLocalIP();

if (addresses.length === 0) {
  console.log('❌ No se encontró ninguna IP local');
  console.log('💡 Asegúrate de estar conectado a una red WiFi o Ethernet');
  process.exit(1);
}

console.log('📱 IPs encontradas:\n');
addresses.forEach((addr, index) => {
  console.log(`   ${index + 1}. ${addr.address} (${addr.name})`);
});

// Generalmente la primera IP es la correcta (WiFi o Ethernet)
const primaryIP = addresses[0].address;

console.log(`\n✅ IP recomendada: ${primaryIP}`);
console.log(`\n📝 Para usar esta IP en desarrollo:`);
console.log(`   1. Edita mobile-new/src/config/api.ts`);
console.log(`   2. Cambia DEVELOPMENT_URL a: http://${primaryIP}:3000`);
console.log(`\n💡 O ejecuta:`);
console.log(`   node scripts/update-api-url.js http://${primaryIP}:3000`);
console.log(`\n⚠️  Asegúrate de que:`);
console.log(`   - El backend esté corriendo en el puerto 3000`);
console.log(`   - Tu móvil y computadora estén en la misma red WiFi`);

