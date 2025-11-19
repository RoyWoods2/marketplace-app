FROM node:18-alpine

WORKDIR /app

# Copiar package.json y prisma primero (para cache de Docker)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código del backend
COPY backend/ .

# Exponer puerto
EXPOSE 3000

# Ejecutar migraciones y empezar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

