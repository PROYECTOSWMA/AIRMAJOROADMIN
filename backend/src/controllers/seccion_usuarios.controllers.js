const { getConnection, releaseConnection } = require('../database/connection.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieOptions = require('../config/cookieConfig');
const { v4: uuidv4 } = require('uuid');

// Carga las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_DURATION_HOURS = parseInt(process.env.SESSION_DURATION_HOURS, 10) || 24;


/**
  @controller registrarDocente
  @description Registra específicamente a un Docente desde el panel de administración.
  @method POST
 **/
exports.registrarDocente = async (req, res) => {
    let client;
    try {
        const { nombres, apellido_paterno, apellido_materno, email, password, numero_documento, telefono_contacto } = req.body;

        // 1. VALIDACIONES BÁSICAS DEL FRONTEND
        if (!nombres || !apellido_paterno || !apellido_materno || !email || !password || !numero_documento) {
            return res.status(400).json({
                status: "error",
                code: 400,
                message: "Nombres, apellido paterno, apellido materno, email, contraseña y DNI son obligatorios."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: "error",
                code: 400,
                message: "La contraseña debe tener al menos 6 caracteres."
            });
        }

        // 2. HASHEAR LA CONTRASEÑA (Nivel de seguridad 10)
        const passwordHash = await bcrypt.hash(password, 10);

        client = await getConnection();

        // 3. PREPARAR JSON PARA LA BD (Le inyectamos el rol 'DOCENTE' por defecto)
        const requestJsonToPg = JSON.stringify({
            nombres: nombres,
            apellido_paterno: apellido_paterno,
            apellido_materno: apellido_materno,
            email: email,
            password_hash: passwordHash,
            numero_documento: numero_documento,
            telefono_contacto: telefono_contacto,
            rol: 'DOCENTE' // Hardcodeado porque esta API es exclusiva para crear docentes
        });

        // 4. EJECUTAR FUNCIÓN EN POSTGRES
        const pgResponse = await client.query('SELECT api_registrar_usuario_sistema($1) AS resultado', [requestJsonToPg]);
        const result = pgResponse.rows[0].resultado;

        // 5. RESPONDER AL FRONTEND
        res.status(result.code || 200).json(result);

    } catch (error) {
        console.error("[ERROR] en registrarDocente:", error);
        res.status(500).json({
            status: "error",
            code: 500,
            message: "Error interno del servidor al registrar el docente."
        });
    } finally {
        if (client) releaseConnection(client);
    }
};


/**
 * @controller login
 * @description Inicia sesión, valida hash, crea sesión en BD, genera JWT y devuelve menú dinámico de Air Majoro.
 * @method POST
 */
exports.login = async (req, res) => {
    let client;
    try {
        const { email, password } = req.body;

        // 1. VALIDAR ENTRADAS
        if (!email || !password) {
            return res.status(400).json({ message: "El email y la contraseña son requeridos." });
        }

        client = await getConnection();
        const requestJsonToPg = JSON.stringify({ email });

        // 2. LLAMAR A LA FUNCIÓN DE LOGIN DE POSTGRES (Actualizado a Air Majoro)
        const pgResponse = await client.query('SELECT api_login_erp_airmajoro($1) AS resultado', [requestJsonToPg]);
        const dbResult = pgResponse.rows[0].resultado;

        // Si la BD devuelve un error (usuario no encontrado, inactivo), lo reenviamos
        if (dbResult.status !== 'success') {
            return res.status(dbResult.code || 401).json({ message: dbResult.message });
        }

        const userData = dbResult.data;

        // 3. COMPARAR CONTRASEÑA RECIBIDA CON EL HASH DE LA BD (Paso de seguridad crítico)
        const isPasswordMatch = await bcrypt.compare(password, userData.password_hash);

        if (!isPasswordMatch) {
            // Mensaje genérico para no dar pistas a atacantes
            return res.status(401).json({ message: "Email o contraseña incorrectos." });
        }

        // 4. CREAR LA SESIÓN EN LA BASE DE DATOS (Tabla 'sesiones_usuario')
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
        const userAgent = req.headers['user-agent'] || 'Desconocido';
        const ipAddress = req.ip || req.connection?.remoteAddress;

        await client.query(
            `INSERT INTO sesiones_usuario (id_sesion, id_usuario, user_agent, direccion_ip, fecha_expiracion)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, userData.id_usuario, userAgent, ipAddress, expiresAt]
        );

        // ================================================================
        // PASO 5: CREAR EL JSON WEB TOKEN (JWT)
        // ================================================================
        const jwtPayload = {
            userId: userData.id_usuario,
            rol: userData.rol,
            sessionId: sessionId
        };

        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: `${SESSION_DURATION_HOURS}h` });

        // 6. ESTABLECER EL TOKEN EN UNA COOKIE SEGURA
        res.cookie('wma-session-token', token, {
            ...cookieOptions, // Asegúrate de que tenga: httpOnly: true, secure: true, sameSite: 'strict'
            maxAge: SESSION_DURATION_HOURS * 60 * 60 * 1000 // La cookie expira con la sesión
        });

        // 7. ENVIAR RESPUESTA FINAL AL FRONTEND
        // Excluimos el hash de la contraseña y agregamos los datos aeronáuticos
        res.status(200).json({
            status: "success",
            message: "Login exitoso.",
            user: {
                id_usuario: userData.id_usuario,
                nombre_completo: userData.nombre_completo,
                rol: userData.rol,
                sede: userData.sede,
                codigo_base: userData.codigo_base, // Ej: "SPCL"
                licencia_aeronautica: userData.licencia_aeronautica, // Vital para la firma en pista
                modulos: userData.modulos // El menú dinámico generado por la BD
            }
        });

    } catch (error) {
        console.error("[ERROR] en login:", error);
        res.status(500).json({ message: "Error interno del servidor durante el inicio de sesión." });
    } finally {
        if (client) {
            releaseConnection(client);
        }
    }
};

/**
 * @controller logout
 * @description Cierra la sesión del usuario invalidando la sesión en la BD y eliminando la cookie.
 * @method POST
 */
exports.logout = async (req, res) => {
    let client;
    try {
        // Obtenemos el token desde la cookie que el navegador envía automáticamente
        const token = req.cookies['wma-session-token'];

        if (!token) {
            // Si no hay token, el usuario ya no tiene sesión, así que no hay nada que hacer.
            return res.status(200).json({ message: "No hay sesión activa para cerrar." });
        }

        client = await getConnection();

        // Verificamos el token para extraer el ID de la sesión (sessionId)
        const payload = jwt.verify(token, JWT_SECRET);

        const sessionId = payload.sessionId;

        if (sessionId) {
            // Marcamos la sesión como inactiva en la base de datos
            await client.query(
                `UPDATE sesiones_usuario SET activa = FALSE WHERE id_sesion = $1`,
                [sessionId]
            );
        }

        // Le decimos al navegador que borre la cookie.
        // Esto se hace enviando una cookie con el mismo nombre pero con una fecha de expiración en el pasado.
        res.cookie('wma-session-token', '', {
            ...cookieOptions,
            expires: new Date(0) // ¡La cookie expira inmediatamente!
        });

        res.status(200).json({ status: "success", message: "Sesión cerrada exitosamente." });

    } catch (error) {
        // Si el token es inválido o expiró, igualmente borramos la cookie para limpiar.
        res.cookie('wma-session-token', '', { expires: new Date(0) });

        console.error("[ERROR] en logout:", error.message);
        // No enviamos un 500, ya que el objetivo (cerrar sesión) se cumple
        res.status(200).json({ status: "success", message: "Sesión cerrada." });
    } finally {
        if (client) {
            releaseConnection(client);
        }
    }
};



/**
 * @controller actualizarDocente
 * @description Actualiza parcialmente los datos de un docente. Hashea la clave solo si se envía una nueva.
 * @method POST
 */
exports.actualizarDocente = async (req, res) => {
    let clienteBd;
    try {
        // Extraemos los datos que envía el frontend (pueden venir vacíos/undefined)
        const {
            id_usuario,
            nombres,               // NUEVO
            apellido_paterno,      // NUEVO
            apellido_materno,      // NUEVO
            email,
            password,
            numero_documento,
            telefono_contacto
        } = req.body;

        // 1. VALIDACIÓN BÁSICA (El ID es lo único 100% obligatorio)
        if (!id_usuario) {
            return res.status(400).json({
                status: "error",
                code: 400,
                message: "El ID del docente (id_usuario) es obligatorio para actualizar."
            });
        }

        // 2. HASHEAR LA CONTRASEÑA SOLO SI EL USUARIO DECIDIÓ CAMBIARLA
        let contrasenaHasheada = null; // Por defecto es null para que SQL no la actualice

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    status: "error",
                    code: 400,
                    message: "La nueva contraseña debe tener al menos 6 caracteres."
                });
            }
            // Hasheamos la nueva contraseña (Nivel de seguridad 10)
            contrasenaHasheada = await bcrypt.hash(password, 10);
        }

        // 3. CONECTAR A LA BASE DE DATOS
        clienteBd = await getConnection();

        // 4. PREPARAR EL JSON PARA POSTGRES
        const datosParaPostgres = JSON.stringify({
            id_usuario: id_usuario,
            nombres: nombres,
            apellido_paterno: apellido_paterno,
            apellido_materno: apellido_materno,
            email: email,
            password_hash: contrasenaHasheada,
            numero_documento: numero_documento,
            telefono_contacto: telefono_contacto
        });

        // 5. EJECUTAR FUNCIÓN SQL
        const respuestaBd = await clienteBd.query('SELECT api_actualizar_usuario_sistema($1) AS resultado', [datosParaPostgres]);
        const resultadoFinal = respuestaBd.rows[0].resultado;

        // 6. RESPONDER AL FRONTEND
        res.status(resultadoFinal.code || 200).json(resultadoFinal);

    } catch (error) {
        console.error("[ERROR] en actualizarDocente:", error);
        res.status(500).json({
            status: "error",
            code: 500,
            message: "Error interno del servidor al actualizar el docente."
        });
    } finally {
        if (clienteBd) releaseConnection(clienteBd);
    }
};