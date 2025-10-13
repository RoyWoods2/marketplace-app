# 🛍️ Marketplace App

Una aplicación de marketplace con funcionalidades de reels estilo Instagram/TikTok, donde los usuarios pueden vender productos de sus emprendimientos.

## 🚀 Características Principales

- **Feed de Reels**: Scroll vertical con videos promocionales
- **Marketplace**: Venta de productos con imágenes y descripciones
- **Integración Social**: Enlaces directos a WhatsApp e Instagram
- **Multiplataforma**: App móvil (React Native) + Web (Next.js)
- **Chat Directo**: Comunicación vendedor-comprador

## 🛠️ Stack Tecnológico

- **Frontend Móvil**: React Native + Expo
- **Frontend Web**: Next.js
- **Backend**: Node.js + Express + Prisma
- **Base de Datos**: PostgreSQL
- **Storage**: Cloudinary (imágenes/videos)
- **Real-time**: Socket.io
- **Integración Social**: WhatsApp Business API + Instagram API

## 📁 Estructura del Proyecto

```
marketplace/
├── mobile/                 # App React Native
├── backend/               # API Node.js
├── web/                   # Web app Next.js
├── docs/                  # Documentación
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn
- PostgreSQL
- Cuenta de Cloudinary
- Cuenta de WhatsApp Business API
- Cuenta de Instagram API

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd marketplace
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

#### Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/marketplace_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server
PORT=3001
NODE_ENV=development

# WhatsApp Business API
WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"

# Instagram API
INSTAGRAM_API_URL="https://graph.facebook.com/v18.0"
INSTAGRAM_ACCESS_TOKEN="your-instagram-token"
```

#### Configurar la base de datos

```bash
# Generar el cliente Prisma
npm run db:generate

# Crear las tablas en la base de datos
npm run db:push

# (Opcional) Abrir Prisma Studio
npm run db:studio
```

#### Iniciar el servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### 3. Configurar la App Móvil

```bash
cd mobile
npm install
```

#### Iniciar la app

```bash
# Para desarrollo
npm start

# Para Android
npm run android

# Para iOS
npm run ios
```

### 4. Configurar la Web App

```bash
cd web
npm install
npm run dev
```

La web app estará disponible en `http://localhost:3000`

## 📱 Funcionalidades

### Para Vendedores
- Crear perfil con información de contacto
- Subir productos con imágenes y descripciones
- Crear reels promocionales
- Gestionar pedidos
- Configurar enlaces de WhatsApp e Instagram

### Para Compradores
- Explorar feed de reels
- Ver productos en detalle
- Contactar vendedores directamente
- Realizar pedidos
- Dejar reseñas

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar perfil

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Reels
- `GET /api/reels` - Listar reels (feed)
- `GET /api/reels/:id` - Obtener reel por ID
- `POST /api/reels` - Crear reel
- `POST /api/reels/:id/like` - Like/unlike reel
- `PUT /api/reels/:id` - Actualizar reel
- `DELETE /api/reels/:id` - Eliminar reel

### Pedidos
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/:id` - Obtener pedido por ID
- `POST /api/orders` - Crear pedido
- `PUT /api/orders/:id/status` - Actualizar estado del pedido

## 🎨 Diseño y UX

- **Feed de Reels**: Scroll vertical infinito
- **Navegación**: Bottom tabs para móvil
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Dark/Light Mode**: Soporte para ambos temas

## 🔒 Seguridad

- Autenticación JWT
- Validación de datos de entrada
- Sanitización de archivos subidos
- Rate limiting en endpoints críticos

## 📈 Próximas Funcionalidades

- [ ] Sistema de notificaciones push
- [ ] Chat en tiempo real
- [ ] Sistema de pagos integrado
- [ ] Analytics para vendedores
- [ ] Modo offline
- [ ] Geolocalización de productos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Roy** - Desarrollador Principal

## 📞 Soporte

Si tienes alguna pregunta o problema, por favor abre un issue en el repositorio.
