# Etapa 1: construir la app
FROM node:18 AS build
WORKDIR /app

# Copiar dependencias e instalarlas
COPY package*.json ./
RUN npm install

# Copiar todo el código fuente
COPY . .

# Construir la app para producción
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
