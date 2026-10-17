const pg     = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = pg;

// 1. CONFIGURACIÓN ESTRICTA DE LA BASE DE DATOS DESDE .env
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

pool.on('error', (err, client) => {
  console.error('Error inesperado en el cliente del pool de PostgreSQL:', err);
  process.exit(-1);
});

// 2. FUNCIÓN PARA OBTENER UNA CONEXIÓN DEL POOL
exports.getConnection = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error al obtener cliente del pool de PostgreSQL:', error.message);
    throw error;
  }
};

// 3. FUNCIÓN PARA PROBAR LA CONEXIÓN (usada en index.js al arrancar)
exports.testDbConnection = async () => {
  let client;
  try {
      client = await pool.connect();
      await client.query('SELECT 1');
      console.log('Conexión a PostgreSQL establecida y probada exitosamente.');
  } catch (error) {
      console.error('Fallo crítico al probar la conexión con PostgreSQL.');
      throw new Error(`No se pudo conectar a la base de datos: ${error.message}`);
  } finally {
      if (client) {
          client.release();
      }
  }
};

// 4. FUNCIÓN PARA LIBERAR LA CONEXIÓN DE VUELTA AL POOL
exports.releaseConnection = (client) => {
  if (client) {
    client.release();
  }
};