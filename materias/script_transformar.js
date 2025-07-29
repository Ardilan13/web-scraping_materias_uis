const fs = require('fs');
const path = require('path');

class GroupsTransformer {
    constructor() {
        this.keyMappings = {
        
            'grupos': 'groups',
            
            // Mapeos de grupo
            'grupo': 'sku',
            'capacidad': 'capacity', 
            'matriculados': 'enrolled',
            'horario': 'schedule',
            
            'dia': 'day',
            'hora': 'time',
            'edificio': 'building',
            'aula': 'room',
            'profesor': 'professor'
        };
    }

    transformGroup(grupo) {
        const transformedGroup = {
            sku: grupo.grupo,
            capacity: grupo.capacidad,
            enrolled: grupo.matriculados,
            schedule: []
        };

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

    transformMateria(materia) {
        const transformed = {
            sku: materia.codigo,
            name: materia.nombre
        };

        if (materia.grupos && Array.isArray(materia.grupos)) {
            transformed.groups = this.transformGroups(materia.grupos);
        }

        return transformed;
    }

    transformMaterias(materias) {
        if (!Array.isArray(materias)) {
            throw new Error('El parámetro debe ser un array de materias');
        }

        return materias.map(materia => this.transformMateria(materia));
    }

    transformObject(obj) {
        const transformed = { ...obj };

        if (obj.grupos) {
            transformed.groups = this.transformGroups(obj.grupos);
            delete transformed.grupos;
        }

        return transformed;
    }

    async transformFile(inputPath, outputPath) {
        try {
            // Leer archivo
            const fileContent = fs.readFileSync(inputPath, 'utf8');
            const jsonData = JSON.parse(fileContent);

            let transformedData;

            if (Array.isArray(jsonData)) {
                if (jsonData.length > 0 && jsonData[0].codigo && jsonData[0].nombre) {
                    transformedData = this.transformMaterias(jsonData);
                } else {
                    transformedData = this.transformGroups(jsonData);
                }
            } else if (jsonData.grupos) {
                transformedData = this.transformObject(jsonData);
            } else {
                throw new Error('Estructura JSON no reconocida. Debe contener materias con grupos o grupos directamente.');
            }

            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }


            fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2), 'utf8');

            console.log(`✅ Transformación completada:`);
            console.log(`   📁 Archivo original: ${inputPath}`);
            console.log(`   📁 Archivo transformado: ${outputPath}`);
            
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

    const inputPath = path.join(__dirname, 'horarios', 'biomedica.json');
    const outputPath = path.join(__dirname, 'horarios', 'biomedica_transformed.json');

    transformer.transformFile(inputPath, outputPath);
}

}