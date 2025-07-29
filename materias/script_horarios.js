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

async function procesarMateria(codigoMateria) {
  const inputCodigo = document.querySelector("#form\\:txtCodigoAsignatura");
  const btnConsulta = document.querySelector("#form\\:btnConsultaAsignatura");

  if (!inputCodigo || !btnConsulta) {
    console.error("No se encontraron los elementos de consulta");
    return null;
  }

  inputCodigo.value = codigoMateria;
  btnConsulta.click();

  await waitForElementNotBusy("#form");

  const tableDiv = document.querySelector("#form\\:dtlListadoProgramadas");
  if (!tableDiv) {
    console.error(`No se encontró información para el código ${codigoMateria}`);
    return null;
  }

  const rows = tableDiv.querySelectorAll("tbody tr");
  const materiaInfo = {
    codigo: codigoMateria,
    nombre: "",
    grupos: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const columns = row.querySelectorAll("td div");

    if (i === 0) {
      materiaInfo.nombre = columns[1]?.textContent.trim();
    }

    const grupoInfo = {
      grupo: columns[2]?.textContent.trim(),
      capacidad: parseInt(columns[3]?.textContent.trim(), 10),
      matriculados: parseInt(columns[4]?.textContent.trim(), 10),
      horario: [],
    };

    const button = row.querySelector(
      `#form\\:dtlListadoProgramadas\\:${i}\\:btnIrVer`
    );

    if (button) {
      button.click();
      await waitForElementNotBusy("#form");

      const modalTable = document.querySelector(
        "#formHorario\\:dtlListadoParciales_data"
      );

      if (modalTable) {
        const modalRows = modalTable.querySelectorAll("tr");
        modalRows.forEach((modalRow) => {
          const modalColumns = modalRow.querySelectorAll("td div");
          grupoInfo.horario.push({
            dia: modalColumns[0]?.textContent.trim(),
            hora: modalColumns[1]?.textContent.trim(),
            edificio: modalColumns[2]?.textContent.trim(),
            aula: modalColumns[3]?.textContent.trim(),
            profesor: modalColumns[4]?.textContent.trim(),
          });
        });
      }

      const closeButton = document.querySelector(".ui-dialog-titlebar-close");
      if (closeButton) {
        closeButton.click();
        await waitForElementNotBusy("#form");
      }
    }

    materiaInfo.grupos.push(grupoInfo);
  }

  return materiaInfo;
}

async function procesarListaCodigos(listaCodigos) {
  const resultado = [];

  for (const codigo of listaCodigos) {
    console.log(`Procesando código: ${codigo}`);
    const materiaInfo = await procesarMateria(codigo);
    if (materiaInfo) {
      resultado.push(materiaInfo);
      console.log(`Completado código: ${codigo}`);
    }
  }

  return resultado;
}

(async function () {
  const listaCodigos = [
  "20252", // Cálculo I
  "22948", // Fundamentos de Programación
  "22949", // Química Básica
  "22979", // Algebra Lineal I
  "23423", // Cultura Física y Deportiva
  "23427", // Taller de Lenguaje
  "24948", // Vida y cultura universitaria
  "20253", // Cálculo II
  "22109", // Ética Ciudadana
  "22950", // Física I
  "22951", // Programación Orientada a Objetos
  "22952", // Biología para Ingenieros
  "23424", // Inglés I
  "20254", // Cálculo III
  "22953", // Física II
  "22954", // Matemáticas discretas
  "22955", // Estruc. de datos y análisis de alg.
  "23425", // Inglés II
  "20255", // Ecuaciones Diferenciales
  "22956", // Física III
  "22957", // Electricidad y Electrónica
  "22958", // Autómatas y lenguajes formales
  "22959", // Base de Datos I
  "22960", // Base de Datos II
  "22961", // Sistemas Digitales
  "22962", // Análisis Númerico I
  "22963", // Pensamiento sistémico y organizacional
  "22964", // Dirección empresarial I
  "21857", // Estadística I
  "22965", // Redes de Computadores I
  "22966", // Arquitectura de Computadores
  "22967", // Programación en la Web
  "22968", // Sistemas de Información
  "21858", // Estadística II
  "22969", // Ingeniería del Software I
  "22970", // Redes de Computadores II
  "22971", // Inteligencia Artificial I
  "22972", // Sistemas Operacionales
  "22973", // Ingeniería del Software II
  "22974", // Simulación Digital
  "22975", // Trabajo de Grado I
  "22976", // Ingeniería Económica
  "22977", // Trabajo de Grado II
  "22978", // Economía Empresarial
  "21870", // Gerencia de Informática I
  "22490", // Seguridad informática
  "24542", // Entornos de programación
  "24543", // Tratamiento de señales
  "24544", // Sistemas discretos y continuos
  "24545", // Modelado estructural
  "24546", // Microcontroladores I
  "24548", // Auditoría de sistemas
  "24549", // Investigación operacional
  "24550", // Modelos a gran escala
  "24551", // Gestión de redes empresariales
  "24552", // Inteligencia artificial II
  "24553", // Microcontroladores II
  "24554", // Trabajo de investigación II
  "24555", // Informática biomédica
  "24556", // Sistemas distribuidos
  "24557", // Ingeniería de software III
  "24558", // Inteligencia artificial III
  "24560", // Programación distribuida
  "24936", // Compiladores de lenguaje
  "27288", // Interacción Hombre Computador
  "27571", // Procesamiento de imágenes digitales
  "27572", // Algoritmos I
  "27582", // Análisis de datos a gran escala
  "27586", // Trabajo de investigación I
  "27798", // Optimización convexa
  "28091", // Principios y prácticas de desarrollo de software orientado a objetos
  "28661", // Introducción a la computación paralela
  "28664", // Innovación educativa en la sociedad de la información
  "28665", // Modelos de negocios en la sociedad de la información
  "29058", // Visión por computador
  "29155", // Arquitectura Empresarial
  "29156"  // Gestión del conocimiento
  ];

  try {
    const resultado = await procesarListaCodigos(listaCodigos);
    console.log(JSON.stringify(resultado, null, 2));

    // Opcional: Guardar en localStorage por si el navegador se cierra
    localStorage.setItem("resultadoMaterias", JSON.stringify(resultado));
    console.log("Datos guardados en localStorage");
  } catch (error) {
    console.error("Error durante el procesamiento:", error);

    // Intentar recuperar últimos datos guardados en caso de error
    const datosGuardados = localStorage.getItem("resultadoMaterias");
    if (datosGuardados) {
      console.log(
        "Datos previos recuperados de localStorage:",
        JSON.parse(datosGuardados)
      );
    }
  }
})();
