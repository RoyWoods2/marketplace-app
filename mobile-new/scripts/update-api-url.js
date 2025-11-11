#!/usr/bin/env node

/**
 * Script para actualizar la URL del API en el móvil
 * 
 * Uso:
 *   node scripts/update-api-url.js https://tu-url.railway.app
 *   O
 *   RAILWAY_URL=https://tu-url.railway.app node scripts/update-api-url.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.argv[2] || process.env.RAILWAY_URL;

if (!API_URL) {
  console.error('❌ Error: Proporciona la URL del backend');
  console.log('\nUso:');
  console.log('  node scripts/update-api-url.js https://tu-url.railway.app');
  console.log('  O');
  console.log('  RAILWAY_URL=https://tu-url.railway.app node scripts/update-api-url.js');
  process.exit(1);
}

// Validar URL
if (!API_URL.startsWith('http://') && !API_URL.startsWith('https://')) {
  console.error('❌ Error: La URL debe comenzar con http:// o https://');
  process.exit(1);
}

const apiTsPath = path.join(__dirname, '../src/config/api.ts');

if (!fs.existsSync(apiTsPath)) {
  console.error(`❌ Error: No se encontró el archivo ${apiTsPath}`);
  process.exit(1);
}

let content = fs.readFileSync(apiTsPath, 'utf8');

// Reemplazar la URL de producción
// Buscar: const PRODUCTION_URL = 'https://tu-url.railway.app';
const productionUrlPattern = /const PRODUCTION_URL = ['"][^'"]*['"]/;
const newProductionUrl = `const PRODUCTION_URL = '${API_URL}';`;

if (productionUrlPattern.test(content)) {
  content = content.replace(productionUrlPattern, newProductionUrl);
  fs.writeFileSync(apiTsPath, content, 'utf8');
  console.log(`✅ URL de producción actualizada exitosamente a: ${API_URL}`);
} else {
  console.error('❌ Error: No se encontró PRODUCTION_URL en api.ts');
  console.log('El archivo debería contener: const PRODUCTION_URL = ...');
  process.exit(1);
}

// También actualizar otros archivos que tengan URLs hardcodeadas
const filesToUpdate = [
  '../src/screens/HomeScreen.tsx',
  '../src/screens/SearchScreen.tsx',
  '../src/screens/CreateScreenMejorado.tsx',
  '../src/screens/OrderDetailScreen.tsx',
  '../src/screens/ProductDetailScreen.tsx',
  '../src/context/AuthContext.tsx',
];

let updatedFiles = 0;
filesToUpdate.forEach(relativePath => {
  const filePath = path.join(__dirname, relativePath);
  if (fs.existsSync(filePath)) {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    const urlPattern = /http:\/\/192\.168\.\d+\.\d+:\d+|http:\/\/localhost:\d+/g;
    if (urlPattern.test(fileContent)) {
      fileContent = fileContent.replace(urlPattern, API_URL);
      fs.writeFileSync(filePath, fileContent, 'utf8');
      updatedFiles++;
    }
  }
});

if (updatedFiles > 0) {
  console.log(`✅ Se actualizaron ${updatedFiles} archivos adicionales con la nueva URL`);
}

console.log('\n📝 Próximos pasos:');
console.log('1. Reinicia Expo: npm start');
console.log('2. Prueba la conexión desde la app');

