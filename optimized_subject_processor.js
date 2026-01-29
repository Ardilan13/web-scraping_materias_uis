const fs = require("fs");
const path = require("path");

/**
 * OPTIMIZACIONES PRINCIPALES:
 * 1. Pre-carga de pensum para validar SKUs antes del scraping
 * 2. Caché inteligente para evitar consultas duplicadas
 * 3. Merge incremental durante el scraping
 * 4. Detección de materias compartidas en tiempo real
 * 5. Recuperación automática de errores
 */

class OptimizedSubjectProcessor {
  constructor() {
    this.programs = [
      {
        name: "INGENIERIA DE SISTEMAS",
        id: 11,
        file: "general.json",
        pensumFile: "sistemas.json",
      },
      {
        name: "DISEÑO INDUSTRIAL NUEVO",
        id: 27,
        file: "general.json",
        pensumFile: "diseño.json",
      },
      {
        name: "DISEÑO INDUSTRIAL",
        id: 27,
        file: "general.json",
        pensumFile: "diseño_antiguo.json",
      },
      {
        name: "INGENIERIA BIOMEDICA",
        id: 69,
        file: "general.json",
        pensumFile: "biomedica.json",
      },
      {
        name: "INGENIERIA EN CIENCIA DE DATOS",
        id: 50,
        file: "general.json",
        pensumFile: "datos.json",
      },
      {
        name: "INGENIERIA CIVIL",
        id: 21,
        file: "general.json",
        pensumFile: "civil.json",
      },
      {
        name: "INGENIERIA DE PETROLEOS",
        id: 32,
        file: "general.json",
        pensumFile: "petroleos.json",
      },
      {
        name: "QUIMICA",
        id: 14,
        file: "general.json",
        pensumFile: "quimica.json",
      },
      {
        name: "MICROBIOLOGIA NUEVO",
        id: 58,
        file: "general.json",
        pensumFile: "microbiologia.json",
      },
      {
        name: "MICROBIOLOGIA",
        id: 58,
        file: "general.json",
        pensumFile: "microbiologia.json",
      },
      {
        name: "INGENIERIA MECANICA",
        id: 24,
        file: "general.json",
        pensumFile: "mecanica.json",
      },
      {
        name: "INGENIERIA INDUSTRIAL",
        id: 23,
        file: "general.json",
        pensumFile: "industrial.json",
      },
      {
        name: "INGENIERIA QUIMICA",
        id: 33,
        file: "general.json",
        pensumFile: "ing_quimica.json",
      },
      {
        name: "NUTRICION",
        id: 57,
        file: "general.json",
        pensumFile: "nutricion.json",
      },
      {
        name: "INTELIGENCIA ARTIFICIAL",
        id: 47,
        file: "general.json",
        pensumFile: "inteligencia_artificial.json",
      },
      {
        name: "BIOLOGIA",
        id: 10,
        file: "general.json",
        pensumFile: "biologia.json",
      },
      {
        name: "LICENCIATURA EN MATEMATICAS",
        id: 16,
        file: "general.json",
        pensumFile: "lic_matematicas.json",
      },
      {
        name: "MATEMATICAS",
        id: 39,
        file: "general.json",
        pensumFile: "matematicas.json",
      },
      {
        name: "MUSICA",
        id: 30,
        file: "general.json",
        pensumFile: "musica.json",
      },
      {
        name: "FISICA",
        id: 40,
        file: "general.json",
        pensumFile: "fisica.json",
      },
      {
        name: "FISIOTERAPIA",
        id: 56,
        file: "general.json",
        pensumFile: "fisioterapia.json",
      },
    ];

    this.pensumMap = new Map(); // Datos completos del pensum por SKU
    this.subjectsMap = new Map(); // Materias fusionadas
    this.skusByProgram = new Map(); // SKUs organizados por programa
    this.sharedSkus = new Set(); // SKUs compartidos entre programas
  }

