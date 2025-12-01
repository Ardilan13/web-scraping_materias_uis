// optimizar_imagenes.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const carpetaOrigen = "./imagenes";
const carpetaSalida = "./imagenes_optimizada";

// Crear carpeta de salida si no existe
if (!fs.existsSync(carpetaSalida)) {
  fs.mkdirSync(carpetaSalida);
}

// Leer todos los archivos de la carpeta origen
fs.readdirSync(carpetaOrigen).forEach(async (archivo) => {
  const rutaArchivo = path.join(carpetaOrigen, archivo);
  const extension = path.extname(archivo).toLowerCase();

  // Solo procesar formatos soportados
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    const salida = path.join(carpetaSalida, archivo);

    try {
      const imagen = sharp(rutaArchivo);

      // Optimizar según el formato
      if (extension === ".jpg" || extension === ".jpeg") {
        await imagen
          .jpeg({ quality: 70, mozjpeg: true }) // calidad ajustable
          .toFile(salida);
      } else if (extension === ".png") {
        await imagen
          .png({ compressionLevel: 9, palette: true }) // máxima compresión
          .toFile(salida);
      } else if (extension === ".webp") {
        await imagen.webp({ quality: 70 }).toFile(salida);
      }

      console.log(`✅ Optimizada: ${archivo}`);
    } catch (err) {
      console.error(`❌ Error optimizando ${archivo}:`, err);
    }
  }
});
