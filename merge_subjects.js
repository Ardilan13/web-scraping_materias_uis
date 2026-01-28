const fs = require('fs');
const path = require('path');

class SubjectMerger {
    constructor() {
        // Configuración de programas con sus IDs y archivos
        this.programs = [
            { name: "INGENIERIA DE SISTEMAS", id: 11, file: "sistemas.json", pensumFile: "sistemas.json" },
            { name: "DISEÑO INDUSTRIAL NUEVO", id: 27, file: "diseño.json", pensumFile: "diseño_industrial.json" },
            { name: "DISEÑO INDUSTRIAL", id: 27, file: "diseño_antiguo.json", pensumFile: "diseño_industrial.json" },
            { name: "INGENIERIA BIOMEDICA", id: 69, file: "biomedica.json", pensumFile: "biomedica.json" },
            { name: "INGENIERIA EN CIENCIA DE DATOS", id: 50, file: "datos.json", pensumFile: "datos.json" },
            { name: "INGENIERIA CIVIL", id: 21, file: "civil.json", pensumFile: "civil.json" },
            { name: "INGENIERIA DE PETROLEOS", id: 32, file: "petroleos.json", pensumFile: "petroleos.json" },
            { name: "QUIMICA", id: 14, file: "quimica.json", pensumFile: "quimica.json" },
            { name: "MICROBIOLOGIA NUEVO", id: 58, file: "microbiologia_nuevo.json", pensumFile: "microbiologia.json" },
            { name: "MICROBIOLOGIA", id: 58, file: "microbiologia.json", pensumFile: "microbiologia.json" },
            { name: "INGENIERIA MECANICA", id: 24, file: "mecanica.json", pensumFile: "mecanica.json" },
            { name: "INGENIERIA INDUSTRIAL", id: 23, file: "industrial.json", pensumFile: "industrial.json" },
            { name: "INGENIERIA QUIMICA", id: 33, file: "ing_quimica.json", pensumFile: "ing_quimica.json" },
            { name: "NUTRICION", id: 57, file: "nutricion.json", pensumFile: "nutricion.json" },
            { name: "INTELIGENCIA ARTIFICIAL", id: 47, file: "inteligencia_artificial.json", pensumFile: "inteligencia_artificial.json" },
            { name: "BIOLOGIA", id: 10, file: "biologia.json", pensumFile: "biologia.json" },
            { name: "LICENCIATURA EN MATEMATICAS", id: 16, file: "lic_matematicas.json", pensumFile: "lic_matematicas.json" },
            { name: "MATEMATICAS", id: 39, file: "matematicas.json", pensumFile: "matematicas.json" },
            { name: "MUSICA", id: 30, file: "musica.json", pensumFile: "musica.json" },
            { name: "FISICA", id: 40, file: "fisica.json", pensumFile: "fisica.json" },
            { name: "FISIOTERAPIA", id: 56, file: "fisioterapia.json", pensumFile: "fisioterapia.json" }
        ];

        this.subjectsMap = new Map(); // Map para almacenar materias por SKU
        this.pensumData = new Map(); // Map para almacenar datos de pensum por SKU
    }

