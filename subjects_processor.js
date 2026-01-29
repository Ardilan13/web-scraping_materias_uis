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
        file: "sistemas.json",
        pensumFile: "sistemas.json",
      },
      {
        name: "DISEÑO INDUSTRIAL NUEVO",
        id: 27,
        file: "diseño.json",
        pensumFile: "diseño.json",
      },
      {
        name: "DISEÑO INDUSTRIAL",
        id: 27,
        file: "diseño_antiguo.json",
        pensumFile: "diseño_antiguo.json",
      },
      {
        name: "INGENIERIA BIOMEDICA",
        id: 69,
        file: "biomedica.json",
        pensumFile: "biomedica.json",
      },
      {
        name: "INGENIERIA EN CIENCIA DE DATOS",
        id: 50,
        file: "datos.json",
        pensumFile: "datos.json",
      },
      {
        name: "INGENIERIA CIVIL",
        id: 21,
        file: "civil.json",
        pensumFile: "civil.json",
      },
      {
        name: "INGENIERIA DE PETROLEOS",
        id: 32,
        file: "petroleos.json",
        pensumFile: "petroleos.json",
      },
      {
        name: "QUIMICA",
        id: 14,
        file: "quimica.json",
        pensumFile: "quimica.json",
      },
      {
        name: "MICROBIOLOGIA NUEVO",
        id: 58,
        file: "microbiologia_nuevo.json",
        pensumFile: "microbiologia.json",
      },
      {
        name: "MICROBIOLOGIA",
        id: 58,
        file: "microbiologia.json",
        pensumFile: "microbiologia.json",
      },
      {
        name: "INGENIERIA MECANICA",
        id: 24,
        file: "mecanica.json",
        pensumFile: "mecanica.json",
      },
      {
        name: "INGENIERIA INDUSTRIAL",
        id: 23,
        file: "industrial.json",
        pensumFile: "industrial.json",
      },
      {
        name: "INGENIERIA QUIMICA",
        id: 33,
        file: "ing_quimica.json",
        pensumFile: "ing_quimica.json",
      },
      {
        name: "NUTRICION",
        id: 57,
        file: "nutricion.json",
        pensumFile: "nutricion.json",
      },
      {
        name: "INTELIGENCIA ARTIFICIAL",
        id: 47,
        file: "inteligencia_artificial.json",
        pensumFile: "inteligencia_artificial.json",
      },
      {
        name: "BIOLOGIA",
        id: 10,
        file: "biologia.json",
        pensumFile: "biologia.json",
      },
      {
        name: "LICENCIATURA EN MATEMATICAS",
        id: 16,
        file: "lic_matematicas.json",
        pensumFile: "lic_matematicas.json",
      },
      {
        name: "MATEMATICAS",
        id: 39,
        file: "matematicas.json",
        pensumFile: "matematicas.json",
      },
      {
        name: "MUSICA",
        id: 30,
        file: "musica.json",
        pensumFile: "musica.json",
      },
      {
        name: "FISICA",
        id: 40,
        file: "fisica.json",
        pensumFile: "fisica.json",
      },
      {
        name: "FISIOTERAPIA",
        id: 56,
        file: "fisioterapia.json",
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
      sku: \`\${skuMateria}-\${columns[2]?.textContent.trim()}\`, // SKU único del grupo
      group: columns[2]?.textContent.trim(),
      capacity: parseInt(columns[3]?.textContent.trim(), 10),
      enrolled: parseInt(columns[4]?.textContent.trim(), 10),
      schedule: [],
    };

    const button = row.querySelector(
      \`#form\\\\:dtlListadoProgramadas\\\\\${i}\\\\:btnIrVer\`
    );

    if (button) {
      button.click();
      await waitForElementNotBusy("#form");

      const modalTable = document.querySelector(
        "#formHorario\\\\:dtlListadoParciales_data"
      );

      if (modalTable) {
        const modalRows = modalTable.querySelectorAll("tr");
        modalRows.forEach((modalRow) => {
          const modalColumns = modalRow.querySelectorAll("td div");
          grupoInfo.schedule.push({
            day: modalColumns[0]?.textContent.trim(),
            time: modalColumns[1]?.textContent.trim(),
            building: modalColumns[2]?.textContent.trim(),
            room: modalColumns[3]?.textContent.trim(),
            professor: modalColumns[4]?.textContent.trim(),
          });
        });
      }

      const closeButton = document.querySelector(".ui-dialog-titlebar-close");
      if (closeButton) {
        closeButton.click();
        await waitForElementNotBusy("#form");
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
  console.log("=" .repeat(50));

  try {
    const resultado = await procesarListaCodigos(listaCodigos);
    
    // Guardar resultado final
    const finalData = {
      metadata: {
        totalSubjects: resultado.length,
        timestamp: new Date().toISOString(),
        success: true
      },
      subjects: resultado
    };
    
    localStorage.setItem("scrapingComplete", JSON.stringify(finalData));
    console.log("=" .repeat(50));
    console.log("✅ SCRAPING COMPLETADO");
    console.log(\`📊 Materias procesadas: \${resultado.length}\`);
    console.log("💾 Datos guardados en localStorage");
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
    console.log(`   📁 ${outputPath}\n`);
  }

  // ========== OPTIMIZACIÓN 4: Merge con datos de scraping ==========
  mergeScrapingData(horariosPath) {
    console.log("🔄 FASE 3: Fusión con datos de scraping");
    console.log("═══════════════════════════════════════\n");

    let processed = 0;
    let merged = 0;

    this.programs.forEach((program) => {
      const filePath = path.join(horariosPath, program.file);

      if (!fs.existsSync(filePath)) {
        return;
      }

      try {
        const subjects = JSON.parse(fs.readFileSync(filePath, "utf8"));

        subjects.forEach((subject) => {
          const sku = String(subject.sku);
          processed++;

          if (this.pensumMap.has(sku)) {
            const pensumData = this.pensumMap.get(sku);

            // Crear o actualizar en subjectsMap
            if (!this.subjectsMap.has(sku)) {
              this.subjectsMap.set(sku, {
                sku: subject.sku,
                name: subject.name || pensumData.nombre,
                credits: pensumData.creditos,
                requirements: pensumData.requisitos,
                level: pensumData.nivel,
                groups: subject.groups || [],
                program: [...pensumData.programs], // Usar todos los programas del pensum
              });
              merged++;
            } else {
              // Solo actualizar grupos si hay nuevos
              const existing = this.subjectsMap.get(sku);
              if (subject.groups) {
                const existingSkus = new Set(existing.groups.map((g) => g.sku));
                subject.groups.forEach((group) => {
                  if (!existingSkus.has(group.sku)) {
                    existing.groups.push(group);
                  }
                });
              }
            }
          }
        });

        console.log(`✅ ${program.name}: ${subjects.length} materias`);
      } catch (error) {
        console.error(`❌ ${program.name}: ${error.message}`);
      }
    });

    console.log(`\n📊 Resumen de fusión:`);
    console.log(`   • Materias procesadas: ${processed}`);
    console.log(`   • Materias fusionadas: ${merged}`);
    console.log(`   • Materias únicas finales: ${this.subjectsMap.size}\n`);
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
      },
      subjects: result,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

    console.log(`✅ Archivo guardado: ${outputPath}`);
    console.log(`   • Total de materias: ${result.length}`);
    console.log(`   • Materias compartidas: ${this.sharedSkus.size}`);

    // Estadísticas adicionales
    const withGroups = result.filter((s) => s.groups.length > 0).length;
    const withRequirements = result.filter((s) => s.requirements.length > 0).length;

    console.log(`   • Con grupos: ${withGroups}`);
    console.log(`   • Con requisitos: ${withRequirements}\n`);
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

    // Fase 2: Generar lista optimizada de scraping
    const scrapingList = this.generateScrapingList();

    // Generar script de scraping
    const scrapingScriptPath = path.join(outputDir, "scraping_script.js");
    this.generateScrapingScript(scrapingList, scrapingScriptPath);

    // Fase 3: Merge con datos existentes de horarios
    if (fs.existsSync(horariosPath)) {
      this.mergeScrapingData(horariosPath);
    }

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