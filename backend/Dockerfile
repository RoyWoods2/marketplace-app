FROM node:18-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Generar Prisma Client
RUN npx prisma generate

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]

