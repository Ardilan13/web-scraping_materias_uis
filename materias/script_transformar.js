const fs = require('fs');
const path = require('path');

class GroupsTransformer {
    constructor() {
        this.keyMappings = {
            // Mapeos de nivel superior
            'grupos': 'groups',
            
            // Mapeos de grupo
            'grupo': 'sku',
            'capacidad': 'capacity', 
            'matriculados': 'enrolled',
            'horario': 'schedule',
            
            // Mapeos de horario
            'dia': 'day',
            'hora': 'time',
            'edificio': 'building',
            'aula': 'room',
            'profesor': 'professor'
        };
    }

    /**
     * Transforma un objeto grupo individual
     */
    transformGroup(grupo) {
        const transformedGroup = {
            sku: grupo.grupo,
            capacity: grupo.capacidad,
            enrolled: grupo.matriculados,
            schedule: []
        };

        // Transformar horarios
        if (grupo.horario && Array.isArray(grupo.horario)) {
            transformedGroup.schedule = grupo.horario.map(horario => ({
                day: horario.dia,
                time: horario.hora,
                building: horario.edificio || "",
                room: horario.aula || "",
                professor: horario.profesor
            }));
        }

        return transformedGroup;
    }

    /**
     * Transforma un array de grupos
     */
    transformGroups(grupos) {
        if (!Array.isArray(grupos)) {
            throw new Error('El parámetro debe ser un array de grupos');
        }

        return grupos.map(grupo => this.transformGroup(grupo));
    }

    /**
     * Transforma una materia individual (objeto con código, nombre y grupos)
     */
    transformMateria(materia) {
        const transformed = {
            codigo: materia.codigo,
            nombre: materia.nombre
        };

        // Transformar grupos si existen
        if (materia.grupos && Array.isArray(materia.grupos)) {
            transformed.groups = this.transformGroups(materia.grupos);
        }

        return transformed;
    }

    /**
     * Transforma un array de materias
     */
    transformMaterias(materias) {
        if (!Array.isArray(materias)) {
            throw new Error('El parámetro debe ser un array de materias');
        }

        return materias.map(materia => this.transformMateria(materia));
    }

    /**
     * Transforma un objeto completo que contenga grupos
     */
    transformObject(obj) {
        const transformed = { ...obj };

        // Si el objeto tiene la propiedad 'grupos', transformarla a 'groups'
        if (obj.grupos) {
            transformed.groups = this.transformGroups(obj.grupos);
            delete transformed.grupos;
        }

        return transformed;
    }

    /**
     * Transforma un archivo JSON completo
     */
    async transformFile(inputPath, outputPath) {
        try {
            // Leer archivo
            const fileContent = fs.readFileSync(inputPath, 'utf8');
            const jsonData = JSON.parse(fileContent);

            let transformedData;

            // Determinar el tipo de estructura
            if (Array.isArray(jsonData)) {
                // Verificar si es array de materias (tienen código y nombre)
                if (jsonData.length > 0 && jsonData[0].codigo && jsonData[0].nombre) {
                    transformedData = this.transformMaterias(jsonData);
                } else {
                    // Es un array de grupos directamente
                    transformedData = this.transformGroups(jsonData);
                }
            } else if (jsonData.grupos) {
                // Es un objeto que contiene grupos
                transformedData = this.transformObject(jsonData);
            } else {
                throw new Error('Estructura JSON no reconocida. Debe contener materias con grupos o grupos directamente.');
            }

            // Crear directorio de salida si no existe
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Escribir archivo transformado
            fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2), 'utf8');

            console.log(`✅ Transformación completada:`);
            console.log(`   📁 Archivo original: ${inputPath}`);
            console.log(`   📁 Archivo transformado: ${outputPath}`);
            
            // Mostrar estadísticas
            if (Array.isArray(transformedData)) {
                console.log(`   📊 Materias procesadas: ${transformedData.length}`);
                const totalGroups = transformedData.reduce((total, materia) => 
                    total + (materia.groups ? materia.groups.length : 0), 0
                );
                console.log(`   👥 Total de grupos: ${totalGroups}`);
            }
            
