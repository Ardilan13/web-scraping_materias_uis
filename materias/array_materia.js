const fs = require("fs");
const path = require("path");

function leerTodosLosCodigosUnicos(rutaCarpeta) {
  const codigosUnicos = new Set();

  try {
    if (!fs.existsSync(rutaCarpeta)) {
      throw new Error(`La carpeta ${rutaCarpeta} no existe`);
    }

    const archivos = fs.readdirSync(rutaCarpeta);
    const archivosJSON = archivos.filter((archivo) =>
      archivo.endsWith(".json")
    );

    for (const archivo of archivosJSON) {
      try {
        const rutaCompleta = path.join(rutaCarpeta, archivo);
        const contenido = fs.readFileSync(rutaCompleta, "utf8");
        const datos = JSON.parse(contenido);

        if (Array.isArray(datos.materias)) {
          for (const materia of datos.materias) {
            if (materia && typeof materia.codigo === "string") {
              codigosUnicos.add(materia.codigo);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error leyendo archivo ${archivo}:`, error.message);
      }
    }
  } catch (error) {
    console.error("💥 Error general:", error.message);
  }

  return [...codigosUnicos];
}

function guardarResultado(codigos, archivoSalida = "codigos.json") {
  try {
    fs.writeFileSync(archivoSalida, JSON.stringify(codigos, null, 2));
    console.log(`💾 Códigos únicos guardados en: ${archivoSalida}`);
  } catch (error) {
    console.error("❌ Error guardando archivo:", error.message);
  }
}

// EJECUCIÓN PRINCIPAL
(function () {
  const rutaCarpeta = process.argv[2] || "./json/bio";
  const codigosUnicos = leerTodosLosCodigosUnicos(rutaCarpeta);
  guardarResultado(codigosUnicos);
})();

// Exportar por si se requiere desde otro archivo
module.exports = {
  leerTodosLosCodigosUnicos,
  guardarResultado,
};
