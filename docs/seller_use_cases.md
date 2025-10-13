# 📋 CASOS DE USO PARA VENDEDORES - MARKETPLACE

## 🎯 **OBJETIVO**
Definir claramente el flujo de trabajo y funcionalidades que necesita un vendedor en el marketplace para gestionar eficientemente sus productos, órdenes y clientes.

---

## 👤 **PERFIL DEL VENDEDOR**
- **Emprendedor** que vende productos artesanales
- **Trabaja desde casa/taller** 
- **Necesita gestionar** productos, órdenes y comunicación con clientes
- **No tiene tienda física** - usa sucursales como puntos de entrega
- **Maneja pagos** directamente con clientes (WhatsApp, transferencias)

---

## 🔄 **FLUJO PRINCIPAL DEL VENDEDOR**

### **1. GESTIÓN DE PRODUCTOS**
```
📦 MIS PRODUCTOS
├── Ver todos mis productos
├── Agregar nuevo producto
├── Editar producto existente
├── Desactivar/activar producto
├── Ver stock disponible
├── Recibir alertas de stock bajo
└── Subir fotos/videos del producto
```

### **2. GESTIÓN DE ÓRDENES**
```
🛒 MIS ÓRDENES
├── Ver órdenes pendientes
├── Confirmar pago recibido
├── Marcar como preparando
├── Marcar como entregado a sucursal
├── Ver historial de órdenes
├── Filtrar por estado
└── Ver detalles del cliente
```

### **3. COMUNICACIÓN CON CLIENTES**
```
💬 CONTACTO DIRECTO
├── WhatsApp del cliente
├── Instagram del cliente
├── Datos de contacto del cliente
├── Historial de órdenes del cliente
└── Notas sobre el cliente
```

---

## 📱 **PANTALLAS NECESARIAS PARA VENDEDORES**

### **🏠 DASHBOARD DEL VENDEDOR**
- **Resumen rápido:**
  - Órdenes pendientes (badge con número)
  - Productos con stock bajo (alerta)
  - Ventas del día/semana
  - Ingresos totales

### **📦 MIS PRODUCTOS**
- **Lista de productos** con:
  - Foto del producto
  - Nombre y precio
  - Stock disponible
  - Estado (activo/inactivo)
  - Botón "Editar"
- **Botón flotante** "+ Agregar Producto"
- **Filtros:** Activos, Inactivos, Stock bajo

### **🛒 MIS ÓRDENES**
- **Lista de órdenes** con:
  - Foto del producto
  - Nombre del cliente
  - Fecha de la orden
  - Estado actual
  - Total a cobrar
- **Filtros por estado:**
  - PENDIENTE (esperando pago)
  - PAGO_CONFIRMADO (preparar producto)
  - PREPARANDO (en proceso)
  - ENTREGADO_A_SUCURSAL (listo para retiro)
- **Acciones rápidas:**
  - Confirmar pago
  - Marcar como preparando
  - Entregar a sucursal

### **👤 PERFIL DEL VENDEDOR**
- **Información personal**
- **Estadísticas de ventas**
- **Configuración de notificaciones**
- **Datos de contacto** (WhatsApp, Instagram)

---

## 🔔 **SISTEMA DE NOTIFICACIONES**

### **NOTIFICACIONES IMPORTANTES:**
1. **Nueva orden recibida** 🔔
   - "Tienes una nueva orden de [Cliente]"
   - Mostrar producto y monto
   - Botón "Ver orden"

2. **Stock bajo** ⚠️
   - "Tu producto [Nombre] tiene stock bajo"
   - Botón "Actualizar stock"

3. **Orden lista para entrega** ✅
   - "La orden de [Cliente] está lista para entregar a sucursal"
   - Botón "Marcar como entregado"

---

## 💡 **CASOS DE USO DETALLADOS**

### **CASO 1: Nueva Orden Recibida**
```
1. Cliente crea orden desde la app
2. Vendedor recibe notificación
3. Vendedor ve detalles de la orden
4. Vendedor contacta al cliente por WhatsApp
5. Cliente confirma pago
6. Vendedor marca orden como "PAGO_CONFIRMADO"
7. Vendedor prepara el producto
8. Vendedor marca como "PREPARANDO"
9. Vendedor entrega a sucursal
10. Vendedor marca como "ENTREGADO_A_SUCURSAL"
```

### **CASO 2: Gestión de Stock**
```
1. Vendedor ve que un producto tiene stock bajo
2. Recibe notificación de stock bajo
3. Vendedor actualiza el stock
4. O desactiva el producto temporalmente
```

### **CASO 3: Comunicación con Cliente**
```
1. Vendedor ve orden pendiente
2. Toca "Contactar por WhatsApp"
3. Se abre WhatsApp con mensaje predefinido
4. Cliente y vendedor coordinan pago
5. Vendedor actualiza estado de la orden
```

---

## 🎯 **FUNCIONALIDADES CLAVE**

### **PARA EL VENDEDOR:**
- ✅ **Gestión completa de productos**
- ✅ **Seguimiento de órdenes en tiempo real**
- ✅ **Comunicación directa con clientes**
- ✅ **Notificaciones importantes**
- ✅ **Estadísticas de ventas**
- ✅ **Gestión de stock**

### **NO NECESARIO:**
- ❌ **Botón "Crear Pedido"** (el cliente lo hace)
- ❌ **Gestión de pagos** (se hace externamente)
- ❌ **Gestión de sucursales** (eso es del admin)

---

## 🚀 **PRÓXIMOS PASOS DE IMPLEMENTACIÓN**

### **PRIORIDAD 1:**
1. **Corregir error de creación de órdenes**
2. **Crear pantalla "Mis Productos"**
3. **Crear pantalla "Mis Órdenes"**
4. **Remover botón innecesario de crear pedido**

### **PRIORIDAD 2:**
5. **Mejorar notificaciones**
6. **Agregar filtros y búsquedas**
7. **Optimizar interfaz móvil**

### **PRIORIDAD 3:**
8. **Estadísticas avanzadas**
9. **Gestión de inventario**
10. **Reportes de ventas**

---

## 📊 **MÉTRICAS DE ÉXITO**
- **Tiempo de respuesta** a nuevas órdenes
- **Tasa de conversión** de órdenes pendientes
- **Satisfacción del vendedor** con la interfaz
- **Facilidad de uso** en dispositivos móviles

---

*Este documento debe ser actualizado conforme evolucionen las necesidades de los vendedores.*
