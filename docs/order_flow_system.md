# Sistema de Gestión de Órdenes con Códigos QR

## Descripción General

Este sistema implementa un flujo completo de gestión de órdenes para un marketplace donde los pagos se realizan directamente entre cliente y vendedor, pero el marketplace actúa como intermediario para la logística de entrega a través de sucursales.

## Flujo de Órdenes

### Estados de Orden

1. **PENDING** - Pedido creado, esperando contacto del cliente
2. **PAYMENT_PENDING** - Cliente contactó vendedor, esperando pago
3. **PAYMENT_CONFIRMED** - Vendedor confirmó pago recibido
4. **PREPARING** - Vendedor preparando producto y llevándolo a sucursal
5. **READY_FOR_PICKUP** - Producto entregado en sucursal, listo para retiro
6. **PICKED_UP** - Cliente retiró el producto
7. **DELIVERED** - Producto entregado (estado final)
8. **CANCELLED** - Pedido cancelado

### Tipos de Usuario

#### 1. CLIENT (Cliente)
- **Responsabilidades:**
  - Explorar y comprar productos
  - Contactar vendedor para coordinar pago
  - Retirar producto de sucursal
  - Recibir notificaciones de estado

#### 2. SELLER (Vendedor)
- **Responsabilidades:**
  - Gestionar productos y stock
  - Confirmar pagos recibidos
  - Preparar productos
  - Entregar productos a sucursal
  - Recibir notificaciones de nuevos pedidos

#### 3. ADMIN (Administrador de Sucursal)
- **Responsabilidades:**
  - Escanear códigos QR de productos entregados
  - Confirmar productos listos para retiro
  - Gestionar sucursales
  - Confirmar retiros de clientes

## Sistema de Códigos QR

### Generación
- Cada orden recibe un código QR único al momento de la creación
- El QR contiene: `orderId`, `token secreto`, y `timestamp`
- Se genera una imagen del QR para mostrar en la app

### Validación
- Los códigos QR tienen una validez de 24 horas
- El administrador escanea el QR para confirmar que el producto está en sucursal
- Se valida tanto el formato como la autenticidad del token

### Flujo de Uso
1. Cliente crea pedido → Se genera QR
2. Vendedor lleva producto a sucursal → Muestra QR al administrador
3. Administrador escanea QR → Producto marcado como "READY_FOR_PICKUP"
4. Cliente recibe notificación → Puede retirar producto

## Estructura de Base de Datos

### Nuevos Campos en User
```prisma
userType    UserType @default(CLIENT) // CLIENT, SELLER, ADMIN
isActive    Boolean  @default(true)
facebook    String?  // Nueva red social
```

### Nuevos Campos en Order
```prisma
quantity      Int         @default(1)
qrCode        String      @unique
qrSecretToken String      @unique
paymentMethod String?
notes         String?
pickupCode    String?
branchId      String?
```

### Nuevo Modelo Branch
```prisma
model Branch {
  id          String   @id @default(cuid())
  name        String
  address     String
  phone       String?
  email       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orders      Order[]
}
```

### Nuevos Enums
```prisma
enum UserType {
  CLIENT    // Cliente que compra
  SELLER    // Vendedor que vende productos
  ADMIN     // Administrador de sucursal
}

enum OrderStatus {
  PENDING              // Pedido creado, esperando contacto del cliente
  PAYMENT_PENDING      // Cliente contactó vendedor, esperando pago
  PAYMENT_CONFIRMED    // Vendedor confirmó pago recibido
  PREPARING           // Vendedor preparando producto
  READY_FOR_PICKUP    // Producto entregado en sucursal, listo para retiro
  PICKED_UP           // Cliente retiró el producto
  DELIVERED           // Producto entregado (estado final)
  CANCELLED           // Pedido cancelado
}
```

## API Endpoints

### Órdenes
- `POST /api/orders` - Crear orden (genera QR automáticamente)
- `GET /api/orders` - Listar órdenes
- `GET /api/orders/:id` - Obtener orden específica
- `PUT /api/orders/:id/status` - Actualizar estado de orden

### Vendedor
- `PUT /api/seller/orders/:id/confirm-payment` - Confirmar pago recibido
- `PUT /api/seller/orders/:id/deliver-to-branch` - Marcar como entregado en sucursal
- `GET /api/seller/orders` - Órdenes del vendedor
- `GET /api/seller/dashboard` - Dashboard del vendedor

