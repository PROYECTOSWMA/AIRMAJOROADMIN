// En un nuevo archivo, por ejemplo: src/utils/formatters.js

const formatoSiagie = (nota) => {
    if (nota === null || nota === undefined || nota === '') return '-'; // Devolvemos un guion para celdas vacías
    const num = Number(nota);
    if (isNaN(num)) return nota; // Si no es un número, lo devolvemos tal cual

    let letra = 'C'; // 0-10
    if (num >= 18) letra = 'AD';      // 18-20
    else if (num >= 14.5) letra = 'A';  // 15-17 (redondeando)
    else if (num >= 10.5) letra = 'B';  // 11-14 (redondeando)
    return `${Math.round(num)} / ${letra}`; // Devolvemos la nota redondeada y la letra
};


exports.transformarBoletaAFormatoSiagie = (boletaData) => {
    // Esta función recibe la data de la boleta y la modifica directamente (por referencia)
    if (!boletaData || !boletaData.boletas) return boletaData;

    boletaData.boletas.forEach(boleta => {
        if (boleta.cursos) {
            boleta.cursos.forEach(curso => {
                // Función interna para no repetir la lógica de formateo
                const aplicarFormato = (obj) => {
                    if (obj.promedio_final !== undefined) obj.promedio_final = formatoSiagie(obj.promedio_final);
                    if (obj.notas_boleta && typeof obj.notas_boleta === 'object') {
                        Object.keys(obj.notas_boleta).forEach(k => obj.notas_boleta[k] = formatoSiagie(obj.notas_boleta[k]));
                    }
                    if (obj.promedios_periodo && typeof obj.promedios_periodo === 'object') {
                        Object.keys(obj.promedios_periodo).forEach(k => obj.promedios_periodo[k] = formatoSiagie(obj.promedios_periodo[k]));
                    }
                };

                aplicarFormato(curso); // Formatear curso principal
                if (curso.subareas) {
                    curso.subareas.forEach(sub => aplicarFormato(sub)); // Formatear subáreas
                }
            });
        }
    });
    return boletaData;
};