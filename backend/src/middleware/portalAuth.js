// src/middleware/portalAuth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.authenticatePortalToken = (req, res, next) => {
    // 1. OBTENER EL TOKEN DESDE EL HEADER "AUTHORIZATION" (Bearer)
    const authHeader = req.headers['authorization'];
    
    // El header viene como "Bearer eyJhbGciOi..."
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Acceso denegado. Se requiere un token de autenticación."
        });
    }

    try {
        // 2. VERIFICAR EL JWT
        const payload = jwt.verify(token, JWT_SECRET);

        // 3. ¡ÉXITO! Verificamos que sea un token de padre
        if (payload.rol !== 'PORTAL_PADRE') {
            return res.status(403).json({
                status: "error",
                message: "Acceso denegado. Este token no pertenece a un apoderado."
            });
        }
        
        // 4. ADJUNTAMOS LA INFO AL OBJETO 'req'
        req.user = {
            id_usuario: payload.id_usuario,
            rol: payload.rol
        };

        // 5. PERMITIR QUE LA SOLICITUD CONTINÚE
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: "error", message: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo." });
        }
        console.error("Error en middleware authenticatePortalToken:", error);
        return res.status(500).json({ status: "error", message: "Error interno durante la autenticación del portal." });
    }
};