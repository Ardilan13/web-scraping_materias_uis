const fs = require('fs');

// Carga los JSON
const dbStudents = JSON.parse(fs.readFileSync('./data/uis-sistema@dev.users.json', 'utf8'));
const studentsWithLevel = JSON.parse(fs.readFileSync('./data/CONSULTA_SQL IngSistemas_mongo.json', 'utf8'));

// Crear un mapa para acceso rápido por identificación
const levelMap = new Map();
for (const student of studentsWithLevel) {
  levelMap.set(student.identification, student.level);
}

// Agregar el campo 'level' si se encuentra por identificación
const updatedStudents = dbStudents.map(student => {
  const level = levelMap.get(student.identification);
  if (level) {
    student.level = level;
  }
  return student;
});

// Guardar el resultado en un nuevo archivo
fs.writeFileSync('students_updated.json', JSON.stringify(updatedStudents, null, 2), 'utf8');

console.log('Archivo students_updated.json generado con los levels añadidos.');