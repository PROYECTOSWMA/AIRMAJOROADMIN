const fetch = require('node-fetch');

// =================================================================================
// SECCIÓN 1: CONFIGURACIÓN
// =================================================================================
// La IP y el puerto vendrán de tus variables de entorno para flexibilidad.
const URL_SERVICIO_PRINCIPAL = process.env.WHATSAPP_PRIMARY_SERVICE_URL || 'http://localhost:4005/send-message';

// Servicio de Respaldo (UltraMsg)
const ID_INSTANCIA_ULTRAMSG = process.env.ULTRAMSG_INSTANCE_ID;
const TOKEN_ULTRAMSG = process.env.ULTRAMSG_TOKEN;
const URL_API_ULTRAMSG = `https://api.ultramsg.com/${ID_INSTANCIA_ULTRAMSG}/messages/chat`;

// =================================================================================
// SECCIÓN 2: FUNCIONES DE BAJO NIVEL (CADA UNA PARA UN PROVEEDOR)
// =================================================================================

/**
 * Normaliza un número de teléfono celular para el formato internacional de Perú (E.164 sin el '+').
 * Detecta y maneja formatos locales (9 dígitos) e internacionales (con o sin '+51').
 * 
 * @param {string|number} numero - El número de teléfono de entrada (ej: '987654321', '+51 987 654 321', '51987654321').
 * @returns {string|null} - El número normalizado ('51987654321') o null si es inválido.
 */
const normalizarNumeroTelefono = (numero) => {
    // 1. Validar entrada nula o vacía (convierte números a string por seguridad)
    if (numero == null || numero === '') return null;

    let strNumero = String(numero);

    // 2. Limpiar: Quitar absolutamente todo lo que no sea un número (espacios, guiones, '+', paréntesis)
    let soloDigitos = strNumero.replace(/\D/g, '');

    // 3. Caso 1: El usuario mandó el número ya con el prefijo "51" (Total 11 dígitos)
    // Ejemplo de entrada: "+51 987 654 321" o "51987654321"
    if (soloDigitos.length === 11 && soloDigitos.startsWith('51')) {
        // Le quitamos el "51" temporalmente para validar que lo que sigue sea un celular válido
        const numeroSinPrefijo = soloDigitos.substring(2);

        // Un celular en Perú siempre empieza con '9'
        if (!numeroSinPrefijo.startsWith('9')) {
            console.warn(`[Normalizador] Número con prefijo 51 inválido (no empieza con 9): "${numero}" -> "${numeroSinPrefijo}"`);
            return null;
        }

        // Si todo está bien, lo devolvemos tal cual (ya tiene el 51)
        return soloDigitos;
    }

    // 4. Caso 2: El usuario mandó solo el número local (Total 9 dígitos)
    // Ejemplo de entrada: "987 654 321" o "987-654-321"
    if (soloDigitos.length === 9) {
        if (!soloDigitos.startsWith('9')) {
            console.warn(`[Normalizador] Celular local inválido (no empieza con 9): "${numero}" -> "${soloDigitos}"`);
            return null;
        }
        // Si es válido, le agregamos el prefijo '51'
        return `51${soloDigitos}`;
    }

    // 5. Caso 3: Tiene una longitud extraña (ni 9 ni 11 dígitos)
    console.warn(`[Normalizador] Longitud de número inválida (${soloDigitos.length} dígitos): "${numero}" -> "${soloDigitos}"`);
    return null;
};


/**
 * Intenta enviar un WhatsApp utilizando nuestro servicio principal (el .exe).
 * @returns {Promise<boolean>} Devuelve true si tuvo éxito, false si falló.
 */
const enviarViaServicioPrincipal = async (destinatario, cuerpoMensaje) => {
    try {
        console.log(`[Servicio Principal] Intentando enviar WhatsApp a: ${destinatario}`);
        const respuesta = await fetch(URL_SERVICIO_PRINCIPAL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: destinatario, body: cuerpoMensaje }),
        });
        const datosRespuesta = await respuesta.json();

        if (respuesta.ok && datosRespuesta.success) {
            console.log(`✅ [Servicio Principal] Mensaje entregado exitosamente.`);
            return true;
        }
        console.warn(`⚠️ [Servicio Principal] El envío falló. Razón: ${datosRespuesta.message || 'Desconocida'}`);
        return false;
    } catch (error) {
        console.error("❌ [Servicio Principal] Error de conexión. El servicio puede estar caído.", error.message);
        return false;
    }
};

/**
 * Intenta enviar un WhatsApp utilizando el servicio de respaldo (UltraMsg).
 * @returns {Promise<boolean>} Devuelve true si tuvo éxito, false si falló.
 */
const enviarViaRespaldoUltraMsg = async (destinatario, cuerpoMensaje) => {
    if (!ID_INSTANCIA_ULTRAMSG || !TOKEN_ULTRAMSG) {
        console.error("❌ [Servicio Respaldo] Faltan las credenciales de UltraMsg en el .env. No se puede continuar.");
        return false;
    }
    try {
        console.log(`[Servicio Respaldo] Intentando enviar WhatsApp vía UltraMsg a: ${destinatario}`);
        const parametros = new URLSearchParams();
        parametros.append("token", TOKEN_ULTRAMSG);
        parametros.append("to", destinatario);
        parametros.append("body", cuerpoMensaje);

        const respuestaAPI = await fetch(URL_API_ULTRAMSG, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: parametros
        });
        const datosRespuesta = await respuestaAPI.json();
        if (respuestaAPI.ok && !datosRespuesta.error) {
            console.log(`✅ [Servicio Respaldo] Mensaje enviado exitosamente vía UltraMsg.`);
            return true;
        }
        console.error(`❌ [Servicio Respaldo] Error en UltraMsg:`, datosRespuesta.error || 'Respuesta no exitosa');
        return false;
    } catch (error) {
        console.error("❌ [Servicio Respaldo] Error crítico de conexión con UltraMsg:", error);
        return false;
    }
};

