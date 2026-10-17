const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Detectar si estamos en un entorno pkg
const isPkg = process.pkg !== undefined;

// Definir formatos de log
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

// Crear el logger
const transports = [];

// Solo agregar file transports si NO estamos en pkg
if (!isPkg) {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Archivo para todos los logs
    transports.push(new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    // Archivo solo para errores
    transports.push(new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    // Archivo específico para Mifact
    transports.push(new winston.transports.File({
        filename: path.join(logsDir, 'mifact.log'),
        level: 'info',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
}

// Siempre agregar consola (funciona en pkg y desarrollo)
transports.push(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    )
}));

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports
});

module.exports = logger;
