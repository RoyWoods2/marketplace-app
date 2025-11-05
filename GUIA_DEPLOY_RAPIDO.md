# 🚀 Guía de Deploy Rápido - Marketplace App

## 🎯 Objetivo

Deployar tu aplicación en la nube para hacer pruebas desde cualquier lugar, en **30 minutos**.

---

## 📋 Opción Recomendada: Railway (⭐ MEJOR)

**Railway es perfecto porque:**
- ✅ Free tier generoso ($5 gratis al mes)
- ✅ Soporta Node.js + PostgreSQL en un solo lugar
- ✅ Deploy automático desde GitHub
- ✅ URLs públicas automáticas
- ✅ Variables de entorno fáciles de configurar
- ✅ Setup en 15 minutos

---

## 🚀 PASO A PASO: Deploy en Railway

### Paso 1: Preparar el Backend para Producción

#### 1.1 Crear Dockerfile (Opcional pero recomendado)

Crea `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar Prisma Client
RUN npx prisma generate

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
```

#### 1.2 Crear railway.json (Opcional)

Crea `backend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 1.3 Actualizar server.js para producción

Asegúrate de que `backend/src/server.js` use `process.env.PORT`:

```javascript
const PORT = process.env.PORT || 3000;
```

✅ Ya está configurado correctamente.

---

### Paso 2: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en **"Start a New Project"**
3. Conecta con **GitHub**
4. Autoriza Railway para acceder a tus repositorios

---

### Paso 3: Crear Base de Datos PostgreSQL

1. En Railway, click **"+ New"**
2. Selecciona **"Database"**
3. Elige **"PostgreSQL"**
4. Railway creará automáticamente la DB y te dará:
   - `DATABASE_URL` (URL completa de conexión)
   - Usuario y contraseña

📝 **Copia el `DATABASE_URL`** - lo necesitarás después.

---

### Paso 4: Deployar el Backend

1. En Railway, click **"+ New"**
2. Selecciona **"Deploy from GitHub repo"**
3. Elige tu repositorio `marketplace`
4. Railway detectará automáticamente que es Node.js

#### 4.1 Configurar Variables de Entorno

En Railway, ve a tu servicio → **"Variables"** y agrega:

```env
# Base de datos (copiar desde el servicio PostgreSQL)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# JWT (genera uno seguro)
JWT_SECRET=tu_jwt_secret_super_seguro_2024_produccion

# Node Environment
NODE_ENV=production
PORT=3000

# CORS (usar la URL de Railway cuando la tengas)
CORS_ORIGIN=*

# Cloudinary (opcional, pero recomendado)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### 4.2 Configurar Root Directory

En Railway → Settings → **Root Directory**: `backend`

#### 4.3 Configurar Build Command

En Railway → Settings → **Build Command**: 
```bash
npm install && npx prisma generate
```

#### 4.4 Configurar Start Command

En Railway → Settings → **Start Command**:
```bash
npx prisma migrate deploy && npm start
```

---

### Paso 5: Ejecutar Migraciones

Una vez deployado, ejecuta migraciones:

1. Ve a tu servicio en Railway
2. Click en **"Deployments"**
3. Click en el deployment más reciente
4. Abre **"View Logs"**
5. O mejor, usa el **Railway CLI**:

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Ejecutar migraciones
cd backend
railway run npx prisma migrate deploy
```

---

### Paso 6: Obtener URL Pública

1. En Railway, ve a tu servicio
2. Click en **"Settings"**
3. Scroll hasta **"Networking"**
4. Click **"Generate Domain"**
5. Copia la URL (ej: `marketplace-backend-production.up.railway.app`)

📝 **Esta es tu URL del backend:** `https://marketplace-backend-production.up.railway.app`

---

### Paso 7: Actualizar Variables de Entorno

Vuelve a Railway → Variables y actualiza:

```env
CORS_ORIGIN=https://marketplace-backend-production.up.railway.app
```

---

### Paso 8: Configurar el Móvil

#### 8.1 Crear archivo de configuración para producción

Crea `mobile-new/src/config/api.prod.ts`:

```typescript
// API Configuration para Producción
export const API_BASE_URL = 'https://marketplace-backend-production.up.railway.app';
export const API_URL = `${API_BASE_URL}/api`;

// ... resto igual que api.ts
```

#### 8.2 Actualizar api.ts para usar variables de entorno

Modifica `mobile-new/src/config/api.ts`:

```typescript
// API Configuration
// Usa variable de entorno si existe, sino usa localhost para desarrollo
const getApiBaseUrl = () => {
  // En Expo, puedes usar Constants.expoConfig.extra.apiUrl
  // O usar process.env.EXPO_PUBLIC_API_URL
  if (__DEV__) {
    // Desarrollo
    return 'http://192.168.1.120:3001';
  } else {
    // Producción
    return process.env.EXPO_PUBLIC_API_URL || 'https://marketplace-backend-production.up.railway.app';
  }
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;

// ... resto del código igual
```

