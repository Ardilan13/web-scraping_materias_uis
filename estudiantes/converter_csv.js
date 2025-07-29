const fs = require("fs");
const path = require("path");

// Función para leer y procesar el CSV
function csvToJson(csvFilePath, outputPath = null) {
  try {
    // Leer el archivo CSV
    const csvData = fs.readFileSync(csvFilePath, "latin1");

    // Dividir en líneas y obtener headers
    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(";");

    // Procesar cada línea de datos
    const jsonData = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(";");

      // Crear objeto con los datos del CSV
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index] || "";
      });

      // Transformar al formato requerido
      const transformedData = transformToMongoFormat(rowData);
      jsonData.push(transformedData);
    }

    // Guardar el resultado
    const outputFile = outputPath || csvFilePath.replace(".csv", "_mongo.json");
    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));

    console.log(
      `✅ Conversión completada: ${jsonData.length} registros procesados`
    );
    console.log(`📁 Archivo guardado en: ${outputFile}`);

    return jsonData;
  } catch (error) {
    console.error("❌ Error procesando el archivo:", error.message);
    throw error;
  }
}

// Función para transformar cada registro al formato de MongoDB
function transformToMongoFormat(data) {
  // Construir el nombre completo
  const firstName = data.primer_nombre || "";
  const secondName = data.segundo_nombre || "";
  const fullFirstName = `${firstName} ${secondName}`.trim();

  // Construir apellidos
  const firstLastname = data.primer_apellido || "";
  const secondLastname = data.segundo_apellido || "";
  const fullLastname = `${firstLastname} ${secondLastname}`.trim();

  // Mapear programas académicos (puedes expandir este mapeo según tus necesidades)
  const programMap = {
    11: {
      id: 11,
      name: "INGENIERIA DE SISTEMAS",
    },
    14: {
      id: 14,
      name: "QUIMICA"
    },
    27: {
      id: 27,
      name: "DISEÑO INDUSTRIAL",
    },
    69: {
      id: 69,
      name: "INGENIERIA BIOMEDICA",
    },
    50: {
      id: 50,
      name: "INGENIERIA EN CIENCIA DE DATOS",
    },
    58: {
      id: 58,
      name: "MICROBIOLOGIA",
    },
    21: {
      id: 21,
      name: "INGENIERIA CIVIL",
    },
    32: {
      id: 32,
      name: "INGENIERIA DE PETROLEOS",
    },
  };

  const program = programMap[data.programa_academico] || {
    id: parseInt(data.programa_academico) || 0,
    name: "PROGRAMA DESCONOCIDO",
  };

  if (data.plan == 14) {
    program.new_pensum = true;
  }

  // Permisos estándar para estudiantes
  const studentPermissions = [
    "read:schedule",
    "write:schedule",
    "delete:schedule",
    "write:appeal",
    "read:appeal",
    "delete:appeal",
    "read:subject",
  ];

  return {
    name: fullFirstName,
    lastname: fullLastname,
    username: data.email || "",
    identification: data.codigo_est || "",
    level: data.nivel || null,
    kind: "STUDENT",
    password: "",
    verified: false,
    permissions: studentPermissions,
    program: program,
  };
}

// Función para procesar múltiples archivos CSV
function processMultipleFiles(inputDirectory, outputDirectory = null) {
  try {
    const files = fs.readdirSync(inputDirectory);
    const csvFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".csv")
    );

    if (csvFiles.length === 0) {
      console.log("⚠️  No se encontraron archivos CSV en el directorio");
      return;
    }

    console.log(`📂 Procesando ${csvFiles.length} archivo(s) CSV...`);

    csvFiles.forEach((file) => {
      const inputPath = path.join(inputDirectory, file);
      const outputPath = outputDirectory
        ? path.join(outputDirectory, file.replace(".csv", "_mongo.json"))
        : null;

      console.log(`\n🔄 Procesando: ${file}`);
      csvToJson(inputPath, outputPath);
    });

    console.log("\n✅ Todos los archivos han sido procesados exitosamente");
  } catch (error) {
    console.error("❌ Error procesando múltiples archivos:", error.message);
    throw error;
  }
}

// Función principal para uso directo
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("❌ Debe especificar un archivo CSV o un directorio");
    return;
  }

  if (args[0] === "--dir") {
    const inputDir = args[1];
    const outputDir = args[2] || null;

    if (!inputDir) {
      console.error("❌ Debe especificar el directorio de entrada");
      return;
    }

    processMultipleFiles(inputDir, outputDir);
  } else {
    const inputFile = args[0];
    const outputFile = args[1] || null;

    csvToJson(inputFile, outputFile);
  }
}

// Exportar funciones para uso como módulo
module.exports = {
  csvToJson,
  processMultipleFiles,
  transformToMongoFormat,
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
