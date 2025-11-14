# Marketplace App

Una aplicación completa de marketplace con backend en Node.js/Express y frontend móvil en React Native/Expo.

## 🚀 Características

- **Backend API**: Node.js con Express, Prisma ORM y PostgreSQL
- **Frontend Móvil**: React Native con Expo
- **Autenticación**: JWT con roles (Cliente, Vendedor, Admin)
- **Gestión de Productos**: CRUD completo con imágenes
- **Sistema de Pedidos**: Con códigos QR para tracking
- **Notificaciones**: Sistema de notificaciones en tiempo real
- **Reels**: Videos promocionales de productos
- **QR Scanner**: Para gestión de pedidos

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 13+
- npm o yarn
- Expo CLI (para desarrollo móvil)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd marketplace
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp env.example .env
# Editar .env con tus configuraciones
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb marketplace_db

# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate
```

### 4. Configurar Frontend Móvil
```bash
cd mobile-new
npm install
```

### 5. Ejecutar el proyecto
```bash
# Backend (puerto 3000)
cd backend
npm run dev

# Frontend móvil
cd mobile-new
npm start
```

## 📱 Uso

1. **Registro/Login**: Crea una cuenta como cliente o vendedor
2. **Vendedores**: Pueden crear productos, gestionar pedidos y ver estadísticas
3. **Clientes**: Pueden buscar productos, hacer pedidos y escanear QR
4. **Admins**: Pueden gestionar sucursales y usuarios

## 🔧 Scripts Disponibles

### Backend
- `npm start`: Ejecutar en producción
- `npm run dev`: Ejecutar en desarrollo
- `npm run db:generate`: Generar cliente Prisma
- `npm run db:push`: Sincronizar esquema con DB
- `npm run db:migrate`: Ejecutar migraciones
- `npm run db:studio`: Abrir Prisma Studio

### Frontend Móvil
- `npm start`: Iniciar Expo
- `npm run android`: Ejecutar en Android
- `npm run ios`: Ejecutar en iOS
- `npm run web`: Ejecutar en web

## 📁 Estructura del Proyecto

```
marketplace/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Servicios de negocio
│   │   └── utils/          # Utilidades
│   ├── prisma/             # Esquema y migraciones
│   └── scripts/            # Scripts de utilidad
├── mobile-new/             # App móvil
│   ├── src/
│   │   ├── screens/        # Pantallas de la app
│   │   ├── components/     # Componentes reutilizables
│   │   ├── navigation/     # Configuración de navegación
│   │   └── context/        # Contextos de React
└── docs/                   # Documentación
```

## 🔐 Variables de Entorno

Copia `backend/env.example` a `backend/.env` y configura:

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para JWT
- `CLOUDINARY_*`: Configuración de Cloudinary para imágenes
- `PORT`: Puerto del servidor (default: 3000)

## 📊 Base de Datos

El proyecto usa PostgreSQL con Prisma ORM. Las migraciones están en `backend/prisma/migrations/`.

### Modelos principales:
- **User**: Usuarios (clientes, vendedores, admins)
- **Product**: Productos del marketplace
- **Order**: Pedidos con sistema de QR
- **Reel**: Videos promocionales
- **Notification**: Sistema de notificaciones

## 🚀 Deploy y Hosting

Para deployar la aplicación fuera de la red local (testing/producción), consulta las siguientes guías:

### Guías de Deploy Disponibles:

- **[⚡ Deploy Rápido (Render)](./QUICK_DEPLOY.md)** - Deploy en 10 minutos con Render (Plan Free)
- **[🟢 Render](./DEPLOY_RENDER.md)** - Guía completa para Render (Recomendado para empezar)
- **[🔵 Fly.io](./DEPLOY_FLYIO.md)** - Deploy con Docker en Fly.io
- **[🟠 DigitalOcean](./DEPLOY_DIGITALOCEAN.md)** - Deploy en DigitalOcean App Platform
- **[🟡 VPS](./DEPLOY_VPS.md)** - Deploy en VPS (Self-hosted)
- **[📊 Comparación de Plataformas](./DEPLOY_COMPARISON.md)** - Comparación detallada de todas las opciones
- **[🌐 Guía General de Hosting](./HOSTING_OPTIONS.md)** - Resumen de todas las opciones

### Inicio Rápido:

**Para testing inmediato**, usa Render (Plan Free):
1. Crea cuenta en [Render.com](https://render.com)
2. Crea PostgreSQL database
3. Crea Web Service desde GitHub
4. Configura variables de entorno
5. Deploy automático
6. Actualiza URL en el móvil

Ver [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) para instrucciones paso a paso.

### Requisitos para Deploy:

- PostgreSQL database (incluida en las guías)
- Variables de entorno configuradas (ver `backend/env.example`)
- Cloudinary configurado (para imágenes)
- URL del backend actualizada en el móvil

Ver [HOSTING_OPTIONS.md](./HOSTING_OPTIONS.md) para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Roy** - Desarrollador del proyecto

## 📞 Soporte

Si tienes problemas o preguntas, crea un issue en el repositorio.