  // ========== OPTIMIZACIÓN 1: Pre-carga inteligente de pensum ==========
  loadAllPensums(pensumPath) {
    console.log("🚀 FASE 1: Carga optimizada de pensum");
    console.log("═══════════════════════════════════════\n");

    let totalLoaded = 0;
    const skuFrequency = new Map(); // Contador de frecuencia por SKU

    this.programs.forEach((program) => {
      const filePath = path.join(pensumPath, program.pensumFile);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${program.name}: pensum no encontrado`);
        return;
      }

      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

        if (!data.materias || !Array.isArray(data.materias)) {
          console.log(`⚠️  ${program.name}: formato inválido`);
          return;
        }

        const skus = [];

        data.materias.forEach((materia) => {
          const sku = String(materia.codigo);
          skus.push(sku);

          // Actualizar frecuencia
          skuFrequency.set(sku, (skuFrequency.get(sku) || 0) + 1);

          // Almacenar datos de pensum (solo si es nuevo o más completo)
          if (!this.pensumMap.has(sku)) {
            this.pensumMap.set(sku, {
              sku: materia.codigo,
              nombre: materia.nombre,
              creditos: materia.creditos || 0,
              requisitos: materia.requisitos || [],
              nivel: materia.nivel || 1,
              programs: [
                { name: program.name, id: program.id, new_pensum: program.name.includes("NUEVO") },
              ],
            });
          } else {
            // Agregar programa a lista
            const existing = this.pensumMap.get(sku);
            existing.programs.push({
              name: program.name,
              id: program.id,
              new_pensum: program.name.includes("NUEVO"),
            });

            // Actualizar datos si son más completos
            if (!existing.creditos && materia.creditos) {
              existing.creditos = materia.creditos;
            }
            if (
              (!existing.requisitos || existing.requisitos.length === 0) &&
              materia.requisitos?.length > 0
            ) {
              existing.requisitos = materia.requisitos;
            }
          }
        });

        this.skusByProgram.set(program.name, skus);
        totalLoaded += data.materias.length;

        console.log(`✅ ${program.name}: ${data.materias.length} materias`);
      } catch (error) {
        console.error(`❌ ${program.name}: error - ${error.message}`);
      }
    });

    // Identificar SKUs compartidos
    skuFrequency.forEach((count, sku) => {
      if (count > 1) {
        this.sharedSkus.add(sku);
      }
    });

    console.log(`\n📊 Resumen:`);
    console.log(`   • Materias totales: ${totalLoaded}`);
    console.log(`   • Materias únicas: ${this.pensumMap.size}`);
    console.log(`   • Materias compartidas: ${this.sharedSkus.size}`);
    console.log(`   • Programas procesados: ${this.skusByProgram.size}\n`);
  }

  // ========== OPTIMIZACIÓN 2: Generación de lista optimizada para scraping ==========
  generateScrapingList() {
    console.log("🎯 FASE 2: Generación de lista de scraping");
    console.log("═══════════════════════════════════════\n");

    // Priorizar materias compartidas (más eficiente)
    const priorityList = [];
    const regularList = [];

    this.pensumMap.forEach((data, sku) => {
      const item = {
        sku: sku,
        nombre: data.nombre,
        programs: data.programs.length,
        isShared: this.sharedSkus.has(sku),
      };

      if (item.isShared) {
        priorityList.push(item);
      } else {
        regularList.push(item);
      }
    });

    // Ordenar por número de programas (más compartidas primero)
    priorityList.sort((a, b) => b.programs - a.programs);

    const fullList = [...priorityList, ...regularList];

    console.log(`📋 Lista de scraping generada:`);
    console.log(`   • Materias prioritarias (compartidas): ${priorityList.length}`);
    console.log(`   • Materias regulares: ${regularList.length}`);
    console.log(`   • Total a consultar: ${fullList.length}\n`);

    return fullList;
  }

  // ========== OPTIMIZACIÓN 3: Generación de código JavaScript para scraping ==========
  generateScrapingScript(scrapingList, outputPath) {
    const skuArray = scrapingList.map((item) => item.sku);

    const scriptContent = `// ============================================
// SCRIPT DE SCRAPING OPTIMIZADO
// Generado automáticamente
// Total de materias: ${skuArray.length}
// Materias compartidas: ${Array.from(this.sharedSkus).length}
// 
// RESULTADO: general.json (un solo archivo con todo)
// ============================================

async function waitForElementNotBusy(selector) {
  return new Promise((resolve) => {
    const checkState = () => {
      const element = document.querySelector(selector);
      if (element && element.getAttribute("aria-busy") === "false") {
        resolve();
        return;
      }
      requestAnimationFrame(checkState);
    };
    checkState();
  });
}

async function procesarMateria(skuMateria) {
  const inputCodigo = document.querySelector("#form\\\\:txtCodigoAsignatura");
  const btnConsulta = document.querySelector("#form\\\\:btnConsultaAsignatura");

  if (!inputCodigo || !btnConsulta) {
    console.error("No se encontraron los elementos de consulta");
    return null;
  }

  inputCodigo.value = skuMateria;
  btnConsulta.click();

  await waitForElementNotBusy("#form");

  const tableDiv = document.querySelector("#form\\\\:dtlListadoProgramadas");
  if (!tableDiv) {
    console.error(\`No se encontró información para el código \${skuMateria}\`);
    return null;
  }

  const rows = tableDiv.querySelectorAll("tbody tr");
  const materiaInfo = {
    sku: skuMateria,
    name: "",
    groups: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const columns = row.querySelectorAll("td div");

    if (i === 0) {
      materiaInfo.name = columns[1]?.textContent.trim();
    }

    const grupoInfo = {
      groups: columns[2]?.textContent.trim(), // Nombre del grupo (ej: "B1", "D1")
      capacity: parseInt(columns[3]?.textContent.trim(), 10),
      enrolled: parseInt(columns[4]?.textContent.trim(), 10),
      schedule: [],
    };

    const button = row.querySelector(
      \`#form\\\\:dtlListadoProgramadas\\\\\${i}\\\\:btnIrVer\`
    );

    if (button) {
      button.click();
      
      // Esperar a que el formulario esté listo
      await waitForElementNotBusy("#form");
      
      // Esperar un poco más para que el modal se abra completamente
      await new Promise(resolve => setTimeout(resolve, 300));

      const modalTable = document.querySelector(
        "#formHorario\\\\:dtlListadoParciales_data"
      );

      if (modalTable) {
        const modalRows = modalTable.querySelectorAll("tr");
        modalRows.forEach((modalRow) => {
          const modalColumns = modalRow.querySelectorAll("td div");
          
          // Solo agregar si hay datos
          const day = modalColumns[0]?.textContent.trim();
          const time = modalColumns[1]?.textContent.trim();
          
          if (day || time) {
            grupoInfo.schedule.push({
              day: day || "",
              time: time || "",
              building: modalColumns[2]?.textContent.trim() || "",
              room: modalColumns[3]?.textContent.trim() || "",
              professor: modalColumns[4]?.textContent.trim() || "",
            });
          }
        });
      } else {
        console.warn(\`  ⚠️  Modal no encontrado para grupo \${grupoInfo.sku}\`);
      }

      const closeButton = document.querySelector(".ui-dialog-titlebar-close");
      if (closeButton) {
        closeButton.click();
        await waitForElementNotBusy("#form");
        // Pequeña pausa después de cerrar el modal
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    materiaInfo.groups.push(grupoInfo);
  }

  return materiaInfo;
}

async function procesarListaCodigos(listaCodigos) {
  const resultado = [];
  const AUTOSAVE_INTERVAL = 10; // Guardar cada 10 materias
  
  for (let i = 0; i < listaCodigos.length; i++) {
    const sku = listaCodigos[i];
    console.log(\`[\${i + 1}/\${listaCodigos.length}] Procesando: \${sku}\`);
    
    try {
      const materiaInfo = await procesarMateria(sku);
      if (materiaInfo) {
        resultado.push(materiaInfo);
        console.log(\`✅ Completado: \${sku} - \${materiaInfo.groups.length} grupos\`);
      }
      
      // Auto-guardado incremental
      if ((i + 1) % AUTOSAVE_INTERVAL === 0) {
        localStorage.setItem("scrapingProgress", JSON.stringify({
          completed: i + 1,
          total: listaCodigos.length,
          data: resultado,
          timestamp: new Date().toISOString()
        }));
        console.log(\`💾 Progreso guardado: \${i + 1}/\${listaCodigos.length}\`);
      }
    } catch (error) {
      console.error(\`❌ Error en \${sku}:\`, error);
      // Continuar con la siguiente materia
    }
  }

  return resultado;
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================
(async function () {
  // Lista de SKUs optimizada (compartidas primero)
  const listaCodigos = ${JSON.stringify(skuArray, null, 2)};

  console.log("🚀 Iniciando scraping optimizado");
  console.log(\`📊 Total de materias: \${listaCodigos.length}\`);
  console.log(\`⚡ Materias compartidas procesadas primero\`);
  console.log("📁 Guardar resultado como: general.json");
  console.log("=" .repeat(50));

  try {
    const resultado = await procesarListaCodigos(listaCodigos);
    
    // Guardar resultado final
    localStorage.setItem("scrapingComplete", JSON.stringify(resultado));
    console.log("=" .repeat(50));
    console.log("✅ SCRAPING COMPLETADO");
    console.log(\`📊 Materias procesadas: \${resultado.length}\`);
    console.log("💾 Datos guardados en localStorage");
    console.log("");
    console.log("📝 INSTRUCCIONES:");
    console.log("   1. Copia el JSON que aparece abajo");
    console.log("   2. Guárdalo como: materias/horarios/general.json");
    console.log("   3. Ejecuta: node optimized_subject_processor.js");
    console.log("=" .repeat(50));
    
    // Mostrar resultado para copiar
    console.log(JSON.stringify(resultado, null, 2));
    
  } catch (error) {
    console.error("❌ Error fatal:", error);
    
    // Recuperar progreso parcial
    const progress = localStorage.getItem("scrapingProgress");
    if (progress) {
      const saved = JSON.parse(progress);
      console.log(\`⚠️  Progreso recuperado: \${saved.completed}/\${saved.total} materias\`);
      console.log("Datos parciales:", saved.data);
    }
  }
})();
`;

    fs.writeFileSync(outputPath, scriptContent, "utf8");
    console.log(`✅ Script de scraping generado:`);
    console.log(`   📁 ${outputPath}`);
    console.log(`   📝 Resultado: guardar como general.json\n`);
  }

  // ========== OPTIMIZACIÓN 4: Merge con datos de scraping ==========
  mergeScrapingData(horariosPath) {
    console.log("🔄 FASE 3: Fusión con datos de scraping");
    console.log("═══════════════════════════════════════\n");

    const generalFilePath = path.join(horariosPath, "general.json");

    // Verificar si existe el archivo general.json
    if (!fs.existsSync(generalFilePath)) {
      console.log(`⚠️  Archivo general.json no encontrado en ${horariosPath}`);
      console.log(`   Ejecuta el scraping primero y guarda el resultado como general.json\n`);
      return;
    }

    try {
      console.log(`📖 Procesando: general.json`);
      const subjects = JSON.parse(fs.readFileSync(generalFilePath, "utf8"));

      if (!Array.isArray(subjects) || subjects.length === 0) {
        console.log(`⚠️  Archivo general.json vacío o formato inválido\n`);
        return;
      }

      let processed = 0;
      let withGroups = 0;
      let skipped = 0;

      subjects.forEach((subject) => {
        const sku = String(subject.sku);
        processed++;

        // Verificar que la materia tenga grupos
        if (!subject.groups || subject.groups.length === 0) {
          skipped++;
          return; // Saltar materias sin grupos
        }

        // Normalizar grupos: cambiar "groups" a "sku" si existe
        const normalizedGroups = subject.groups.map(group => ({
          sku: group.sku || group.groups || group.group, // Soportar todos los formatos
          capacity: group.capacity,
          enrolled: group.enrolled,
          schedule: group.schedule || []
        }));

        // Obtener datos del pensum si existen
        const pensumData = this.pensumMap.get(sku);


        if (!this.subjectsMap.has(sku)) {
          // Nueva materia - usar TODOS los programas del pensum si existen
          this.subjectsMap.set(sku, {
            sku: subject.sku,
            name: subject.name || pensumData?.nombre || "Sin nombre",
            credits: pensumData?.creditos || subject.credits || 0,
            requirements: pensumData?.requisitos || subject.requirements || [],
            level: pensumData?.nivel || subject.level || 1,
            groups: normalizedGroups,
            // IMPORTANTE: Usar todos los programas del pensum si existen, sino array vacío
            program: pensumData?.programs || [],
          });
          withGroups++;
        } else {
          // Materia existente - solo agregar grupos nuevos (no debería pasar)
          const existing = this.subjectsMap.get(sku);
          if (normalizedGroups.length > 0) {
            const existingSkus = new Set(
              existing.groups.map((g) => g.sku)
            );
            normalizedGroups.forEach((group) => {
              if (!existingSkus.has(group.sku)) {
                existing.groups.push(group);
              }
            });
          }
        }
      });

      console.log(`   ✅ Procesadas: ${processed} materias`);
      console.log(`   ✅ Con grupos: ${withGroups} materias`);
      console.log(`   ⚠️  Sin grupos (omitidas): ${skipped} materias`);

      console.log(`\n📊 Resumen de fusión:`);
      console.log(`   • Total de materias con grupos: ${this.subjectsMap.size}\n`);
    } catch (error) {
      console.error(`❌ Error procesando general.json: ${error.message}`);
      console.error(`   Stack: ${error.stack}\n`);
    }
  }

  // ========== NUEVA: Agregar todas las materias del pensum al resultado final ==========
  addAllPensumSubjects() {
    console.log("📚 FASE 3.5: Agregando materias de pensum sin horarios");
    console.log("═══════════════════════════════════════\n");

    let added = 0;

    this.pensumMap.forEach((pensumData, sku) => {
      // Si la materia no está en subjectsMap, agregarla
      if (!this.subjectsMap.has(sku)) {
        this.subjectsMap.set(sku, {
          sku: pensumData.sku,
          name: pensumData.nombre,
          credits: pensumData.creditos,
          requirements: pensumData.requisitos,
          level: pensumData.nivel,
          groups: [], // Sin grupos porque no hay datos de horarios
          program: [...pensumData.programs],
        });
        added++;
      }
    });

    console.log(`📊 Materias agregadas desde pensum: ${added}`);
    console.log(`   • Total de materias ahora: ${this.subjectsMap.size}\n`);
  }

  // ========== Guardar resultado final ==========
  saveResults(outputPath) {
    console.log("💾 FASE 4: Guardando resultados");
    console.log("═══════════════════════════════════════\n");

    const result = Array.from(this.subjectsMap.values());

    // Ordenar por SKU
    result.sort((a, b) => {
      const skuA = String(a.sku);
      const skuB = String(b.sku);
      return skuA.localeCompare(skuB);
    });

    // Agregar metadata
    const output = {
      metadata: {
        generated: new Date().toISOString(),
        totalSubjects: result.length,
        sharedSubjects: Array.from(this.sharedSkus).length,
        programs: this.programs.length,
        note: "Solo incluye materias con grupos/horarios disponibles",
      },
      subjects: result,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

    console.log(`✅ Archivo guardado: ${outputPath}`);
    console.log(`   • Total de materias con grupos: ${result.length}`);
    console.log(`   • Materias compartidas: ${this.sharedSkus.size}`);

    // Estadísticas adicionales
    const withGroups = result.filter((s) => s.groups && s.groups.length > 0).length;
    const withRequirements = result.filter((s) => s.requirements && s.requirements.length > 0).length;
    const totalGroups = result.reduce((sum, s) => sum + (s.groups?.length || 0), 0);

    console.log(`   • Total de grupos disponibles: ${totalGroups}`);
    console.log(`   • Materias con requisitos: ${withRequirements}`);
    console.log(`   • Materias con al menos 1 grupo: ${withGroups}\n`);

    console.log(`💡 Nota: Solo se incluyen materias que tienen grupos disponibles`);
    console.log(`   en los archivos de horarios. Materias sin grupos no aparecen.\n`);
  }

  // ========== OPTIMIZACIÓN 5: Análisis de materias compartidas ==========
  analyzeSharedSubjects() {
    console.log("📈 ANÁLISIS DE MATERIAS COMPARTIDAS");
    console.log("═══════════════════════════════════════\n");

    const distribution = new Map();

    this.subjectsMap.forEach((subject) => {
      const count = subject.program.length;
      distribution.set(count, (distribution.get(count) || 0) + 1);
    });

    console.log("Distribución por número de programas:");
    Array.from(distribution.keys())
      .sort((a, b) => b - a)
      .forEach((count) => {
        console.log(`   ${count} programas: ${distribution.get(count)} materias`);
      });

    // Top 10 materias más compartidas
    console.log("\n🏆 Top 10 materias más compartidas:\n");

    const sorted = Array.from(this.subjectsMap.values())
      .filter((s) => s.program.length > 1)
      .sort((a, b) => b.program.length - a.program.length)
      .slice(0, 10);

    sorted.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name} (${subject.sku})`);
      console.log(`   • Programas: ${subject.program.length}`);
      console.log(`   • Créditos: ${subject.credits}`);
      console.log(`   • Grupos: ${subject.groups.length}\n`);
    });
  }

  // ========== Método principal optimizado ==========
  process(pensumPath, horariosPath, outputDir) {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║   PROCESADOR OPTIMIZADO DE MATERIAS UIS           ║");
    console.log("╚════════════════════════════════════════════════════╝");
    console.log("\n");

    const startTime = Date.now();

    // Fase 1: Cargar todos los pensum
    this.loadAllPensums(pensumPath);
    this.mergeScrapingData(horariosPath);

    // Fase 2: Generar lista optimizada de scraping
    const scrapingList = this.generateScrapingList();

    // Generar script de scraping
    const scrapingScriptPath = path.join(outputDir, "scraping_script.js");
    this.generateScrapingScript(scrapingList, scrapingScriptPath);

    // Fase 3: Merge con datos existentes de horarios
    if (fs.existsSync(horariosPath)) {
      this.mergeScrapingData(horariosPath);
    } else {
      console.log("⚠️  No se encontró la carpeta de horarios");
      console.log("   Solo se incluirán materias cuando tengan datos de horarios\n");
    }

    // NO agregar materias sin grupos - solo queremos las que tienen horarios

    // Fase 4: Guardar resultados
    const outputPath = path.join(outputDir, "merged_subjects_optimized.json");
    this.saveResults(outputPath);

    // Fase 5: Análisis
    this.analyzeSharedSubjects();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n");
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║   PROCESO COMPLETADO ✅                            ║");
    console.log(`║   Tiempo total: ${elapsed}s`.padEnd(53) + "║");
    console.log("╚════════════════════════════════════════════════════╝");
    console.log("\n");

    return {
      scrapingScript: scrapingScriptPath,
      output: outputPath,
      stats: {
        totalSubjects: this.subjectsMap.size,
        sharedSubjects: this.sharedSkus.size,
        timeSeconds: elapsed,
      },
    };
  }
}

// ========== Ejecución ==========
if (require.main === module) {
  const processor = new OptimizedSubjectProcessor();

  const pensumPath = path.join(__dirname, "materias", "pensum-json");
  const horariosPath = path.join(__dirname, "materias", "horarios");
  const outputDir = path.join(__dirname, "materias");

  // Validar directorios
  if (!fs.existsSync(pensumPath)) {
    console.error(`❌ No se encontró: ${pensumPath}`);
    process.exit(1);
  }

  try {
    const result = processor.process(pensumPath, horariosPath, outputDir);
    console.log("\n📦 Archivos generados:");
    console.log(`   • Script de scraping: ${result.scrapingScript}`);
    console.log(`   • Datos fusionados: ${result.output}\n`);
  } catch (error) {
    console.error("\n❌ Error fatal:", error.message);
    process.exit(1);
  }
}

module.exports = OptimizedSubjectProcessor;