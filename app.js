const HISTORIAS_BASE = "./data/historias";

// Formato: [title, archivo]
const HISTORIAS = [
  ["Ein kurzer Anruf im Büro", "historia-01.json"]
];

const els = {
  headerTitle: document.getElementById("header-title"),
  btnBack: document.getElementById("btn-back"),
  btnToggleTrad: document.getElementById("btn-toggle-trad"),
  vistaLista: document.getElementById("vista-lista"),
  listaHistorias: document.getElementById("lista-historias"),
  vistaLectura: document.getElementById("vista-lectura"),
  contenidoHistoria: document.getElementById("contenido-historia"),
  sheet: document.getElementById("bottom-sheet"),
  sheetWord: document.getElementById("sheet-word"),
  sheetBase: document.getElementById("sheet-base"),
  sheetTranslation: document.getElementById("sheet-translation"),
  sheetSentence: document.getElementById("sheet-sentence"),
  sheetClose: document.getElementById("sheet-close")
};

let mostrarFrasesES = false;
let palabraActiva = null;

function normalizarClave(texto) {
  return (texto || "")
    .replace(/[.,!?;:()"„“»«…]+/g, "")
    .trim()
    .toLowerCase();
}

function buscarEnHistoria(textoPalabra, vocabularioLocal) {
  const vocab = vocabularioLocal || {};
  const clave = normalizarClave(textoPalabra);
  const entrada = vocab[clave] || vocab[textoPalabra] || null;

  if (Array.isArray(entrada) && entrada.length > 0) {
    const [base, ...traducciones] = entrada;
    return { base: base || "", traducciones };
  }

  return { base: "", traducciones: [] };
}

function renderLista() {
  els.listaHistorias.innerHTML = "";

  HISTORIAS.forEach(([title, archivo]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.textContent = title;
    btn.addEventListener("click", () => abrirHistoria(title, archivo));
    els.listaHistorias.appendChild(btn);
  });
}

async function abrirHistoria(title, archivo) {
  cerrarSheet();
  mostrarFrasesES = false;
  els.btnToggleTrad.textContent = "Frase ES";

  try {
    const res = await fetch(`${HISTORIAS_BASE}/${archivo}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al cargar ${archivo}`);
    }
    const data = await res.json();

    els.headerTitle.textContent = data.titulo || title;
    renderHistoria(data);

    els.vistaLista.classList.add("hidden");
    els.vistaLectura.classList.remove("hidden");
    els.btnBack.classList.remove("hidden");
    els.btnToggleTrad.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    alert(`No se pudo cargar la historia:\n${err.message}`);
  }
}

function renderHistoria(data) {
  els.contenidoHistoria.innerHTML = "";

  (data.parrafos || []).forEach((parrafo) => {
    const p = document.createElement("p");
    p.className = "paragraph";

    // Divide el texto alemán automáticamente por espacios en botones táctiles
    const palabras = (parrafo.de || "").trim().split(/\s+/);

    palabras.forEach((palabraTexto) => {
      if (!palabraTexto) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "word-btn";
      btn.textContent = palabraTexto;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        mostrarTraduccion(btn, palabraTexto, parrafo.es, data.vocabulario);
      });
      p.appendChild(btn);
      p.appendChild(document.createTextNode(" "));
    });

    if (parrafo.es) {
      const spanES = document.createElement("span");
      spanES.className = "sentence-es hidden";
      spanES.textContent = parrafo.es;
      p.appendChild(spanES);
    }

    els.contenidoHistoria.appendChild(p);
  });
}

function mostrarTraduccion(btn, palabraTexto, traduccionCompleta, vocabularioLocal) {
  if (palabraActiva) {
    palabraActiva.classList.remove("active");
  }
  btn.classList.add("active");
  palabraActiva = btn;

  const { base, traducciones } = buscarEnHistoria(palabraTexto, vocabularioLocal);

  els.sheetWord.textContent = palabraTexto;
  els.sheetBase.textContent = base ? `(${base})` : "";
  els.sheetTranslation.textContent = traducciones.length
    ? traducciones.join(" · ")
    : "Palabra no registrada en el vocabulario de esta historia";

  if (traduccionCompleta) {
    els.sheetSentence.textContent = traduccionCompleta;
    els.sheetSentence.classList.remove("hidden");
  } else {
    els.sheetSentence.classList.add("hidden");
  }

  els.sheet.classList.remove("hidden");
}

function cerrarSheet() {
  els.sheet.classList.add("hidden");
  if (palabraActiva) {
    palabraActiva.classList.remove("active");
    palabraActiva = null;
  }
}

els.btnBack.addEventListener("click", () => {
  cerrarSheet();
  els.vistaLectura.classList.add("hidden");
  els.btnBack.classList.add("hidden");
  els.btnToggleTrad.classList.add("hidden");
  els.headerTitle.textContent = "Historias A2";
  els.vistaLista.classList.remove("hidden");
});

els.btnToggleTrad.addEventListener("click", () => {
  mostrarFrasesES = !mostrarFrasesES;
  els.btnToggleTrad.textContent = mostrarFrasesES ? "Ocultar ES" : "Frase ES";
  document.querySelectorAll(".sentence-es").forEach((el) => {
    el.classList.toggle("hidden", !mostrarFrasesES);
  });
});

els.sheetClose.addEventListener("click", cerrarSheet);
document.addEventListener("click", (e) => {
  if (!els.sheet.contains(e.target) && !e.target.classList.contains("word-btn")) {
    cerrarSheet();
  }
});

renderLista();