const fs = require('fs');
const path = require('path');

/**
 * Fusiona los archivos que se encuentran en la ruta materias\output\cursos_compartidos.json con el archivo materias\horarios\*_transformed.json
 * esto genera un archivo materias_fusionadas.json que contiene la información de las materias para ser exportadas
 * directamente a MongoDB.
 */

// cambiar el archivo horariosPath de acuerdo a la carrera que se desea incluir los grupos
const horariosPath = 'C:\\Users\\Juanr\\Documents\\GitHub\\web-scraping_materias_uis\\materias\\horarios\\sistemas_transformed.json';
const cursosCompartidosPath = 'C:\\Users\\Juanr\\Documents\\GitHub\\web-scraping_materias_uis\\materias\\output\\cursos_compartidos.json';

async function fusionarGruposHorarios() {
    try {
        console.log('Leyendo archivo de horarios...');
        const horariosData = JSON.parse(fs.readFileSync(horariosPath, 'utf8'));

        console.log('Leyendo archivo de cursos compartidos...');
        const cursosCompartidosData = JSON.parse(fs.readFileSync(cursosCompartidosPath, 'utf8'));

        const horariosMap = new Map();
        horariosData.forEach(materia => {
            horariosMap.set(materia.sku, materia.groups);
        });

        console.log('Fusionando grupos de horarios...');
        let cursosActualizados = 0;
        
        cursosCompartidosData.forEach(curso => {
            if (horariosMap.has(curso.sku)) {
                const grupos = horariosMap.get(curso.sku);
                
                
                if (grupos && grupos.length > 0) {
                    curso.groups = grupos;
                    cursosActualizados++;
                    console.log(`✓ Grupos fusionados para: ${curso.name} (SKU: ${curso.sku}) - ${grupos.length} grupos`);
                } else {
                    // SKU existe pero sin grupos - no se modifica
                    console.log(`⚠ SKU encontrado pero sin grupos: ${curso.name} (SKU: ${curso.sku}) - manteniendo información original`);
                }
            } else {
                // SKU no existe en el archivo de horarios - no se modifica
                console.log(`ℹ No se encontraron horarios para: ${curso.name} (SKU: ${curso.sku}) - manteniendo información original`);
            }
        });
        
        const outputDir = path.dirname(cursosCompartidosPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(cursosCompartidosPath, JSON.stringify(cursosCompartidosData, null, 2), 'utf8');
        
        console.log('\n=== RESUMEN ===');
        console.log(`Total de cursos en el archivo: ${cursosCompartidosData.length}`);
        console.log(`Cursos con grupos actualizados: ${cursosActualizados}`);
        console.log(`Cursos mantenidos sin cambios: ${cursosCompartidosData.length - cursosActualizados}`);

        let cursosConGruposActualizados = 0;
        let cursosConGruposOriginales = 0;
        let cursosSinGrupos = 0;
        let totalGruposActualizados = 0;
        let totalGruposOriginales = 0;
        let cursosNoEncontrados = [];
        
        cursosCompartidosData.forEach(curso => {
            if (horariosMap.has(curso.sku)) {
                
                if (curso.groups && curso.groups.length > 0) {
                    cursosConGruposActualizados++;
                    totalGruposActualizados += curso.groups.length;
                }
            } else {
                // SKU NO encontrado en horarios
                cursosNoEncontrados.push(curso);
                if (curso.groups && curso.groups.length > 0) {
                    cursosConGruposOriginales++;
                    totalGruposOriginales += curso.groups.length;
                } else {
                    cursosSinGrupos++;
                }
            }
        });
        
        console.log(`\n=== ESTADÍSTICAS DETALLADAS ===`);
        console.log(`Cursos con grupos actualizados desde horarios: ${cursosConGruposActualizados}`);
        console.log(`Cursos con grupos originales mantenidos: ${cursosConGruposOriginales}`);
        console.log(`Cursos sin grupos (originalmente): ${cursosSinGrupos}`);
        console.log(`Total de grupos nuevos fusionados: ${totalGruposActualizados}`);
        console.log(`Total de grupos originales mantenidos: ${totalGruposOriginales}`);
        
        if (cursosNoEncontrados.length > 0) {
            console.log(`\n=== CURSOS NO ENCONTRADOS EN HORARIOS (INFORMACIÓN ORIGINAL MANTENIDA) ===`);
            cursosNoEncontrados.forEach(curso => {
                const gruposInfo = curso.groups && curso.groups.length > 0 
                    ? `${curso.groups.length} grupos originales` 
                    : 'sin grupos originalmente';
                console.log(`- ${curso.name} (SKU: ${curso.sku}) - ${gruposInfo}`);
            });
        }
        
        console.log(`\nArchivo actualizado guardado en: ${cursosCompartidosPath}`);
        
        // Generar reporte completo de la fusión
        generarReporteCompleto(cursosCompartidosData, horariosMap, cursosCompartidosPath);
        
    } catch (error) {
        console.error('Error durante la fusión:', error.message);
        
        if (error.code === 'ENOENT') {
            console.error('\nVerifica que los archivos existan en las rutas especificadas:');
            console.error(`- ${horariosPath}`);
            console.error(`- ${cursosCompartidosPath}`);
        } else if (error instanceof SyntaxError) {
            console.error('\nError de sintaxis JSON. Verifica que los archivos tengan formato JSON válido.');
        }
        
        process.exit(1);
    }
}

function generarReporteCompleto(cursosData, horariosMap, outputPath) {
    const cursosActualizados = [];
    const cursosMantenidos = [];
    
    cursosData.forEach(curso => {
        if (horariosMap.has(curso.sku)) {
            const grupos = horariosMap.get(curso.sku);
            if (grupos && grupos.length > 0) {
                cursosActualizados.push({
                    sku: curso.sku,
                    name: curso.name,
                    grupos_agregados: grupos.length,
                    programas: curso.program.map(p => p.name)
                });
            }
        } else {
            cursosMantenidos.push({
                sku: curso.sku,
                name: curso.name,
                grupos_originales: curso.groups ? curso.groups.length : 0,
                programas: curso.program.map(p => p.name),
                razon: 'SKU no encontrado en archivo de horarios'
            });
        }
    });
    
    if (cursosActualizados.length > 0 || cursosMantenidos.length > 0) {
        const reportePath = path.join(path.dirname(outputPath), 'reporte_fusion_horarios.json');
        
        const reporte = {
            fecha_generacion: new Date().toISOString(),
            resumen: {
                total_cursos: cursosData.length,
                cursos_actualizados: cursosActualizados.length,
                cursos_mantenidos_sin_cambios: cursosMantenidos.length
            },
            cursos_actualizados: cursosActualizados,
            cursos_mantenidos_sin_cambios: cursosMantenidos
        };
        
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2), 'utf8');
        console.log(`\n📄 Reporte completo de fusión guardado en: ${reportePath}`);
        
        return reportePath;
    }
    
    return null;
}



function mostrarPreview() {
    try {
        const horariosData = JSON.parse(fs.readFileSync(horariosPath, 'utf8'));
        const cursosCompartidosData = JSON.parse(fs.readFileSync(cursosCompartidosPath, 'utf8'));
        
        console.log('\n=== PREVIEW DE CAMBIOS ===');
        
        const horariosMap = new Map();
        horariosData.forEach(materia => {
            horariosMap.set(materia.sku, materia.groups);
        });
        
        cursosCompartidosData.forEach(curso => {
            if (horariosMap.has(curso.sku)) {
                const gruposCount = horariosMap.get(curso.sku).length;
                console.log(`${curso.name} (${curso.sku}): se agregarán ${gruposCount} grupos`);
            }
        });
        
    } catch (error) {
        console.error('Error al mostrar preview:', error.message);
    }
}

console.log('=== INICIANDO FUSIÓN DE GRUPOS DE HORARIOS ===\n');

mostrarPreview();

fusionarGruposHorarios();