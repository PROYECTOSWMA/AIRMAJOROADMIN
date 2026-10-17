# Usa una imagen base de Node.js con la versión que necesitas
FROM node:22

# Crea un directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json (o yarn.lock)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de tu aplicación
COPY . .

# Define el puerto que expondrá el contenedor
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"] 