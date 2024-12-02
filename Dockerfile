# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia el package.json y el package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .
COPY .env .env

# Expone el puerto en el que la aplicación se ejecutará
EXPOSE 3033

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]