### Administrador
- `POST /api/admin/scan-qr` - Escanear código QR
- `POST /api/admin/confirm-pickup` - Confirmar retiro de producto
- `GET /api/admin/dashboard` - Dashboard del administrador
- `GET /api/admin/branches` - Listar sucursales
- `POST /api/admin/branches` - Crear sucursal

### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `PUT /api/notifications/:id/read` - Marcar como leída
- `GET /api/notifications/unread-count` - Contador de no leídas

## Pantallas Móviles

### Para Clientes
- **ClientOrdersEnhancedScreen**: Gestión completa de pedidos del cliente
- Funcionalidades:
  - Ver estado de pedidos
  - Contactar vendedor (WhatsApp, Instagram, Facebook)
  - Ver información de retiro
  - Recibir notificaciones de estado

### Para Vendedores
- **SellerOrdersEnhancedScreen**: Gestión de órdenes del vendedor
- Funcionalidades:
  - Ver órdenes pendientes
  - Confirmar pagos recibidos
  - Marcar productos como entregados en sucursal
  - Ver códigos QR para administradores

### Para Administradores
- **AdminDashboardScreen**: Dashboard principal del administrador
- **QRScannerScreen**: Escáner de códigos QR
- Funcionalidades:
  - Ver estadísticas de sucursal
  - Escanear códigos QR
  - Confirmar productos listos para retiro
  - Gestionar sucursales

## Servicios

### QRService
```javascript
// Generar código QR
const { qrCode, qrSecretToken } = QRService.generateQRCode(orderId);

// Validar código QR escaneado
const qrData = QRService.validateQRCode(scannedQR);

// Crear URL de imagen del QR
const qrImageUrl = QRService.createQRImageUrl(qrCode);

// Generar código de retiro
const pickupCode = QRService.generatePickupCode();
```

### NotificationService
```javascript
// Notificar producto listo para retiro
await NotificationService.notifyProductReady(clientId, orderId, productTitle, pickupCode, branchId);

// Notificar confirmación de pago
await NotificationService.notifyOrderStatusChange(buyerId, orderId, productTitle, 'PAYMENT_CONFIRMED', sellerName);

// Notificar contacto con vendedor
await NotificationService.notifyContactSeller(clientId, orderId, productTitle, sellerInfo);
```

## Instalación y Configuración

### 1. Aplicar Migración de Base de Datos
```bash
cd backend
npx prisma db push
node scripts/migrateNewFeatures.js
```

### 2. Instalar Dependencias Adicionales (si es necesario)
```bash
# Para el móvil, si necesitas escáner de QR real
npm install react-native-camera
# o
npm install expo-camera
```

### 3. Configurar Variables de Entorno
```env
DATABASE_URL="postgresql://..."
QR_SERVICE_URL="https://api.qrserver.com/v1/create-qr-code/"
```

## Datos de Prueba

El script de migración crea automáticamente:

### Usuarios de Prueba
- **Admin**: `admin@marketplace.com` / `admin123`
- **Vendedor**: `vendedor@test.com` / `vendedor123`
- **Cliente**: `cliente@test.com` / `cliente123`

### Sucursales
- Sucursal Principal
- Sucursal Norte

### Productos
- Artesanía en Madera ($150)
- Jabones Artesanales ($25)

### Orden de Prueba
- Orden completa con código QR generado

## Flujo Completo de Ejemplo

1. **Cliente** navega productos y crea pedido
2. **Sistema** genera código QR y notifica al vendedor
3. **Cliente** recibe notificación para contactar vendedor
4. **Cliente** contacta vendedor por WhatsApp para coordinar pago
5. **Vendedor** confirma pago recibido en la app
6. **Vendedor** prepara producto y lo lleva a sucursal
7. **Vendedor** muestra código QR al administrador
8. **Administrador** escanea QR y confirma producto listo
9. **Cliente** recibe notificación de producto listo
10. **Cliente** va a sucursal y muestra código de retiro
11. **Administrador** confirma retiro del producto
12. **Sistema** notifica a vendedor que producto fue retirado

## Consideraciones de Seguridad

- Los códigos QR tienen tokens secretos únicos
- Validación de tiempo de expiración (24 horas)
- Verificación de permisos por tipo de usuario
- Validación de estados de orden antes de transiciones
- Logs de todas las operaciones críticas

## Escalabilidad

- Sistema modular por tipo de usuario
- Notificaciones asíncronas
- Códigos QR únicos y seguros
- Base de datos optimizada con índices
- API RESTful bien estructurada
