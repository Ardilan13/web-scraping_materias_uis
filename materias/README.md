# Materias UIS - Web Scraping 'script_horarios.js'

Para correr el codigo y obtener los datos se debe:

1. Entrar a la plataforma de la UIS.
2. Ingresar a asignaturas programadas.
3. En la consola del navegador, poner el script completo de 'script_horarios.js' y correrlo, consultar al final de la carpeta pensum-json los codigos que pertenecen a esa carrera
4. Esperar que pase por cada una de las materias, la terminal informara en que materia esta, cuales se han completado y cuales han dado error
5. Al finalizar copiar el json que genero con todas las materias y sus respetivos horarios en la carpeta horarios


# Materias HTML a JSON 'materias_html_to_json.js'

Para sacar los datos de las materias de html a json se debe:

1. Copiar el contenido del html generado por la pagina de la UIS de la carrera
2. Pegar el contenido en un archivo .html dentro de la carpeta 'materias/html'
3. Correr el script 'script_html_to_json.js' en la consola con "node materias_html_to_json.js ruta/a/carpeta_html"
4. Se generara un archivo json con el nombre de la carrera, que contiene las materias

# Web scraping optimizado

1. Es necesario tener informacion del pensum de la carrera en las carpetas materias\pensum-json y materias\horarios
2. Ejecuta el script node subjects_processor.js
3. Revisar el scraping_script.js generado verificar que tiene todas las materias mediante la consola
4. Copiar el script generado en el archivo scraping_script.js en la consola del navegador
5. los resultados se veran en el archivo merged_subjects_optimized.json este sera el que se puede exportar a la DB
