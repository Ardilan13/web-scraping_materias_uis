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

    async transformFile(inputPath) {
        try {
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

            // Sobrescribir el archivo original
            fs.writeFileSync(inputPath, JSON.stringify(transformedData, null, 2), 'utf8');

            console.log(`✅ Transformación completada:`);
            console.log(`   📁 Archivo transformado: ${inputPath}`);
            
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

function transformMaterias(materias) {
    const transformer = new GroupsTransformer();
    return transformer.transformMaterias(materias);
}

function transformGroups(grupos) {
    const transformer = new GroupsTransformer();
    return transformer.transformGroups(grupos);
}

function transformFromJSON(jsonString) {
    const transformer = new GroupsTransformer();
    const data = JSON.parse(jsonString);
    
    if (Array.isArray(data)) {
        
        if (data.length > 0 && data[0].codigo && data[0].nombre) {
            return transformer.transformMaterias(data);
        } else {
            return transformer.transformGroups(data);
        }
    } else {
        return transformer.transformObject(data);
    }
}

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

module.exports = {
    GroupsTransformer,
    transformGroups,
    transformMaterias,
    transformFromJSON
};

if (require.main === module) {
    const filename = process.argv[2];
    
    if (!filename) {
        console.log('❌ Error: Debes especificar el nombre del archivo');
        console.log('📝 Uso: node script.js <nombre_del_archivo>');
        console.log('📝 Ejemplo: node script.js datos.json');
        process.exit(1);
    }

    console.log(`🚀 Ejecutando transformación del archivo ${filename}...\n`);

    const transformer = new GroupsTransformer();
    const inputPath = path.join(__dirname, 'horarios', filename);

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: El archivo ${inputPath} no existe`);
        process.exit(1);
    }

    transformer.transformFile(inputPath);
}