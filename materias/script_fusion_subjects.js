const fs = require('fs');
const path = require('path');

/**
 * Fusiona los archivos que se encuentran en la ruta materias\output\cursos_compartidos.json con el archivo materias\horarios\sistemas.json
 * esto genera sobre escribe en el archivo cursos_compartidos.json que contiene la información de las materias para ser exportadas
 * directamente a MongoDB.
 */

// cambiar el archivo horariosPath de acuerdo a la carrera que se desea incluir los grupos
const horariosPath = 'C:\\Users\\Juanr\\Documents\\GitHub\\web-scraping_materias_uis\\materias\\horarios\\datos_transformed.json';
const contextosPath = 'C:\\Users\\Juanr\\Documents\\GitHub\\web-scraping_materias_uis\\materias\\horarios\\contextos_transformed.json';
const cursosCompartidosPath = 'C:\\Users\\Juanr\\Documents\\GitHub\\web-scraping_materias_uis\\materias\\output\\cursos_compartidos.json';

async function fusionarGruposHorarios() {
    try {
        console.log('Leyendo archivo de horarios...');
        const horariosData = JSON.parse(fs.readFileSync(horariosPath, 'utf8'));

        console.log('Leyendo archivo de contextos...');
        const contextosData = JSON.parse(fs.readFileSync(contextosPath, 'utf8'));

        console.log('Leyendo archivo de cursos compartidos...');
        const cursosCompartidosData = JSON.parse(fs.readFileSync(cursosCompartidosPath, 'utf8'));

        const todasLasCarreras = new Set();
        cursosCompartidosData.forEach(curso => {
            if (curso.program && Array.isArray(curso.program)) {
                curso.program.forEach(programa => {
                    todasLasCarreras.add(JSON.stringify(programa));
                });
            }
        });

        const carrerasArray = Array.from(todasLasCarreras).map(carrera => JSON.parse(carrera));
        console.log(`Se encontraron ${carrerasArray.length} carreras diferentes para asignar a materias de contexto.`);

        const horariosMap = new Map();
        horariosData.forEach(materia => {
            horariosMap.set(materia.sku, materia.groups);
        });

        const contextosMap = new Map();
        contextosData.forEach(materia => {
            contextosMap.set(materia.sku, materia.groups);
        });

        console.log('Fusionando grupos de horarios...');
        let cursosActualizados = 0;
        let cursosContextoAgregados = 0;
        
        cursosCompartidosData.forEach(curso => {
            if (horariosMap.has(curso.sku)) {
                const grupos = horariosMap.get(curso.sku);
                
                if (grupos && grupos.length > 0) {
                    curso.groups = grupos;
                    cursosActualizados++;
                    console.log(`✓ Grupos fusionados para: ${curso.name} (SKU: ${curso.sku}) - ${grupos.length} grupos`);
                } else {
                    console.log(`⚠ SKU encontrado pero sin grupos: ${curso.name} (SKU: ${curso.sku}) - manteniendo información original`);
                }
            }
            
            else if (contextosMap.has(curso.sku)) {
                const grupos = contextosMap.get(curso.sku);
                
                if (grupos && grupos.length > 0) {
                    curso.groups = grupos;
                    curso.program = [...carrerasArray];
                    cursosContextoAgregados++;
                    console.log(`🌐 Materia de contexto fusionada: ${curso.name} (SKU: ${curso.sku}) - ${grupos.length} grupos - Asignada a ${carrerasArray.length} carreras`);
                } else {
                    console.log(`⚠ Materia de contexto encontrada pero sin grupos: ${curso.name} (SKU: ${curso.sku}) - manteniendo información original`);
                }
            } else {
                // SKU no existe en ningún archivo de horarios - no se modifica
                console.log(`ℹ No se encontraron horarios para: ${curso.name} (SKU: ${curso.sku}) - manteniendo información original`);
            }
        });

        // Agregar materias de contexto que no están en cursos_compartidos
        contextosData.forEach(materiaContexto => {
            const yaExiste = cursosCompartidosData.some(curso => curso.sku === materiaContexto.sku);
            
            if (!yaExiste && materiaContexto.groups && materiaContexto.groups.length > 0) {
                const nuevaMateria = {
                    sku: materiaContexto.sku,
                    name: materiaContexto.name,
                    credits: materiaContexto.credits || 0,
                    groups: materiaContexto.groups,
                    program: [...carrerasArray], // Asignar a todas las carreras
                };
                
                cursosCompartidosData.push(nuevaMateria);
                cursosContextoAgregados++;
                console.log(`➕ Nueva materia de contexto agregada: ${nuevaMateria.name} (SKU: ${nuevaMateria.sku}) - ${nuevaMateria.groups.length} grupos - Asignada a ${carrerasArray.length} carreras`);
            }
        });
        
        const outputDir = path.dirname(cursosCompartidosPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(cursosCompartidosPath, JSON.stringify(cursosCompartidosData, null, 2), 'utf8');
        
        console.log('\n=== RESUMEN ===');
        console.log(`Total de cursos en el archivo: ${cursosCompartidosData.length}`);
        console.log(`Cursos regulares con grupos actualizados: ${cursosActualizados}`);
        console.log(`Materias de contexto procesadas/agregadas: ${cursosContextoAgregados}`);
        console.log(`Cursos mantenidos sin cambios: ${cursosCompartidosData.length - cursosActualizados - cursosContextoAgregados}`);

        let cursosConGruposActualizados = 0;
        let cursosConGruposOriginales = 0;
        let cursosSinGrupos = 0;
        let totalGruposActualizados = 0;
        let totalGruposOriginales = 0;
        let cursosNoEncontrados = [];
        let materiasContextoProcesadas = 0;
        
        cursosCompartidosData.forEach(curso => {
            if (horariosMap.has(curso.sku)) {
                if (curso.groups && curso.groups.length > 0) {
                    cursosConGruposActualizados++;
                    totalGruposActualizados += curso.groups.length;
                }
            } else if (contextosMap.has(curso.sku)) {
                if (curso.groups && curso.groups.length > 0) {
                    materiasContextoProcesadas++;
                    totalGruposActualizados += curso.groups.length;
                }
            } else {
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
        console.log(`Cursos regulares con grupos actualizados: ${cursosConGruposActualizados}`);
        console.log(`Materias de contexto procesadas: ${materiasContextoProcesadas}`);
        console.log(`Cursos con grupos originales mantenidos: ${cursosConGruposOriginales}`);
        console.log(`Cursos sin grupos (originalmente): ${cursosSinGrupos}`);
        console.log(`Total de grupos nuevos fusionados: ${totalGruposActualizados}`);
        console.log(`Total de grupos originales mantenidos: ${totalGruposOriginales}`);
        console.log(`Carreras disponibles para materias de contexto: ${carrerasArray.length}`);
        
        if (cursosNoEncontrados.length > 0) {
            console.log(`\n=== CURSOS NO ENCONTRADOS EN HORARIOS (INFORMACIÓN ORIGINAL MANTENIDA) ===`);
            cursosNoEncontrados.forEach(curso => {
                const gruposInfo = curso.groups && curso.groups.length > 0 
                    ? `${curso.groups.length} grupos originales` 
                    : 'sin grupos originalmente';
                console.log(`- ${curso.name} (SKU: ${curso.sku}) - ${gruposInfo}`);
            });
        }

        // Mostrar las carreras que se asignaron a las materias de contexto
        console.log(`\n=== CARRERAS ASIGNADAS A MATERIAS DE CONTEXTO ===`);
        carrerasArray.forEach((carrera, index) => {
            console.log(`${index + 1}. ${carrera.name} (${carrera.code || 'Sin código'})`);
        });
        
        console.log(`\nArchivo actualizado guardado en: ${cursosCompartidosPath}`);
        
        
        generarReporteCompleto(cursosCompartidosData, horariosMap, contextosMap, carrerasArray, cursosCompartidosPath);
        
    } catch (error) {
        console.error('Error durante la fusión:', error.message);
        
        if (error.code === 'ENOENT') {
            console.error('\nVerifica que los archivos existan en las rutas especificadas:');
            console.error(`- ${horariosPath}`);
            console.error(`- ${contextosPath}`);
            console.error(`- ${cursosCompartidosPath}`);
        } else if (error instanceof SyntaxError) {
            console.error('\nError de sintaxis JSON. Verifica que los archivos tengan formato JSON válido.');
        }
        
        process.exit(1);
    }
}

function generarReporteCompleto(cursosData, horariosMap, contextosMap, carrerasArray, outputPath) {
    const cursosRegularesActualizados = [];
    const materiasContextoProcesadas = [];
    const cursosMantenidos = [];
    
    cursosData.forEach(curso => {
        if (horariosMap.has(curso.sku)) {
        
            const grupos = horariosMap.get(curso.sku);
            if (grupos && grupos.length > 0) {
                cursosRegularesActualizados.push({
                    sku: curso.sku,
                    name: curso.name,
                    grupos_agregados: grupos.length,
                    programas: curso.program.map(p => p.name),
                    tipo: 'regular'
                });
            }
        } else if (contextosMap.has(curso.sku)) {
            const grupos = contextosMap.get(curso.sku);
            if (grupos && grupos.length > 0) {
                materiasContextoProcesadas.push({
                    sku: curso.sku,
                    name: curso.name,
                    grupos_agregados: grupos.length,
                    programas_asignados: curso.program.length,
                    tipo: 'contexto',
                    todas_las_carreras: true
                });
            }
        } else {
            cursosMantenidos.push({
                sku: curso.sku,
                name: curso.name,
                grupos_originales: curso.groups ? curso.groups.length : 0,
                programas: curso.program.map(p => p.name),
                razon: 'SKU no encontrado en archivos de horarios',
                tipo: 'sin_cambios'
            });
        }
    });
    
    if (cursosRegularesActualizados.length > 0 || materiasContextoProcesadas.length > 0 || cursosMantenidos.length > 0) {
        const reportePath = path.join(path.dirname(outputPath), 'reporte_fusion_horarios_completo.json');
        
        const reporte = {
            fecha_generacion: new Date().toISOString(),
            resumen: {
                total_cursos: cursosData.length,
                cursos_regulares_actualizados: cursosRegularesActualizados.length,
                materias_contexto_procesadas: materiasContextoProcesadas.length,
                cursos_mantenidos_sin_cambios: cursosMantenidos.length,
                total_carreras_disponibles: carrerasArray.length
            },
            carreras_disponibles: carrerasArray,
            cursos_regulares_actualizados: cursosRegularesActualizados,
            materias_contexto_procesadas: materiasContextoProcesadas,
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
        const contextosData = JSON.parse(fs.readFileSync(contextosPath, 'utf8'));
        const cursosCompartidosData = JSON.parse(fs.readFileSync(cursosCompartidosPath, 'utf8'));
        
        console.log('\n=== PREVIEW DE CAMBIOS ===');
        
        const todasLasCarreras = new Set();
        cursosCompartidosData.forEach(curso => {
            if (curso.program && Array.isArray(curso.program)) {
                curso.program.forEach(programa => {
                    todasLasCarreras.add(JSON.stringify(programa));
                });
            }
        });
        
        console.log(`Carreras disponibles para materias de contexto: ${todasLasCarreras.size}`);
        
        const horariosMap = new Map();
        horariosData.forEach(materia => {
            horariosMap.set(materia.sku, materia.groups);
        });
        
        const contextosMap = new Map();
        contextosData.forEach(materia => {
            contextosMap.set(materia.sku, materia.groups);
        });
        
        console.log('\n--- MATERIAS REGULARES ---');
        cursosCompartidosData.forEach(curso => {
            if (horariosMap.has(curso.sku)) {
                const gruposCount = horariosMap.get(curso.sku).length;
                console.log(`${curso.name} (${curso.sku}): se agregarán ${gruposCount} grupos`);
            }
        });
        
        console.log('\n--- MATERIAS DE CONTEXTO ---');
        cursosCompartidosData.forEach(curso => {
            if (contextosMap.has(curso.sku)) {
                const gruposCount = contextosMap.get(curso.sku).length;
                console.log(`${curso.name} (${curso.sku}): se agregarán ${gruposCount} grupos + TODAS las carreras`);
            }
        });
        console.log('\n--- NUEVAS MATERIAS DE CONTEXTO A AGREGAR ---');
        contextosData.forEach(materiaContexto => {
            const yaExiste = cursosCompartidosData.some(curso => curso.sku === materiaContexto.sku);
            if (!yaExiste && materiaContexto.groups && materiaContexto.groups.length > 0) {
                console.log(`+ ${materiaContexto.name} (${materiaContexto.sku}): ${materiaContexto.groups.length} grupos + TODAS las carreras`);
            }
        });
        
    } catch (error) {
        console.error('Error al mostrar preview:', error.message);
    }
}

console.log('=== INICIANDO FUSIÓN DE GRUPOS DE HORARIOS CON MATERIAS DE CONTEXTO ===\n');

mostrarPreview();

fusionarGruposHorarios();