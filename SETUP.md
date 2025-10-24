# 🚀 Guía de Instalación Completa - Marketplace App

Esta guía te ayudará a clonar y configurar el proyecto Marketplace en cualquier PC desde cero.

## 📋 Requisitos Previos

### Software Necesario:
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **PostgreSQL 13+** - [Descargar aquí](https://www.postgresql.org/download/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Expo CLI** (para desarrollo móvil) - Se instala automáticamente

### Verificar Instalaciones:
```bash
node --version    # Debe ser 18+
npm --version     # Debe ser 8+
psql --version    # Debe ser 13+
git --version     # Cualquier versión reciente
```

## 🔧 Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/RoyWoods2/marketplace-app.git
cd marketplace-app
```

## 🗄️ Paso 2: Configurar Base de Datos PostgreSQL

### 2.1 Crear Base de Datos
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE marketplace_db;

# Crear usuario (opcional, puedes usar postgres)
CREATE USER marketplace_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE marketplace_db TO marketplace_user;

# Salir de psql
\q
```

### 2.2 Configurar Variables de Entorno
```bash
# Ir al directorio backend
cd backend

# Copiar archivo de configuración
cp env.example .env

# Editar el archivo .env con tus datos
```

**Configuración del archivo `.env`:**
```env
# Configuración de Base de Datos
DATABASE_URL="postgresql://marketplace_user:tu_password_seguro@localhost:5432/marketplace_db"

# Configuración de JWT (cambia por una clave segura)
JWT_SECRET="mi_clave_jwt_super_secreta_2024"

# Configuración de Cloudinary (opcional para desarrollo)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de CORS
CORS_ORIGIN="http://localhost:19006"
```

## 🔧 Paso 3: Configurar Backend

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (crear tablas en la DB)
npx prisma migrate dev

# Opcional: Abrir Prisma Studio para ver la base de datos
npx prisma studio
```

## 📱 Paso 4: Configurar Frontend Móvil

```bash
# Ir al directorio mobile-new
cd ../mobile-new

# Instalar dependencias
npm install

# Instalar Expo CLI globalmente (si no lo tienes)
npm install -g @expo/cli
```

## 🚀 Paso 5: Ejecutar el Proyecto

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
El backend estará disponible en: `http://localhost:3000`

### Terminal 2 - Frontend Móvil:
```bash
cd mobile-new
npm start
```

Esto abrirá Expo Dev Tools en tu navegador donde podrás:
- Escanear QR con Expo Go (móvil)
- Ejecutar en emulador Android/iOS
- Ejecutar en navegador web

## 📊 Paso 6: Verificar Instalación

### 6.1 Verificar Backend:
- Abre `http://localhost:3000` en tu navegador
- Deberías ver un mensaje de la API funcionando

### 6.2 Verificar Base de Datos:
```bash
cd backend
npx prisma studio
```
Esto abrirá una interfaz web para ver las tablas de la base de datos.

### 6.3 Verificar Frontend:
- Escanea el QR con Expo Go en tu móvil
- O ejecuta en emulador/web desde Expo Dev Tools

## 🔧 Scripts Útiles

### Backend:
```bash
npm start          # Producción
npm run dev        # Desarrollo con nodemon
npm run db:generate # Generar cliente Prisma
npm run db:push    # Sincronizar esquema
npm run db:migrate # Ejecutar migraciones
npm run db:studio  # Abrir Prisma Studio
```

### Frontend Móvil:
```bash
npm start          # Iniciar Expo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run web        # Ejecutar en web
```

## 🐛 Solución de Problemas Comunes

### Error de Conexión a Base de Datos:
```bash
# Verificar que PostgreSQL esté ejecutándose
# Windows: Servicios > PostgreSQL
# Linux/Mac: sudo service postgresql start

# Verificar conexión
psql -U postgres -h localhost
```

### Error de Puerto en Uso:
```bash
# Cambiar puerto en backend/.env
PORT=3001
```

### Error de Dependencias:
```bash
# Limpiar cache y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Error de Prisma:
```bash
# Regenerar cliente Prisma
npx prisma generate
npx prisma db push
```

## 📱 Configuración Adicional

### Para Desarrollo Móvil:
1. **Android**: Instala Android Studio y configura emulador
2. **iOS**: Instala Xcode (solo en Mac)
3. **Expo Go**: Descarga la app en tu móvil para testing

### Para Producción:
1. Configura variables de entorno de producción
2. Usa una base de datos en la nube (Railway, Supabase, etc.)
3. Configura Cloudinary para imágenes
4. Usa un servidor de producción (Railway, Heroku, etc.)

## ✅ Checklist de Verificación

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado y ejecutándose
- [ ] Repositorio clonado
- [ ] Base de datos creada
- [ ] Archivo .env configurado
- [ ] Dependencias del backend instaladas
- [ ] Migraciones ejecutadas
- [ ] Dependencias del frontend instaladas
- [ ] Backend ejecutándose en puerto 3000
- [ ] Frontend ejecutándose con Expo
- [ ] Prisma Studio accesible

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs de error en las terminales
2. Verifica que todos los servicios estén ejecutándose
3. Comprueba las variables de entorno
4. Consulta la documentación de Prisma/Expo

¡Tu proyecto Marketplace debería estar funcionando perfectamente! 🎉
