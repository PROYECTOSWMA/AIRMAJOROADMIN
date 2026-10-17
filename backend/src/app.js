const express = require('express');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes/api.routes.js');
const cors = require('cors');

const app = express();

// =============================================================
// CONFIGURACIÓN DE MIDDLEWARES Y SEGURIDAD
// =============================================================

// 1. CONFIGURACIÓN DE CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://wmaschool.wmasystems.com',
    'https://wmasmart.wmasystems.com',
    'https://airmajoro.wmasystems.com',
    // Permitir cualquier origen en desarrollo (comentar en producción)
    // ...(process.env.NODE_ENV !== 'production' ? [/^http:\/\/.*:\d+$/] : [])
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log("CORS check. Request origin:", origin);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            // if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(regex => regex instanceof RegExp && regex.test(origin))) {
            console.log("CORS allowed for origin:", origin);
            callback(null, true);
        } else {
            console.warn(`Origin not allowed by CORS: ${origin}`);
            callback(new Error('Acceso no permitido por CORS'));
        }
    },
    credentials: true,
};

// 2. APLICACIÓN DE MIDDLEWARES GLOBALES (en el orden correcto)
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// 3. RUTAS DE LA APLICACIÓN
app.use('/api', apiRoutes);

// =============================================================
// MANEJO DE ERRORES (DEBEN IR AL FINAL)
// =============================================================

// 4. MANEJO DE RUTAS NO ENCONTRADAS (Error 404)
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Ruta no encontrada.'
    });
});

// 5. MANEJO DE ERRORES GENERALES (Error 500 y otros)
app.use((err, req, res, next) => {
    console.error("Error no manejado:", err.stack || err.message || err);

    if (err.message === 'Acceso no permitido por CORS') {
        return res.status(403).json({
            status: 'error',
            code: 403,
            message: 'Acceso denegado por política CORS.'
        });
    }

    res.status(err.status || 500).json({
        status: 'error',
        code: err.status || 500,
        message: err.message || 'Error interno del servidor.'
    });
});

module.exports = app;