    // Leer un archivo JSON
    readJSONFile(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`❌ Error leyendo archivo ${filePath}:`, error.message);
            return null;
        }
    }

    // Cargar datos de pensum
    loadPensumData(pensumPath) {
        console.log('📚 Cargando datos de pensum...\n');
        
        let loadedPensums = 0;
        let totalSubjects = 0;

        this.programs.forEach(program => {
            const filePath = path.join(pensumPath, program.pensumFile);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Pensum no encontrado: ${program.pensumFile}`);
                return;
            }

            console.log(`📖 Cargando pensum: ${program.name} (${program.pensumFile})`);
            
            const pensumData = this.readJSONFile(filePath);
            
            if (!pensumData || !pensumData.materias || !Array.isArray(pensumData.materias)) {
                console.log(`   ❌ Formato inválido en ${program.pensumFile}`);
                return;
            }

            // Almacenar información de cada materia del pensum
            pensumData.materias.forEach(materia => {
                const sku = String(materia.codigo);
                
                // Si ya existe data para este SKU, verificar si hay diferencias
                if (this.pensumData.has(sku)) {
                    const existing = this.pensumData.get(sku);
                    // Mantener la información más completa
                    if (!existing.creditos && materia.creditos) {
                        existing.creditos = materia.creditos;
                    }
                    if ((!existing.requisitos || existing.requisitos.length === 0) && materia.requisitos && materia.requisitos.length > 0) {
                        existing.requisitos = materia.requisitos;
                    }
                    if (!existing.nivel && materia.nivel) {
                        existing.nivel = materia.nivel;
                    }
                } else {
                    this.pensumData.set(sku, {
                        codigo: materia.codigo,
                        nombre: materia.nombre,
                        creditos: materia.creditos || 0,
                        requisitos: materia.requisitos || [],
                        nivel: materia.nivel || 1
                    });
                }
            });

            console.log(`   ✅ ${pensumData.materias.length} materias cargadas del pensum`);
            loadedPensums++;
            totalSubjects += pensumData.materias.length;
        });

        console.log('\n📊 Resumen de carga de pensum:');
        console.log(`   Pensums procesados: ${loadedPensums}`);
        console.log(`   Materias totales en pensums: ${totalSubjects}`);
        console.log(`   Materias únicas en pensum: ${this.pensumData.size}\n`);
    }

    // Procesar una materia y agregarla al mapa
    processSubject(subject, programInfo) {
        const sku = String(subject.sku);
        
        // Crear información del programa
        const programData = {
            name: programInfo.name,
            id: programInfo.id,
            new_pensum: programInfo.name.includes("NUEVO")
        };

        if (this.subjectsMap.has(sku)) {
            // La materia ya existe, agregar el programa
            const existingSubject = this.subjectsMap.get(sku);
            
            // Verificar si el programa ya está agregado
            const programExists = existingSubject.program.some(
                p => p.name === programData.name && p.id === programData.id
            );
            
            if (!programExists) {
                existingSubject.program.push(programData);
            }
            
            // Combinar grupos si hay nuevos
            if (subject.groups) {
                const existingGroupSkus = new Set(existingSubject.groups.map(g => g.sku));
                subject.groups.forEach(group => {
                    if (!existingGroupSkus.has(group.sku)) {
                        existingSubject.groups.push(group);
                    }
                });
            }
        } else {
            // Nueva materia, crear entrada con datos de pensum si existen
            const pensumInfo = this.pensumData.get(sku);
            
            const newSubject = {
                sku: subject.sku,
                name: subject.name,
                credits: pensumInfo?.creditos || subject.credits || 0,
                requirements: pensumInfo?.requisitos || subject.requirements || [],
                level: pensumInfo?.nivel || subject.level || 1,
                groups: subject.groups || [],
                program: [programData]
            };
            
            this.subjectsMap.set(sku, newSubject);
        }
    }

    // Procesar todos los archivos
    processAllFiles(horariosPath) {
        console.log('🚀 Iniciando procesamiento de archivos de horarios...\n');
        
        let processedPrograms = 0;
        let totalSubjects = 0;

        this.programs.forEach(program => {
            const filePath = path.join(horariosPath, program.file);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Archivo no encontrado: ${program.file}`);
                return;
            }

            console.log(`📖 Procesando: ${program.name} (${program.file})`);
            
            const subjects = this.readJSONFile(filePath);
            
            if (!subjects || !Array.isArray(subjects)) {
                console.log(`   ❌ Formato inválido en ${program.file}`);
                return;
            }

            subjects.forEach(subject => {
                this.processSubject(subject, program);
            });

            console.log(`   ✅ ${subjects.length} materias procesadas`);
            processedPrograms++;
            totalSubjects += subjects.length;
        });

        console.log('\n📊 Resumen del procesamiento de horarios:');
        console.log(`   Programas procesados: ${processedPrograms}`);
        console.log(`   Materias totales leídas: ${totalSubjects}`);
        console.log(`   Materias únicas (por SKU): ${this.subjectsMap.size}`);
    }

    // Actualizar materias con datos de pensum faltantes
    updateWithPensumData() {
        console.log('\n🔄 Actualizando materias con datos de pensum...\n');
        
        let updated = 0;
        let creditsUpdated = 0;
        let requirementsUpdated = 0;
        let levelUpdated = 0;

        this.subjectsMap.forEach((subject, sku) => {
            const pensumInfo = this.pensumData.get(String(sku));
            
            if (pensumInfo) {
                let wasUpdated = false;

                // Actualizar créditos si no existen o son 0
                if ((!subject.credits || subject.credits === 0) && pensumInfo.creditos) {
                    subject.credits = pensumInfo.creditos;
                    creditsUpdated++;
                    wasUpdated = true;
                }

                // Actualizar requisitos si no existen o están vacíos
                if ((!subject.requirements || subject.requirements.length === 0) && 
                    pensumInfo.requisitos && pensumInfo.requisitos.length > 0) {
                    subject.requirements = pensumInfo.requisitos;
                    requirementsUpdated++;
                    wasUpdated = true;
                }

                // Actualizar nivel si no existe o es 1 por defecto
                if ((!subject.level || subject.level === 1) && pensumInfo.nivel && pensumInfo.nivel !== 1) {
                    subject.level = pensumInfo.nivel;
                    levelUpdated++;
                    wasUpdated = true;
                }

                if (wasUpdated) {
                    updated++;
                }
            }
        });

        console.log(`   ✅ Materias actualizadas: ${updated}`);
        console.log(`   📝 Créditos actualizados: ${creditsUpdated}`);
        console.log(`   🔗 Requisitos actualizados: ${requirementsUpdated}`);
        console.log(`   📊 Niveles actualizados: ${levelUpdated}`);
    }

    // Generar estadísticas
    generateStats() {
        const stats = {
            totalSubjects: this.subjectsMap.size,
            sharedSubjects: 0,
            subjectsByPrograms: {},
            subjectsWithCredits: 0,
            subjectsWithRequirements: 0
        };

        this.subjectsMap.forEach(subject => {
            const programCount = subject.program.length;
            
            if (programCount > 1) {
                stats.sharedSubjects++;
            }

            if (!stats.subjectsByPrograms[programCount]) {
                stats.subjectsByPrograms[programCount] = 0;
            }
            stats.subjectsByPrograms[programCount]++;

            if (subject.credits > 0) {
                stats.subjectsWithCredits++;
            }

            if (subject.requirements && subject.requirements.length > 0) {
                stats.subjectsWithRequirements++;
            }
        });

        return stats;
    }

    // Guardar el resultado
    saveResult(outputPath) {
        try {
            const result = Array.from(this.subjectsMap.values());
            
            // Ordenar por SKU
            result.sort((a, b) => {
                const skuA = String(a.sku);
                const skuB = String(b.sku);
                if (skuA < skuB) return -1;
                if (skuA > skuB) return 1;
                return 0;
            });
            
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
            
            console.log('\n✅ Archivo generado exitosamente:');
            console.log(`   📁 Ruta: ${outputPath}`);
            
            const stats = this.generateStats();
            console.log('\n📈 Estadísticas:');
            console.log(`   Total de materias únicas: ${stats.totalSubjects}`);
            console.log(`   Materias compartidas entre programas: ${stats.sharedSubjects}`);
            console.log(`   Materias con créditos: ${stats.subjectsWithCredits}`);
            console.log(`   Materias con requisitos: ${stats.subjectsWithRequirements}`);
            console.log('\n   Distribución por programas:');
            Object.keys(stats.subjectsByPrograms).sort().forEach(count => {
                console.log(`   ${count} programa(s): ${stats.subjectsByPrograms[count]} materias`);
            });
            
            return result;
        } catch (error) {
            console.error('❌ Error guardando archivo:', error.message);
            throw error;
        }
    }

    // Método principal
    merge(horariosPath, pensumPath, outputPath) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('         FUSIÓN DE MATERIAS POR PROGRAMAS');
        console.log('═══════════════════════════════════════════════════════\n');
        
        // Primero cargar los datos de pensum
        this.loadPensumData(pensumPath);
        
        // Luego procesar los archivos de horarios
        this.processAllFiles(horariosPath);
        
        // Actualizar con datos de pensum faltantes
        this.updateWithPensumData();
        
        // Guardar resultado
        const result = this.saveResult(outputPath);
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('              PROCESO COMPLETADO ✅');
        console.log('═══════════════════════════════════════════════════════\n');
        
        return result;
    }

    // Método para mostrar ejemplos de materias compartidas
    showSharedSubjectsExamples(limit = 5) {
        console.log('\n🔍 Ejemplos de materias compartidas:\n');
        
        let count = 0;
        for (const [sku, subject] of this.subjectsMap) {
            if (subject.program.length > 1 && count < limit) {
                console.log(`📚 ${subject.name} (SKU: ${sku})`);
                console.log(`   Créditos: ${subject.credits}`);
                console.log(`   Nivel: ${subject.level}`);
                console.log(`   Requisitos: ${subject.requirements.length > 0 ? subject.requirements.join(', ') : 'Ninguno'}`);
                console.log(`   Compartida por ${subject.program.length} programas:`);
                subject.program.forEach(prog => {
                    console.log(`   - ${prog.name} (ID: ${prog.id})`);
                });
                console.log(`   Grupos: ${subject.groups.length}`);
                console.log('');
                count++;
            }
        }
    }
}

