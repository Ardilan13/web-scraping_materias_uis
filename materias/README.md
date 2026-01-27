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
3. Correr el script 'script_html_to_json.js' en la consola con "node materias_html_to_json.js ./html ./json"
4. Se generara un archivo json con el nombre de la carrera, que contiene las materias

# Materias JSON proceso para depurar la data

1. Tener los archivos json de las materias en la carpeta 'materias/json'
2. Ejecutar script_transformar.js  esto modificara el nombre de los atributos a ingles, toma el archivo y sobreescribo la informacion se puede ejecutar de la siguiente manera: Si el archivo está en la carpeta horarios/  ejecutar node groups_transformer.js "nombre del archivo".json
3. ejecutar el script merge_subject.js este realizara una validacion entre todas las asignaturas y revisara de todos las carreras y validara cuales se cruzan añadiendo el program. este script genera el archivo merged_subjects.json el cual es la version final que puede ser exportada a la DB
