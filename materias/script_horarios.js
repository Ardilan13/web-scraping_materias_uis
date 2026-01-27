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
  "20252", "20314", "22952", "22979", "23050", "23423", "23427", "24948",
    "20253", "22950", "23079", "23424", "28035",
    "20113", "20254", "22953", "23425", "28036",
    "20255", "22956", "23015", "28037", "28038", "28039",
    "28040", "28041", "28042", "28043", "28044",
    "28045", "28046", "28047", "28048",
    "23183", "28049", "28050", "28051", "28052", "28053",
    "28054", "28055", "28056",
    "22975", "28057", "28058", "28059", "28060",
    "22977",
    "21458", "21517", "23193", "23196", "23207", "23208", "23209",
    "26542", "26579", "28422"
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
