const fetch = require('node-fetch');

// =============================================================
// Leemos las credenciales del archivo .env
// =============================================================
const TENANT_ID     = process.env.POWERBI_TENANT_ID;
const CLIENT_ID     = process.env.POWERBI_CLIENT_ID;
const CLIENT_SECRET = process.env.POWERBI_CLIENT_SECRET;
const WORKSPACE_ID  = process.env.POWERBI_WORKSPACE_ID;
const REPORT_ID     = process.env.POWERBI_REPORT_ID;

/**
 * @controller getEmbedToken
 * @description
 *   Flujo de 2 pasos:
 *   1. Llama a Azure AD con Client Credentials para obtener un Access Token de Power BI.
 *   2. Usa ese Access Token para llamar a la API REST de Power BI (GenerateToken)
 *      y obtener un Embed Token efímero que el frontend incrusta en el iframe.
 *   El frontend NUNCA ve las credenciales de Azure; solo recibe el token efímero.
 * @route  GET /api/powerbi/embed-token
 * @access Privado — requiere JWT del sistema (middleware authenticateToken)
 */
exports.getEmbedToken = async (req, res) => {
    try {

        // ----------------------------------------------------------------
        // PASO 1 — Obtener Access Token de Azure AD (OAuth2 Client Credentials)
        // ----------------------------------------------------------------
        const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

        const tokenParams = new URLSearchParams({
            grant_type:    'client_credentials',
            client_id:     CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope:         'https://analysis.windows.net/powerbi/api/.default',
        });

        const azureRes = await fetch(tokenUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:    tokenParams.toString(),
        });

        const azureData = await azureRes.json();

        if (!azureRes.ok || !azureData.access_token) {
            console.error('[PowerBI] Azure no devolvió access_token:', azureData);
            return res.status(502).json({
                status:  'error',
                code:    502,
                message: 'No se pudo obtener el Access Token de Azure AD.',
            });
        }

        const accessToken = azureData.access_token;

        // ----------------------------------------------------------------
        // PASO 2 — Obtener Embed Token desde Power BI REST API (GenerateToken)
        // Docs: https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/reports-generate-token-in-group
        // ----------------------------------------------------------------
        const generateTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${WORKSPACE_ID}/reports/${REPORT_ID}/GenerateToken`;

        const embedRes = await fetch(generateTokenUrl, {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({ accessLevel: 'view' }),
        });

        const embedData = await embedRes.json();

        if (!embedRes.ok || !embedData.token) {
            console.error('[PowerBI] Error al generar embed token:', embedData);
            return res.status(502).json({
                status:  'error',
                code:    502,
                message: 'No se pudo generar el Embed Token de Power BI.',
                detail:  embedData,
            });
        }

        // ----------------------------------------------------------------
        // PASO 3 — Devolver todo al frontend
        // La embedUrl NO lleva el token; el SDK de Power BI lo combina por separado.
        // ----------------------------------------------------------------
        const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${REPORT_ID}&groupId=${WORKSPACE_ID}`;

        return res.status(200).json({
            status:     'success',
            embedToken: embedData.token,
            embedUrl:   embedUrl,
            reportId:   REPORT_ID,
        });

    } catch (error) {
        console.error('[PowerBI] Error inesperado:', error.message);
        return res.status(500).json({
            status:  'error',
            code:    500,
            message: 'Error interno al generar el token de incrustación de Power BI.',
        });
    }
};
