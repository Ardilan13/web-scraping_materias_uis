const fs = require('fs');
const path = require('path');

class SubjectMerger {
    constructor() {
        // Configuración de programas con sus IDs y archivos
        this.programs = [
            { name: "INGENIERIA DE SISTEMAS", id: 11, file: "sistemas.json" },//actualizado
            { name: "DISEÑO INDUSTRIAL NUEVO", id: 27, file: "diseño.json" },//actualizado
            { name: "DISEÑO INDUSTRIAL", id: 27, file: "diseño_antiguo.json" },//actualizado
            { name: "INGENIERIA BIOMEDICA", id: 69, file: "biomedica.json" },//actualizado
            { name: "INGENIERIA EN CIENCIA DE DATOS", id: 50, file: "datos.json" },//actualizado
            { name: "INGENIERIA CIVIL", id: 21, file: "civil.json" }, //actualizado
            { name: "INGENIERIA DE PETROLEOS", id: 4, file: "petroleos.json" }, //mismo ID que diseño industrial; 27
            { name: "QUIMICA", id: 14, file: "quimica.json" },
            { name: "MICROBIOLOGIA NUEVO", id: 58, file: "microbiologia_nuevo.json" },
            { name: "MICROBIOLOGIA", id: 58, file: "microbiologia.json" },
            { name: "MECANICA", id: 23, file: "mecanica.json" }
        ];
        
        this.subjectsMap = new Map(); // Map para almacenar materias por SKU
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

    // Procesar una materia y agregarla al mapa
    processSubject(subject, programInfo) {
        const sku = subject.sku;
        
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
            // Nueva materia, crear entrada
            const newSubject = {
                sku: subject.sku,
                name: subject.name,
                credits: subject.credits || 0,
                requirements: subject.requirements || [],
                level: subject.level || 1,
                groups: subject.groups || [],
                program: [programData]
            };
            
            this.subjectsMap.set(sku, newSubject);
        }
    }

    // Procesar todos los archivos
    processAllFiles(horariosPath) {
        console.log('🚀 Iniciando procesamiento de archivos...\n');
        
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

        console.log('\n📊 Resumen del procesamiento:');
        console.log(`   Programas procesados: ${processedPrograms}`);
        console.log(`   Materias totales leídas: ${totalSubjects}`);
        console.log(`   Materias únicas (por SKU): ${this.subjectsMap.size}`);
    }

    // Generar estadísticas
    generateStats() {
        const stats = {
            totalSubjects: this.subjectsMap.size,
            sharedSubjects: 0,
            subjectsByPrograms: {}
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
        });

        return stats;
    }

    // Guardar el resultado
    saveResult(outputPath) {
        try {
            const result = Array.from(this.subjectsMap.values());
            
            // Ordenar por SKU
            result.sort((a, b) => a.sku.localeCompare(b.sku));
            
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
            
            console.log('\n✅ Archivo generado exitosamente:');
            console.log(`   📁 Ruta: ${outputPath}`);
            
            const stats = this.generateStats();
            console.log('\n📈 Estadísticas:');
            console.log(`   Total de materias únicas: ${stats.totalSubjects}`);
            console.log(`   Materias compartidas entre programas: ${stats.sharedSubjects}`);
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
    merge(horariosPath, outputPath) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('         FUSIÓN DE MATERIAS POR PROGRAMAS');
        console.log('═══════════════════════════════════════════════════════\n');
        
        this.processAllFiles(horariosPath);
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
1. Lee todos los archivos JSON de las carreras
2. Identifica materias con el mismo SKU
3. Combina la información asignando los programas correspondientes
4. Genera un archivo unificado con todas las materias

📁 Configuración:
   - Carpeta de entrada: materias/horarios/
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
   - Mecánica
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
    const outputPath = path.join(__dirname, 'materias', 'merged_subjects.json');

    // Verificar que existe la carpeta
    if (!fs.existsSync(horariosPath)) {
        console.error('❌ Error: No se encontró la carpeta de horarios');
        console.log(`   Ruta esperada: ${horariosPath}`);
        console.log('\n💡 Asegúrate de ejecutar el script desde la raíz del proyecto');
        process.exit(1);
    }

    try {
        merger.merge(horariosPath, outputPath);
        merger.showSharedSubjectsExamples(5);
    } catch (error) {
        console.error('\n❌ Error fatal:', error.message);
        process.exit(1);
    }
}

module.exports = SubjectMerger;