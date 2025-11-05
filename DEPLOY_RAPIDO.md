# ⚡ Deploy Rápido - 15 Minutos

## 🎯 Objetivo
Tener tu app funcionando en la nube para pruebas desde cualquier lugar.

---

## 🚀 Opción Más Rápida: Railway

### Paso 1: Crear Cuenta (2 min)
1. Ve a [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Conecta con **GitHub**
4. Autoriza Railway

### Paso 2: Crear Base de Datos (1 min)
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Copia el `DATABASE_URL` (lo necesitarás después)

### Paso 3: Deployar Backend (5 min)
1. Click **"+ New"** → **"Deploy from GitHub repo"**
2. Selecciona tu repositorio `marketplace`
3. En **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma migrate deploy && npm start`

### Paso 4: Configurar Variables (3 min)
En Railway → Variables, agrega:

```env
DATABASE_URL=postgresql://... (copiar del servicio PostgreSQL)
JWT_SECRET=tu_secret_super_seguro_2024
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

### Paso 5: Obtener URL (1 min)
1. Railway → Settings → Networking
2. Click **"Generate Domain"**
3. Copia la URL (ej: `marketplace-backend.up.railway.app`)

### Paso 6: Ejecutar Migraciones (2 min)
1. Instala Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Ejecuta: `cd backend && railway run npx prisma migrate deploy`

### Paso 7: Actualizar Móvil (1 min)
```bash
cd mobile-new
node scripts/update-api-url.js https://tu-url.railway.app
```

### Paso 8: Probar (1 min)
1. Abre: `https://tu-url.railway.app/api/health`
2. Deberías ver: `{"status":"OK","message":"Marketplace API is running"}`
3. Reinicia Expo: `npm start`
4. Prueba desde el móvil

---

## ✅ Listo!

Tu app está en producción. Puedes probarla desde cualquier lugar.

**URL del Backend:** `https://tu-url.railway.app`

---

## 🐛 Problemas Comunes

### Error: "Cannot connect to database"
→ Verifica que `DATABASE_URL` esté correcto en Railway Variables

### Error: "CORS policy"
→ Asegúrate de que `CORS_ORIGIN` esté configurado

### La app no se conecta
→ Verifica que la URL en `api.ts` sea HTTPS (no HTTP)

---

## 📝 Documentación Completa

Para más detalles, ver: `GUIA_DEPLOY_RAPIDO.md`

---

**¡A deployar!** 🚀

