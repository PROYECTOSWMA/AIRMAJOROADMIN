const jwt = require('jsonwebtoken');
const cookieOptions = require('../config/cookieConfig');
const { getConnection, releaseConnection } = require('../database/connection.js');

const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticateToken = async (req, res, next) => {
    // 1. OBTENER EL TOKEN DESDE LA COOKIE
    const token = req.cookies['wma-session-token']; // Usamos el nuevo nombre de nuestra cookie

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Acceso denegado. Se requiere iniciar sesión."
        });
    }

    let client;
    try {
        // 2. VERIFICAR EL JWT CON 'JSONWEBTOKEN'
        const payload = jwt.verify(token, JWT_SECRET);

        // 3. VERIFICAR QUE EL PAYLOAD DEL TOKEN CONTENGA EL ID DE SESIÓN
        if (!payload.sessionId) {
            // Si el token es malformado, lo borramos del navegador
            res.cookie('wma-session-token', '', { ...cookieOptions, expires: new Date(0) });
            return res.status(401).json({ status: "error", message: "Token inválido (formato incorrecto)." });
        }

        client = await getConnection();

        // 4. VERIFICAR LA SESIÓN EN LA BASE DE DATOS
        const sessionQuery = await client.query(
            `SELECT id_usuario FROM sesiones_usuario 
             WHERE id_sesion = $1 AND activa = TRUE AND fecha_expiracion > NOW()`,
            [payload.sessionId]
        );

        if (sessionQuery.rows.length === 0) {
            // Si no se encuentra, la sesión fue cerrada (logout) o expiró.
            res.cookie('wma-session-token', '', { ...cookieOptions, expires: new Date(0) });
            return res.status(401).json({
                status: "error",
                message: "Acceso denegado. Tu sesión ha expirado o es inválida."
            });
        }

        // 5. ¡ÉXITO! ADJUNTAMOS LA INFO DEL USUARIO AL OBJETO 'req'
        req.user = {
            id_usuario: payload.userId,
            rol: payload.rol,
            sessionId: payload.sessionId
        };

        // 6. PERMITIR QUE LA SOLICITUD CONTINÚE
        next();

    } catch (error) {
        // 7. MANEJO DE ERRORES DE 'JSONWEBTOKEN'
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            res.cookie('wma-session-token', '', { ...cookieOptions, expires: new Date(0) });
            return res.status(401).json({ status: "error", message: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo." });
        }

        console.error("Error en middleware authenticateToken:", error);
        return res.status(500).json({
            status: "error",
            message: "Error interno del servidor durante la autenticación."
        });
    } finally {
        if (client) {
            releaseConnection(client);
        }
    }
};