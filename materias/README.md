# Materias UIS - Web Scraping 'script_horarios.js'

Para correr el codigo y obtener los datos se debe:

1. Entrar a la plataforma de la UIS.
2. Ingresar a asignaturas programadas.
3. En la consola del navegador, poner el script completo de 'script_horarios.js' y correrlo
4. Esperar que pase por cada una de las materias, la terminal informara en que materia esta, cuales se han completado y cuales han dado error
5. Al finalizar copiar el json que genero con todas las materias y sus respetivos horarios

# Materias HTML a JSON 'materias_html_to_json.js'

Para sacar los datos de las materias de html a json se debe:

1. Copiar el contenido del html generado por la pagina de la UIS de la carrera
2. Pegar el contenido en un archivo .html dentro de la carpeta 'materias/html'
3. Correr el script 'script_html_to_json.js' en la consola con "node materias_html_to_json.js ./html ./json"
4. Se generara un archivo json con el nombre de la carrera, que contiene las materias

# Materias JSON a Array 'array_materia.js'

Para convertir los archivos json de las materias a un array se debe:

1. Tener los archivos json de las materias en la carpeta 'materias/json'
2. Correr el script 'array_materia.js' en la consola con "node materias/array_materia.js ./json"
3. Se generara un archivo 'codigos.json' que contiene un array con todos los codigos de las materias sin repetir

# Transformar materias para subir a mongo
1. Ejecutar script_transformar.js  esto modificara el nombre de los atributos a ingles
2. Ejecutar el script script_fusion_subjects.js  esto realizara la insercion de los grupos en cada  asignatura
3. Ejecutar ek script cruce_materias.json el cual agregara el program  a cada una d elas materias
4. Eportar a mongoDB el archivo cursos_compartidos.json que se encuentra en la carpeta output
