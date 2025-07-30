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
    sku: codigoMateria,
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
      sku: columns[2]?.textContent.trim(),
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
    20252, 22948, 22949, 22979, 23423, 23427, 24948, 20253, 22109, 22950, 22951,
    22952, 23424, 20254, 22953, 22954, 22955, 23425, 20255, 22956, 22957, 22958,
    22959, 22960, 22961, 22962, 22963, 22964, 21857, 22965, 22966, 22967, 22968,
    21858, 22969, 22970, 22971, 22972, 22973, 22974, 22975, 22976, 22977, 22978,
    21870, 22490, 24542, 24543, 24544, 24545, 24546, 24548, 24549, 24550, 24551,
    24552, 24553, 24554, 24555, 24556, 24557, 24558, 24560, 24936, 27288, 27571,
    27572, 27582, 27586, 27798, 28091, 28661, 28664, 28665, 29058, 29155, 29156,
    29205, 41419, 41420, 41421, 41422, 40940, 41423, 41424, 41425, 41426, 40555,
    41427, 41428, 41429, 41430, 40556, 41431, 41432, 41433, 41434, 41435, 40557,
    41436, 41437, 41438, 41439, 41440, 40558, 41441, 41442, 41443, 41444, 41445,
    41446, 41447, 41448, 41449, 41450, 41451, 41452, 41453, 24697, 24698, 24699,
    24700, 24701, 24702, 27100, 27716, 28493, 23015, 24588, 24589, 24590, 24591,
    24592, 20113, 24593, 24594, 24595, 24596, 24597, 24598, 24599, 24600, 24601,
    23025, 24602, 24603, 24604, 24605, 24606, 24607, 24608, 24609, 24610, 24611,
    24612, 24613, 24614, 24615, 24616, 24617, 24618, 24619, 40936, 40937, 40938,
    41095, 40939, 40941, 40942, 41017, 41096, 41018, 41019, 41020, 41021, 41022,
    41097, 41023, 41024, 41025, 41026, 41027, 41028, 41029, 41030, 41031, 41032,
    41033, 41098, 41034, 41035, 41036, 41037, 41038, 41039, 41040, 41041, 40935,
    41330, 41331, 41332, 41333, 41334, 41335, 41336, 41337, 41338, 41339, 41340,
    41341, 41342, 41343, 41344, 41345, 41346, 41347, 41348, 41349, 41350, 41351,
    41352, 41353, 41354, 41355, 41356, 23018, 24090, 23834, 24091, 24092, 24093,
    24094, 24095, 24096, 24097, 24098, 24099, 24100, 24101, 24102, 24103, 24104,
    24105, 24106, 24107, 24108, 24109, 24110, 24111, 24112, 24113, 21586, 24114,
    24115, 24116, 24117, 24118, 24119, 24120, 24121, 24122, 24123, 24124, 24125,
    24126, 24127, 24128, 24129, 24130, 24131, 24132, 24133, 24134, 24135, 24136,
    24137, 24138, 24139, 24140, 24141, 24142, 24143, 24144, 24145, 24146, 24147,
    24148, 29086, 29087, 29088, 29089, 20314, 23050, 23079, 28035, 28036, 28037,
    28038, 28039, 28040, 28041, 28042, 28043, 28044, 28045, 28046, 28047, 28048,
    23183, 28049, 28050, 28051, 28052, 28053, 28054, 28055, 28056, 28057, 28058,
    28059, 28060, 21458, 21517, 23193, 23196, 23207, 23208, 23209, 26542, 26579,
    28422, 40513, 40514, 40515, 40516, 40517, 40518, 40519, 40520, 40521, 40522,
    40523, 40524, 40525, 40526, 40527, 40528, 40529, 40530, 40531, 40532, 40533,
    40534, 40535, 40536, 40537, 40538, 40539, 40540, 40541, 40542, 40543, 40544,
    40545, 40546, 40547, 40548, 40549, 40550, 40551, 40552, 40562, 40564, 40570,
    40573, 40577, 40579, 40583, 41058, 41059, 41060, 41061, 24988, 41062, 41063,
    41064, 41065, 41066, 41067, 41068, 24982, 41069, 41070, 41071, 41072, 41073,
    41074, 41075, 41076, 24983, 41077, 41078, 41079, 24987, 41080, 41081, 41082,
    41083, 41084, 41085, 41086, 24989, 41087, 41088, 41089, 41090, 41091, 41092,
    41093, 41094, 24979, 24980, 24981, 24991, 24990, 28101, 25003, 25001, 24999,
    24997, 24998, 25002, 25315, 21280, 21281, 21282, 21283, 21285, 21286, 21275,
    21277, 24464, 24463, 21269, 23211, 21268, 40494, 28634, 28635, 28595, 28596,
    28597, 28599, 28602, 21043, 20189, 23670, 21936, 22334, 27007, 26230, 40503,
    20521, 25091,
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
