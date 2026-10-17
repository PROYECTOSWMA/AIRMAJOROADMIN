// 1. CARGAR VARIABLES DE ENTORNO PRIMERO
const dotenv = require('dotenv');
dotenv.config();

// 2. OTRAS IMPORTACIONES NECESARIAS
const app = require('./app.js');
const { testDbConnection } = require('./database/connection.js');

// 3. IMPORTAR EL MOTOR DE COMUNICACIONES
const { iniciarMotorComunicaciones } = require('./servicios/workerComunicaciones.js'); 

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        if (!process.env.JWT_SECRET) {
            console.error("¡ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida!");
            process.exit(1); 
        }
        
        await testDbConnection();

        app.listen(PORT, () => {
        // app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor escuchando en el puerto: ${PORT}`);
            // console.log(`Servidor accesible desde: http://0.0.0.0:${PORT}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}\n`);
            console.log('Server started successfully ...');

            // Iniciar el motor de comunicaciones
            // iniciarMotorComunicaciones();
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error.message);
        process.exit(1);
    }
}

main();