            return transformedData;

        } catch (error) {
            console.error(`❌ Error transformando archivo:`, error.message);
            throw error;
        }
    }

    /**
     * Transforma múltiples archivos JSON
     */
    async transformMultipleFiles(inputDir, outputDir, filePattern = '*.json') {
        try {
            const files = fs.readdirSync(inputDir).filter(file => 
                file.endsWith('.json') && fs.statSync(path.join(inputDir, file)).isFile()
            );

            if (files.length === 0) {
                console.log('❌ No se encontraron archivos JSON en el directorio');
                return;
            }

            const results = [];

            for (const file of files) {
                const inputPath = path.join(inputDir, file);
                const outputPath = path.join(outputDir, file);
                
                try {
                    const result = await this.transformFile(inputPath, outputPath);
                    results.push({ file, success: true, result });
                    console.log(`✅ ${file} transformado exitosamente`);
                } catch (error) {
                    results.push({ file, success: false, error: error.message });
                    console.error(`❌ Error transformando ${file}:`, error.message);
                }
            }

            console.log(`\n📊 Resumen de transformación:`);
            console.log(`   • Archivos procesados: ${results.length}`);
            console.log(`   • Exitosos: ${results.filter(r => r.success).length}`);
            console.log(`   • Con errores: ${results.filter(r => !r.success).length}`);

            return results;

        } catch (error) {
            console.error(`❌ Error procesando directorio:`, error.message);
            throw error;
        }
    }
}

// Función utilitaria para transformar materias
function transformMaterias(materias) {
    const transformer = new GroupsTransformer();
    return transformer.transformMaterias(materias);
}

// Función utilitaria para transformar solo grupos
function transformGroups(grupos) {
    const transformer = new GroupsTransformer();
    return transformer.transformGroups(grupos);
}

// Función para transformar desde string JSON
function transformFromJSON(jsonString) {
    const transformer = new GroupsTransformer();
    const data = JSON.parse(jsonString);
    
    if (Array.isArray(data)) {
        // Verificar si es array de materias
        if (data.length > 0 && data[0].codigo && data[0].nombre) {
            return transformer.transformMaterias(data);
        } else {
            return transformer.transformGroups(data);
        }
    } else {
        return transformer.transformObject(data);
    }
}

// Ejemplo de uso
function example() {
    const originalData = [
        {
            "codigo": "20252",
            "nombre": "CALCULO I",
            "grupos": [
                {
                    "grupo": "A1",
                    "capacidad": 27,
                    "matriculados": 27,
                    "horario": [
                        {
                            "dia": "MARTES",
                            "hora": "6:00 - 8:00",
                            "edificio": "",
                            "aula": "",
                            "profesor": "ALVARO JAVIER RIAÑO BLANCO"
                        },
                        {
                            "dia": "JUEVES",
                            "hora": "6:00 - 8:00",
                            "edificio": "",
                            "aula": "",
                            "profesor": "ALVARO JAVIER RIAÑO BLANCO"
                        }
                    ]
                }
            ]
        }
    ];

    const transformer = new GroupsTransformer();
    const transformed = transformer.transformMaterias(originalData);
    
    console.log('📋 Datos originales:');
    console.log(JSON.stringify(originalData, null, 2));
    console.log('\n🔄 Datos transformados:');
    console.log(JSON.stringify(transformed, null, 2));
    
    return transformed;
}

// Exportar para uso como módulo
module.exports = {
    GroupsTransformer,
    transformGroups,
    transformMaterias,
    transformFromJSON
};

// Ejecutar ejemplo si se ejecuta directamente
if (require.main === module) {
    console.log('🚀 Ejecutando ejemplo de transformación...\n');
    example();
    
    // Ejemplo específico para transformar el archivo sistemas.json
    console.log('\n📁 Para transformar tu archivo sistemas.json, ejecuta:');
    console.log('const transformer = new GroupsTransformer();');
    console.log('transformer.transformFile("materias/horarios/sistemas.json", "materias/horarios/sistemas_transformed.json");');
    
    if (require.main === module) {
    console.log('🚀 Ejecutando transformación del archivo sistemas.json...\n');

    const transformer = new GroupsTransformer();

    const inputPath = path.join(__dirname, 'horarios', 'sistemas.json');
    const outputPath = path.join(__dirname, 'horarios', 'sistemas_transformed.json');

    transformer.transformFile(inputPath, outputPath);
}

}