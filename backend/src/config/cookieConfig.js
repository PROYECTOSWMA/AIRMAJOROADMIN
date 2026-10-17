// src/config/cookieConfig.js

// Centralizamos las opciones de la cookie para consistencia en todo el proyecto.
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    domain: process.env.NODE_ENV === 'production' ? '.wmasystems.com' : undefined,
    path: '/'
};

module.exports = cookieOptions;