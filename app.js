const HISTORIAS_BASE = "./data/historias";

// Formato: [title, archivo]
const HISTORIAS = [
  ["Ein kurzer Anruf im Büro", "historia-01.json"],
  ["Eine intensive Woche zwischen Büro, Einkäufen und Terminen","historia-02.json"],
   ["Samstag auf dem Wochenmarkt","historia-03.json"],
   ["Eine intensive Woche","historia-04.json"]
];

const PARRAFOS_POR_PAGINA = 4;

const els = {
  headerTitle: document.getElementById("header-title"),
  btnBack: document.getElementById("btn-back"),
  btnToggleTrad: document.getElementById("btn-toggle-trad"),
  vistaLista: document.getElementById("vista-lista"),
  listaHistorias: document.getElementById("lista-historias"),
  vistaLectura: document.getElementById("vista-lectura"),
  contenidoHistoria: document.getElementById("contenido-historia"),
  paginacion: document.getElementById("paginacion"),
  btnPrevPage: document.getElementById("btn-prev-page"),
  btnNextPage: document.getElementById("btn-next-page"),
  pageIndicator: document.getElementById("page-indicator"),
  sheet: document.getElementById("bottom-sheet"),
  sheetWord: document.getElementById("sheet-word"),
  sheetBase: document.getElementById("sheet-base"),
  sheetTranslation: document.getElementById("sheet-translation"),
  sheetSentence: document.getElementById("sheet-sentence"),
  sheetClose: document.getElementById("sheet-close")
};

let historiaActual = null;
let paginaActual = 0;
let totalPaginas = 1;
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

    historiaActual = data;
    const parrafos = data.parrafos || [];
    totalPaginas = Math.max(1, Math.ceil(parrafos.length / PARRAFOS_POR_PAGINA));
    paginaActual = 0;

    els.headerTitle.textContent = data.titulo || title;
    renderPagina();

    els.vistaLista.classList.add("hidden");
    els.vistaLectura.classList.remove("hidden");
    els.btnBack.classList.remove("hidden");
    els.btnToggleTrad.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    alert(`No se pudo cargar la historia:\n${err.message}`);
  }
}

function renderPagina() {
  if (!historiaActual) return;
  cerrarSheet();

  const parrafos = historiaActual.parrafos || [];
  const inicio = paginaActual * PARRAFOS_POR_PAGINA;
  const fin = inicio + PARRAFOS_POR_PAGINA;
  const parrafosPagina = parrafos.slice(inicio, fin);

  els.contenidoHistoria.innerHTML = "";

  parrafosPagina.forEach((parrafo) => {
    const p = document.createElement("p");
    p.className = "paragraph";

    const palabras = (parrafo.de || "").trim().split(/\s+/);

    palabras.forEach((palabraTexto) => {
      if (!palabraTexto) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "word-btn";
      btn.textContent = palabraTexto;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        mostrarTraduccion(btn, palabraTexto, parrafo.es, historiaActual.vocabulario);
      });
      p.appendChild(btn);
      p.appendChild(document.createTextNode(" "));
    });

    if (parrafo.es) {
      const spanES = document.createElement("span");
      spanES.className = mostrarFrasesES ? "sentence-es" : "sentence-es hidden";
      spanES.textContent = parrafo.es;
      p.appendChild(spanES);
    }

    els.contenidoHistoria.appendChild(p);
  });

  actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
  els.pageIndicator.textContent = `Página ${paginaActual + 1} / ${totalPaginas}`;
  els.btnPrevPage.disabled = paginaActual <= 0;
  els.btnNextPage.disabled = paginaActual >= totalPaginas - 1;
}

function irAPagina(nuevaPagina) {
  if (!historiaActual) return;
  if (nuevaPagina < 0 || nuevaPagina >= totalPaginas) return;
  paginaActual = nuevaPagina;
  renderPagina();
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

els.btnPrevPage.addEventListener("click", () => irAPagina(paginaActual - 1));
els.btnNextPage.addEventListener("click", () => irAPagina(paginaActual + 1));

document.addEventListener("keydown", (e) => {
  if (els.vistaLectura.classList.contains("hidden")) return;
  if (e.key === "ArrowLeft") irAPagina(paginaActual - 1);
  if (e.key === "ArrowRight") irAPagina(paginaActual + 1);
});

els.btnBack.addEventListener("click", () => {
  cerrarSheet();
  historiaActual = null;
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