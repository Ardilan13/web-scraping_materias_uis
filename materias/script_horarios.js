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

async function procesarMateria(skuMateria) {
  const inputCodigo = document.querySelector("#form\\:txtCodigoAsignatura");
  const btnConsulta = document.querySelector("#form\\:btnConsultaAsignatura");

  if (!inputCodigo || !btnConsulta) {
    console.error("No se encontraron los elementos de consulta");
    return null;
  }

  inputCodigo.value = skuMateria;
  btnConsulta.click();

  await waitForElementNotBusy("#form");

  const tableDiv = document.querySelector("#form\\:dtlListadoProgramadas");
  if (!tableDiv) {
    console.error(`No se encontró información para el código ${skuMateria}`);
    return null;
  }

  const rows = tableDiv.querySelectorAll("tbody tr");
  const materiaInfo = {
    sku: skuMateria,
    name: "",
    groups: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const columns = row.querySelectorAll("td div");

    if (i === 0) {
      materiaInfo.name = columns[1]?.textContent.trim();
    }

    const grupoInfo = {
      groups: columns[2]?.textContent.trim(),
      capacity: parseInt(columns[3]?.textContent.trim(), 10),
      enrolled: parseInt(columns[4]?.textContent.trim(), 10),
      schedule: [],
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
          grupoInfo.schedule.push({
            day: modalColumns[0]?.textContent.trim(),
            time: modalColumns[1]?.textContent.trim(),
            building: modalColumns[2]?.textContent.trim(),
            room: modalColumns[3]?.textContent.trim(),
            professor: modalColumns[4]?.textContent.trim(),
          });
        });
      }

      const closeButton = document.querySelector(".ui-dialog-titlebar-close");
      if (closeButton) {
        closeButton.click();
        await waitForElementNotBusy("#form");
      }
    }

    materiaInfo.groups.push(grupoInfo);
  }

  return materiaInfo;
}

async function procesarListaCodigos(listaCodigos) {
  const resultado = [];

  for (const sku of listaCodigos) {
    console.log(`Procesando código: ${sku}`);
    const materiaInfo = await procesarMateria(sku);
    if (materiaInfo) {
      resultado.push(materiaInfo);
      console.log(`Completado código: ${sku}`);
    }
  }

  return resultado;
}

(async function () {
  const listaCodigos = [
    "40935",
  "40936",
  "41609",
  "41330",
  "41610",
  "29205",
  "40939",
  "41332",
  "41334",
  "40940",
  "41333",
  "41095",
  "41018",
  "41337",
  "41339",
  "41019",
  "41336",
  "41096",
  "23423",
  "41338",
  "41342",
  "41341",
  "41340",
  "41611",
  "41097",
  "41612",
  "41346",
  "41613",
  "41614",
  "41098",
  "41615",
  "41616",
  "41351",
  "41670",
  "41617",
  "41348",
  "41618",
  "41619",
  "41620",
  "41621",
  "41622",
  "41648",
  "41649",
  "41650",
  "41362",
  "41651",
  "41652",
  "41653",
  "41654",
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
