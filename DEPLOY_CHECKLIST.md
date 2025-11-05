# ✅ Checklist de Deploy - Marketplace App

## 📋 Pre-Deploy

### Backend
- [ ] Dockerfile creado
- [ ] `.dockerignore` configurado
- [ ] `railway.json` creado (opcional)
- [ ] CORS configurado para producción
- [ ] Variables de entorno documentadas en `env.example`

### Base de Datos
- [ ] Migraciones en `prisma/migrations/` están actualizadas
- [ ] Schema de Prisma está completo
- [ ] Datos de prueba documentados (si aplica)

### Móvil
- [ ] Script `update-api-url.js` creado
- [ ] `api.ts` usa variables de entorno o configuración flexible
- [ ] URLs hardcodeadas identificadas y documentadas

---

## 🚀 Deploy en Railway

### Paso 1: Setup Railway
- [ ] Cuenta creada en [railway.app](https://railway.app)
- [ ] GitHub conectado a Railway
- [ ] Proyecto creado

### Paso 2: Base de Datos
- [ ] Servicio PostgreSQL creado
- [ ] `DATABASE_URL` copiado
- [ ] Conexión probada (opcional)

### Paso 3: Backend
- [ ] Servicio Node.js creado desde GitHub
- [ ] Root Directory configurado: `backend`
- [ ] Build Command: `npm install && npx prisma generate`
- [ ] Start Command: `npx prisma migrate deploy && npm start`
- [ ] Variables de entorno configuradas:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `CORS_ORIGIN` (actualizar después de obtener URL)
  - [ ] `CLOUDINARY_CLOUD_NAME` (si aplica)
  - [ ] `CLOUDINARY_API_KEY` (si aplica)
  - [ ] `CLOUDINARY_API_SECRET` (si aplica)

### Paso 4: Migraciones
- [ ] Migraciones ejecutadas en producción
- [ ] Verificar que las tablas se crearon correctamente

### Paso 5: URL Pública
- [ ] Domain generado en Railway
- [ ] URL copiada (ej: `https://marketplace-backend.up.railway.app`)
- [ ] `CORS_ORIGIN` actualizado en variables de entorno

### Paso 6: Verificación Backend
- [ ] Health check funciona: `/api/health`
- [ ] Login funciona: `/api/auth/login`
- [ ] Registro funciona: `/api/auth/register`
- [ ] Productos se pueden listar: `/api/products`

---

## 📱 Configuración Móvil

### Paso 7: Actualizar URLs
- [ ] URL del backend obtenida
- [ ] Script ejecutado: `node scripts/update-api-url.js https://tu-url.railway.app`
- [ ] `api.ts` actualizado
- [ ] Archivos con URLs hardcodeadas actualizados

### Paso 8: Probar Móvil
- [ ] Expo reiniciado
- [ ] Login funciona desde móvil
- [ ] Registro funciona desde móvil
- [ ] Productos se cargan
- [ ] Órdenes funcionan
- [ ] QR funciona

---

## 🔒 Seguridad

- [ ] `JWT_SECRET` es fuerte y único
- [ ] Variables sensibles no están en el código
- [ ] `.env` está en `.gitignore`
- [ ] CORS configurado correctamente (no `*` en producción)
- [ ] Rate limiting considerado (futuro)

---

## 📊 Monitoreo (Futuro)

- [ ] Logs accesibles en Railway
- [ ] Alertas configuradas (opcional)
- [ ] Error tracking (Sentry) considerado

---

## 🧪 Testing Post-Deploy

### Funcionalidades Core
- [ ] Usuario puede registrarse
- [ ] Usuario puede iniciar sesión
- [ ] Vendedor puede crear productos
- [ ] Cliente puede ver productos
- [ ] Cliente puede crear orden
- [ ] Vendedor puede ver órdenes
- [ ] QR se genera correctamente
- [ ] Notificaciones funcionan

### Edge Cases
- [ ] Manejo de errores de red
- [ ] Timeout de requests
- [ ] Validación de datos
- [ ] Permisos de usuario

---

## 📝 Documentación

- [ ] URL de producción documentada
- [ ] Credenciales de producción guardadas de forma segura
- [ ] Variables de entorno documentadas
- [ ] Pasos de deploy documentados

---

## 🎯 Post-Deploy

- [ ] Crear usuarios de prueba
- [ ] Probar flujo completo end-to-end
- [ ] Documentar cualquier problema encontrado
- [ ] Planificar mejoras basadas en feedback

---

## 🔄 Rollback Plan

Si algo sale mal:
1. [ ] Revertir deployment en Railway
2. [ ] Verificar estado de base de datos
3. [ ] Revisar logs de errores
4. [ ] Corregir problemas
5. [ ] Re-deployar

---

**Fecha de Deploy:** _______________
**URL de Producción:** _______________
**Deploy realizado por:** _______________

