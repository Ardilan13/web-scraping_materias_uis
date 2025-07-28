const fs = require('fs');
const path = require('path');


class SharedCoursesAnalyzer {
    constructor(materiasPath = 'json') {
        this.materiasPath = materiasPath;
        this.programsInfo = [
            { name: "INGENIERIA DE SISTEMAS", id: 11, file: "sistemas.json" },
            { name: "DISEÑO INDUSTRIAL NUEVO", id: 27, file: "diseño.json" },
            { name: "DISEÑO INDUSTRIAL", id: 27, file: "diseño_antiguo.json" },
            { name: "INGENIERIA BIOMEDICA", id: 69, file: "biomedica.json" },
            { name: "INGENIERIA EN CIENCIA DE DATOS", id: 50, file: "datos.json" },
            { name: "INGENIERIA CIVIL", id: 21, file: "civil.json" },
            { name: "INGENIERIA DE PETROLEOS", id: 4, file: "petroleos.json" }
        ];
    }

    validateNewPensum(program) {
        return {
            ...program,
            new_pensum: program.name === "DISEÑO INDUSTRIAL NUEVO"
        };
    }

    async loadAllPrograms() {
        const programsData = {};
        
        for (const program of this.programsInfo) {
            const filePath = path.join(this.materiasPath, program.file);
            
            try {
                if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const jsonData = JSON.parse(fileContent);
                    const coursesData = jsonData.materias || jsonData;
                    const programKey = path.basename(program.file, '.json');
                    programsData[programKey] = coursesData;
                }
            } catch (error) {
            }
        }
        
        return programsData;
    }

    findProgramInfo(programKey) {
        return this.programsInfo.find(p => {
            const fileName = path.basename(p.file, '.json');
            return fileName === programKey;
        });
    }

    analyzeSharedCourses(programsData) {
        const coursesMap = new Map();
        let totalCoursesProcessed = 0;
        
        Object.keys(programsData).forEach(programKey => {
            const courses = programsData[programKey];
            const programInfo = this.findProgramInfo(programKey);
            
            if (!programInfo) return;
            
            courses.forEach(course => {
                totalCoursesProcessed++;
                
                const courseKey = `${course.codigo}-${course.nombre.toUpperCase().trim()}`;
                
                if (coursesMap.has(courseKey)) {
                    const existingCourse = coursesMap.get(courseKey);

                    const programExists = existingCourse.programs.some(p => p.Id === programInfo.id);
                    
                    if (!programExists) {
                        const programWithValidation = this.validateNewPensum({
                            name: programInfo.name,
                            Id: programInfo.id
                        });
                        existingCourse.programs.push(programWithValidation);
                    }
                    
                } else {
                    const programWithValidation = this.validateNewPensum({
                        name: programInfo.name,
                        Id: programInfo.id
                    });
                    coursesMap.set(courseKey, {
                        programs: [programWithValidation]
                    });
                }
            });
        });
        
        const allCourses = Array.from(coursesMap.values());
        const sharedCourses = allCourses.filter(course => course.programs.length > 1);
        
        return {
            totalCoursesProcessed,
            uniqueCoursesFound: allCourses.length,
            sharedCoursesCount: sharedCourses.length
        };
    }


    getSharedCoursesData(programsData) {
        const coursesMap = new Map();
        
        Object.keys(programsData).forEach(programKey => {
            const courses = programsData[programKey];
            const programInfo = this.findProgramInfo(programKey);
            
            if (!programInfo) return;
            
            courses.forEach(course => {
                const courseKey = `${course.codigo}-${course.nombre.toUpperCase().trim()}`;
                
                if (coursesMap.has(courseKey)) {
                    const existingCourse = coursesMap.get(courseKey);
                    const programExists = existingCourse.program.some(p => p.Id === programInfo.id);
                    
                    if (!programExists) {
                        const programWithValidation = this.validateNewPensum({
                            name: programInfo.name,
                            Id: programInfo.id
                        });
                        existingCourse.program.push(programWithValidation);
                    }
                    
                } else {
                    const programWithValidation = this.validateNewPensum({
                        name: programInfo.name,
                        Id: programInfo.id
                    });
                    
                    coursesMap.set(courseKey, {
                        codigo: course.codigo,
                        nombre: course.nombre,
                        creditos: course.creditos,
                        requisitos: course.requisitos,
                        nivel: course.nivel,
                        grupos: [],
                        program: [programWithValidation]
                    });
                }
            });
        });
        
        return Array.from(coursesMap.values()).filter(course => course.program.length > 1);
    }

    saveSharedCourses(sharedCourses, outputPath = 'output') {
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(outputPath, 'cursos_compartidos.json'),
            JSON.stringify(sharedCourses, null, 2),
            'utf8'
        );
    }

    async run() {
        try {
            const programsData = await this.loadAllPrograms();
            
            if (Object.keys(programsData).length === 0) {
                console.log('❌ No se pudieron cargar archivos de materias');
                return;
            }
            
            const stats = this.analyzeSharedCourses(programsData);

            const sharedCourses = this.getSharedCoursesData(programsData);
            
            console.log('📊 Análisis completado:');
            console.log(`   • Total de cursos procesados: ${stats.totalCoursesProcessed}`);
            console.log(`   • Materias únicas encontradas: ${stats.uniqueCoursesFound}`);
            console.log(`   • ✨ MATERIAS COMPARTIDAS: ${stats.sharedCoursesCount}`);
            
            this.saveSharedCourses(sharedCourses);
            console.log(`💾 Archivo guardado: output/cursos_compartidos.json (${sharedCourses.length} materias)`);
            
            return { stats, sharedCourses };
            
        } catch (error) {
            console.error('❌ Error durante la ejecución:', error.message);
            throw error;
        }
    }
}

async function analyzeSharedCourses(materiasPath = 'json') {
    const analyzer = new SharedCoursesAnalyzer(materiasPath);
    return await analyzer.run();
}

module.exports = {
    SharedCoursesAnalyzer,
    analyzeSharedCourses
}

if (require.main === module) {
    analyzeSharedCourses().catch(console.error);
}