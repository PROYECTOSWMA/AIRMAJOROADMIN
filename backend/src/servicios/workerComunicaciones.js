const { getConnection, releaseConnection } = require('../database/connection.js');
const { enviarMensajeWhatsAppConRespaldo } = require('./servicioNotificaciones.js');

// Variable bandera para saber si el motor ya está enviando un mensaje y no duplicar envíos
let isRunning = false; 

const procesarColaEnvios = async () => {
    if (isRunning) return; // Si ya está trabajando, que ignore esta llamada
    isRunning = true;

    let client;
    try {
        client = await getConnection();
        
        // 1. Buscar SOLO 1 mensaje pendiente (El más antiguo)
        const querySelect = `
            SELECT id_cola, telefono_destino, mensaje_procesado 
            FROM comunicaciones_cola_envios 
            WHERE estado = 'PENDIENTE' 
            ORDER BY fecha_creacion ASC 
            LIMIT 1
        `;
        const res = await client.query(querySelect);

        // Si la cola está vacía, apagamos el motor y salimos silenciosamente
        if (res.rows.length === 0) {
            isRunning = false;
            return;
        }

        const mensaje = res.rows[0];

        // 2. Marcarlo como 'PROCESANDO' para asegurarnos que no se envíe dos veces
        await client.query("UPDATE comunicaciones_cola_envios SET estado = 'PROCESANDO' WHERE id_cola = $1", [mensaje.id_cola]);

        console.log(`[Motor WSP] Enviando mensaje a ${mensaje.telefono_destino}...`);

        // 3. ENVIAR EL WHATSAPP (Usa tu función que ya tiene el Respaldo UltraMsg)
        const exito = await enviarMensajeWhatsAppConRespaldo(mensaje.telefono_destino, mensaje.mensaje_procesado);

        // 4. Actualizar el estado final en la Base de Datos
        if (exito) {
            await client.query("UPDATE comunicaciones_cola_envios SET estado = 'ENVIADO', fecha_envio = NOW() WHERE id_cola = $1", [mensaje.id_cola]);
            console.log(`[Motor WSP] ✅ Mensaje ${mensaje.id_cola} ENVIADO.`);
        } else {
            await client.query("UPDATE comunicaciones_cola_envios SET estado = 'FALLIDO', motivo_error = 'Falló API Principal y Respaldo' WHERE id_cola = $1", [mensaje.id_cola]);
            console.log(`[Motor WSP] ❌ Mensaje ${mensaje.id_cola} FALLIDO.`);
        }

        // ====================================================================
        // 5. PAUSA ALEATORIA ANTI-SPAM (EL SECRETO PARA QUE NO TE BANEEN)
        // ====================================================================
        const minMinutos = 1; // Mínimo 1 minuto de pausa
        const maxMinutos = 3; // Máximo 3 minutos de pausa (Puedes subirlo a 5 si deseas)
        
        // Fórmula matemática para obtener un tiempo aleatorio en milisegundos
        const delayMillis = Math.floor(Math.random() * (maxMinutos - minMinutos + 1) + minMinutos) * 60 * 1000;
        
        console.log(`[Motor WSP] ⏱️ Pausa de seguridad: Esperando ${delayMillis / 1000 / 60} minutos para enviar el siguiente...`);
        
        setTimeout(() => {
            isRunning = false; // Liberamos el motor
            procesarColaEnvios(); // Se llama a sí mismo para procesar el siguiente mensaje
        }, delayMillis);

    } catch (error) {
        console.error("[Motor WSP Error]:", error);
        isRunning = false;
    } finally {
        if (client) releaseConnection(client);
    }
};

/**
 * Función que arranca el motor. 
 * Se ejecutará cada 30 segundos revisando si hay algo nuevo en la tabla.
 */
const iniciarMotorComunicaciones = () => {
    console.log("🚀 Motor de Envíos Masivos (Anti-Spam) inicializado...");
    // Aunque el setInterval corre cada 30 seg, la bandera "isRunning" evitará que haga algo 
    // si está en medio de una pausa aleatoria larga.
    setInterval(procesarColaEnvios, 30000); 
};

module.exports = { iniciarMotorComunicaciones };