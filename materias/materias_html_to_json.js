const fs = require("fs");
const path = require("path");

// Extrae todas las materias, incluyendo requisitos y niveles
function extraerMateriasDesdeTablas(htmlContent) {
  const materias = [];
  const nivelRegex = /<h4[^>]*class="text-satisfactorio"[^>]*>(.*?)<\/h4>/gi;
  let match;
  let index = 0;

  while ((match = nivelRegex.exec(htmlContent)) !== null) {
    const nivelTexto = match[1];
    const nivelMatch = nivelTexto.match(/NIVEL (\d+)/i);
    const nivel = nivelMatch ? parseInt(nivelMatch[1]) : "Electivas";

    // Buscar la tabla que sigue al encabezado de nivel
    const tableStart = htmlContent.indexOf("<table", match.index);
    const tableEnd =
      htmlContent.indexOf("</table>", tableStart) + "</table>".length;
    const tableHTML = htmlContent.slice(tableStart, tableEnd);

    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gms;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableHTML)) !== null) {
      const row = rowMatch[1];

      const columnas = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gms)].map((td) =>
        td[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
      );

      if (columnas.length >= 6) {
        const codigo = columnas[0];
        const nombre = columnas[1];
        const creditos = parseInt(columnas[2]);
        const requisitosHTML = row.match(/<td[^>]*>(.*?)<\/td>/gms)[5];
        const requisitos = [
          ...requisitosHTML.matchAll(/>R:\s*<\/b>\s*(\w+)/g),
        ].map((m) => m[1]);

        materias.push({
          codigo,
          nombre,
          creditos,
          requisitos,
          nivel,
        });
      }
    }
  }

  return materias;
}

// Procesa archivo HTML individual
function convertirHtmlAJson(htmlContent, filename) {
  const materias = extraerMateriasDesdeTablas(htmlContent);

  const codigosUnicos = new Set();
  const materiasUnicas = [];

  for (const materia of materias) {
    if (!codigosUnicos.has(materia.codigo)) {
      codigosUnicos.add(materia.codigo);
      materiasUnicas.push(materia);
    }
  }

  // Ordenar por nivel y código
  materiasUnicas.sort((a, b) => {
    if (a.nivel === "Electivas") return 1;
    if (b.nivel === "Electivas") return -1;
    return a.nivel !== b.nivel
      ? a.nivel - b.nivel
      : a.codigo.localeCompare(b.codigo);
  });

  return { materias: materiasUnicas };
}

// Procesa una carpeta completa
function procesarCarpetaHTML(rutaCarpeta, rutaSalida = "./json_output") {
  if (!fs.existsSync(rutaSalida)) {
    fs.mkdirSync(rutaSalida, { recursive: true });
  }

  const archivos = fs
    .readdirSync(rutaCarpeta)
    .filter((f) => f.endsWith(".html"));

  if (archivos.length === 0) {
    console.log("No hay archivos HTML en la carpeta.");
    return;
  }

  console.log(`Procesando ${archivos.length} archivos HTML...`);

  archivos.forEach((archivo) => {
    try {
      const rutaArchivo = path.join(rutaCarpeta, archivo);
      const contenido = fs.readFileSync(rutaArchivo, "utf8");
      const data = convertirHtmlAJson(contenido, archivo);

      const nombreJSON = path.join(
        rutaSalida,
        path.parse(archivo).name + ".json"
      );
      fs.writeFileSync(nombreJSON, JSON.stringify(data, null, 2), "utf8");

      console.log(
        `✓ ${archivo} → ${path.basename(nombreJSON)} (${
          data.materias.length
        } materias)`
      );
    } catch (error) {
      console.error(`✗ Error en ${archivo}: ${error.message}`);
    }
  });

  console.log("\n✅ Proceso completado.");
}

// Procesa archivo individual
function procesarArchivoIndividual(rutaArchivo) {
  try {
    const contenido = fs.readFileSync(rutaArchivo, "utf8");
    const jsonData = convertirHtmlAJson(contenido, path.basename(rutaArchivo));

    console.log(JSON.stringify(jsonData, null, 2));

    const salida = rutaArchivo.replace(/\.html$/, ".json");
    fs.writeFileSync(salida, JSON.stringify(jsonData, null, 2), "utf8");
    console.log(`\nArchivo JSON guardado: ${salida}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("USO:");
    console.log("  node materias_html_to_json.js <archivo.html>");
    console.log(
      "  node materias_html_to_json.js <carpeta_html> [carpeta_salida]"
    );
  } else if (args.length === 1) {
    const ruta = args[0];
    const stats = fs.statSync(ruta);
    if (stats.isFile()) {
      procesarArchivoIndividual(ruta);
    } else if (stats.isDirectory()) {
      procesarCarpetaHTML(ruta);
    }
  } else if (args.length >= 2) {
    procesarCarpetaHTML(args[0], args[1]);
  }
}

module.exports = {
  convertirHtmlAJson,
  procesarCarpetaHTML,
  procesarArchivoIndividual,
};