#### 8.3 Configurar app.json para variables de entorno

Modifica `mobile-new/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://marketplace-backend-production.up.railway.app"
    }
  }
}
```

#### 8.4 Crear script de actualización

Crea `mobile-new/update-api-url.js`:

```javascript
const fs = require('fs');
const path = require('path');

const API_URL = process.argv[2] || process.env.RAILWAY_URL;

if (!API_URL) {
  console.error('❌ Proporciona la URL del backend: node update-api-url.js https://tu-url.railway.app');
  process.exit(1);
}

const apiTsPath = path.join(__dirname, 'src/config/api.ts');
let content = fs.readFileSync(apiTsPath, 'utf8');

// Reemplazar la URL hardcodeada
content = content.replace(
  /export const API_BASE_URL = ['"].*?['"]/,
  `export const API_BASE_URL = '${API_URL}'`
);

fs.writeFileSync(apiTsPath, content, 'utf8');
console.log(`✅ URL actualizada a: ${API_URL}`);
```

---

## 🧪 Probar el Deploy

### 1. Verificar Backend

Abre en tu navegador:
```
https://marketplace-backend-production.up.railway.app/api/health
```

Deberías ver:
```json
{
  "status": "OK",
  "message": "Marketplace API is running"
}
```

### 2. Probar desde el móvil

1. Actualiza la URL en `mobile-new/src/config/api.ts`
2. Reinicia Expo: `npm start`
3. Prueba login/registro
4. Verifica que todo funcione

---

## 🔄 Alternativas Rápidas

### Opción 2: Render (Similar a Railway)

1. Ve a [render.com](https://render.com)
2. Nuevo **Web Service** → Conecta GitHub
3. Nuevo **PostgreSQL Database**
4. Configura variables de entorno
5. Deploy automático

**Ventajas:**
- Free tier permanente (con limitaciones)
- Similar a Railway

**Desventajas:**
- Más lento en free tier
- Se "duerme" después de 15 min de inactividad

---

### Opción 3: Supabase (Solo para Base de Datos)

Si quieres mantener el backend en Railway pero usar Supabase para DB:

1. Ve a [supabase.com](https://supabase.com)
2. Crea nuevo proyecto
3. Copia la **Connection String** (PostgreSQL)
4. Úsala como `DATABASE_URL` en Railway

**Ventajas:**
- Free tier generoso
- Dashboard visual de la DB
- API REST automática

---

## 📱 Deploy del Móvil (Opcional)

Para generar APK/IPA para pruebas:

### Usando Expo EAS Build

```bash
cd mobile-new

# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar
eas build:configure

# Build para Android
eas build --platform android --profile preview

# Build para iOS
eas build --platform ios --profile preview
```

Esto generará un APK/IPA que puedes descargar y compartir.

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que `DATABASE_URL` esté correcto en Railway
2. Verifica que la DB esté activa
3. Ejecuta migraciones: `railway run npx prisma migrate deploy`

### Error: "CORS policy"

**Solución:**
En `backend/src/server.js`, asegúrate de que CORS permita tu dominio:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

### Error: "Prisma Client not generated"

**Solución:**
En Railway, agrega al Build Command:
```bash
npm install && npx prisma generate
```

### La app no se conecta

**Solución:**
1. Verifica que la URL en `api.ts` sea HTTPS (no HTTP)
2. Verifica que Railway esté activo
3. Prueba la URL en el navegador primero

---

## 💰 Costos

### Railway (Free Tier)
- $5 gratis al mes
- Después: $0.01 por hora de uso
- **Estimado:** $5-10/mes para pruebas

### Render (Free Tier)
- Gratis pero se "duerme" después de inactividad
- **Estimado:** $0-7/mes

### Supabase (Free Tier)
- 500MB de base de datos
- **Estimado:** Gratis para pruebas

---

## ✅ Checklist de Deploy

- [ ] Cuenta en Railway creada
- [ ] Base de datos PostgreSQL creada
- [ ] Backend deployado
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] URL pública obtenida
- [ ] API `/health` responde
- [ ] URL actualizada en móvil
- [ ] App móvil probada con backend en producción

---

## 🎯 Próximos Pasos

Una vez deployado:

1. ✅ Probar todas las funcionalidades
2. ✅ Configurar dominio personalizado (opcional)
3. ✅ Configurar monitoreo (Sentry)
4. ✅ Setup de backups automáticos
5. ✅ Documentar credenciales de producción

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway
2. Verifica variables de entorno
3. Prueba la API directamente con Postman/curl
4. Revisa la documentación de Railway

---

**¿Listo para deployar?** 🚀

Empieza con el Paso 1 y sigue en orden. ¡Deberías tener todo funcionando en 30 minutos!

