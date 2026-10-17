const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth.js');

const { login, logout } = require('../controllers/seccion_usuarios.controllers.js');
const { getEmbedToken } = require('../controllers/powerbi.controller.js');

const router = Router();

// 1. RUTAS PARA LOGIN Y REGISTRO
router.post('/usuarios/login', login);
router.post('/usuarios/logout', authenticateToken, logout);

// Verifica la sesion activa (usado por nginx auth_request).
router.get('/usuarios/sesion', authenticateToken, (req, res) => {
    res.status(200).json({ status: 'success' });
});

// router.post('/usuarios/register', registrarUsuario);
// router.post('/usuarios/logout', authenticateToken, logoutUsuario);
// router.get('/usuarios/profile', authenticateToken, getProfile);
// router.get('/usuarios/list', authenticateToken, getAllUsersController);

// 2. RUTAS POWER BI
// Protegida con JWT: el usuario debe haber iniciado sesión en Air Majoro para pedirla
router.get('/powerbi/embed-token', authenticateToken, getEmbedToken);



module.exports = router;