// Función de ayuda
function showHelp() {
    console.log(`
📖 USO DEL SCRIPT:

node merge_subjects.js

Este script:
1. Lee todos los archivos JSON de pensum para obtener créditos y requisitos
2. Lee todos los archivos JSON de horarios de las carreras
3. Identifica materias con el mismo SKU
4. Combina la información asignando los programas correspondientes
5. Genera un archivo unificado con todas las materias

📁 Configuración:
   - Carpeta de pensum: materias/pensum-json/
   - Carpeta de horarios: materias/horarios/
   - Archivo de salida: materias/merged_subjects.json

💡 El script procesará automáticamente estos programas:
   - Ingeniería de Sistemas
   - Diseño Industrial (nuevo y antiguo)
   - Ingeniería Biomédica
   - Ingeniería en Ciencia de Datos
   - Ingeniería Civil
   - Ingeniería de Petróleos
   - Química
   - Microbiología (nuevo y antiguo)
   - Y más...
`);
}

// Ejecución principal
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    const merger = new SubjectMerger();
    
    // Rutas por defecto
    const horariosPath = path.join(__dirname, 'materias', 'horarios');
    const pensumPath = path.join(__dirname, 'materias', 'pensum-json');
    const outputPath = path.join(__dirname, 'materias', 'merged_subjects.json');

    // Verificar que existen las carpetas
    if (!fs.existsSync(horariosPath)) {
        console.error('❌ Error: No se encontró la carpeta de horarios');
        console.log(`   Ruta esperada: ${horariosPath}`);
        console.log('\n💡 Asegúrate de ejecutar el script desde la raíz del proyecto');
        process.exit(1);
    }

    if (!fs.existsSync(pensumPath)) {
        console.error('❌ Error: No se encontró la carpeta de pensum');
        console.log(`   Ruta esperada: ${pensumPath}`);
        console.log('\n💡 Asegúrate de ejecutar el script desde la raíz del proyecto');
        process.exit(1);
    }

    try {
        merger.merge(horariosPath, pensumPath, outputPath);
        merger.showSharedSubjectsExamples(5);
    } catch (error) {
        console.error('\n❌ Error fatal:', error.message);
        process.exit(1);
    }
}

module.exports = SubjectMerger;