// =================================================================================
// SECCIÓN 3: ORQUESTADOR DE ENVÍO (CON LÓGICA DE RESPALDO)
// =================================================================================

/**
 * Orquesta el envío: primero intenta con el servicio principal y si falla,
 * activa automáticamente el servicio de respaldo.
 */
const enviarMensajeWhatsAppConRespaldo = async (destinatario, cuerpoMensaje) => {

    // NORMALIZANDO EL NUMERO DE TELEFONO
    const numeroNormalizado = normalizarNumeroTelefono(destinatario);

    // VALIDANDO QUE EL NUMERO SEA VALIDO
    if (!numeroNormalizado) {
        console.error(`[Orquestador] No se puede enviar el mensaje. El número de teléfono "${destinatario}" no pudo ser normalizado.`);
        return false;
    }

    // 1. Intento con el servicio principal.
    const exitoPrincipal = await enviarViaServicioPrincipal(numeroNormalizado, cuerpoMensaje);

    // 2. Si el principal falló, activamos el respaldo.
    if (!exitoPrincipal) {
        console.log(`🔄 [Orquestador] El servicio principal falló. Activando respaldo para: ${destinatario}...`);
        return await enviarViaRespaldoUltraMsg(numeroNormalizado, cuerpoMensaje);
    }

    return true; // El servicio principal funcionó, no se necesita respaldo.
};

// =================================================================================
// SECCIÓN 4: FUNCIONES DE ALTO NIVEL (EXPORTADAS PARA USO EN CONTROLADORES)
// =================================================================================

const enviarNotificacionAsistenciaDocente = async (numeroTelefono, nombreCompletoDocente, estadoAsistencia) => {
    let cuerpoMensaje = '';
    const primerNombre = nombreCompletoDocente.split(',')[1]?.trim().split(' ')[0] || nombreCompletoDocente;

    if (estadoAsistencia === 'PUNTUAL') {
        cuerpoMensaje = `¡Hola, ${primerNombre}! 👋\n\nTu asistencia ha sido registrada como *PUNTUAL*. ¡Excelente! ✨\n\nTu compromiso y puntualidad son un gran ejemplo para nuestros estudiantes. ¡Gracias por empezar el día con el pie derecho! 🚀`;
    } else if (estadoAsistencia === 'TARDE') {
        cuerpoMensaje = `Hola, ${primerNombre} 👋\n\nTu asistencia ha sido registrada con *TARDANZA*.\n\nRecuerda que la puntualidad es clave en nuestra labor educativa. Si tuviste algún inconveniente, no dudes en comunicarlo a coordinación. ¡Que tengas un excelente día!`;
    } else {
        console.warn(`[Servicio Notificaciones] No se envió notificación porque el estado '${estadoAsistencia}' no es manejado.`);
        return;
    }

    await enviarMensajeWhatsAppConRespaldo(numeroTelefono, cuerpoMensaje);
};


const enviarNotificacionAsistenciaEstudiante = async (numeroTelefono, nombreAlumno, estadoAsistencia, hora) => {
    let cuerpoMensaje = '';
    
    // Obtenemos solo el primer nombre del alumno para hacerlo más cercano
    const nombreEmpresa = process.env.NOMBRE_EMPRESA || 'Empresa Demo';
    const primerNombreAlumno = nombreAlumno.split(' ')[0] || nombreAlumno;

    if (estadoAsistencia === 'PUNTUAL') {
        cuerpoMensaje = `🏫 *${nombreEmpresa} - Control de Asistencia*\n\nEstimado padre/madre de familia,\n\nLe informamos que su menor hijo(a) *${primerNombreAlumno}* ha ingresado al colegio de manera *PUNTUAL* a las ${hora}. ✅\n\n¡Gracias por fomentar la puntualidad! ✨`;
    } else if (estadoAsistencia === 'TARDE') {
        cuerpoMensaje = `🏫 *${nombreEmpresa} - Control de Asistencia*\n\nEstimado padre/madre de familia,\n\nLe informamos que su menor hijo(a) *${primerNombreAlumno}* ha ingresado al colegio con *TARDANZA* a las ${hora}. ⏰\n\nLe recordamos la importancia de la puntualidad para el buen desarrollo académico.`;
        // cuerpoMensaje = `🏫 *${nombreEmpresa} - Control de Asistencia*\n\nEstimado padre/madre de familia,\n\nLe informamos que su menor hijo(a) *${primerNombreAlumno}* ha ingresado al colegio con *TARDANZA* a las ${hora}. ⏰\n\nLe recordamos la importancia de la puntualidad para el buen desarrollo académico. Si hubo algún contratiempo, por favor justifíquelo mediante la agenda.`;
    }

    await enviarMensajeWhatsAppConRespaldo(numeroTelefono, cuerpoMensaje);
};

module.exports = {
    enviarNotificacionAsistenciaDocente,
    enviarNotificacionAsistenciaEstudiante,
    enviarMensajeWhatsAppConRespaldo
};