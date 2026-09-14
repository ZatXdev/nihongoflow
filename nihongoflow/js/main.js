// Ce script cherche un conteneur avec l'attribut data-kana-source sur la page.
// S'il le trouve, il va chercher le bon fichier JSON et construit la grille.
// Comme ça, hiragana.html ET katakana.html peuvent réutiliser exactement
// la même fonction : seul le fichier JSON chargé change.

// Le tableau classique du gojūon : 5 colonnes (voyelles a/i/u/e/o),
// une ligne par consonne. "" = case qui n'existe pas dans la langue
// (ex: pas de "yi" ni de "ye"), elle doit rester vide mais garder sa place.
const GOJUON_LAYOUT = [
  ["a", "i", "u", "e", "o"],
  ["ka", "ki", "ku", "ke", "ko"],
  ["sa", "shi", "su", "se", "so"],
  ["ta", "chi", "tsu", "te", "to"],
  ["na", "ni", "nu", "ne", "no"],
  ["ha", "hi", "fu", "he", "ho"],
  ["ma", "mi", "mu", "me", "mo"],
  ["ya", "", "yu", "", "yo"],
  ["ra", "ri", "ru", "re", "ro"],
  ["wa", "", "", "", "wo"],
  ["n", "", "", "", ""],
];

async function loadKanaGrid() {
  const container = document.querySelector("[data-kana-source]");

  // Si la page n'a pas de grille de kana (ex: la page d'accueil), on arrête là.
  if (!container) return;

  const source = container.getAttribute("data-kana-source");
  const layout = container.getAttribute("data-layout");

  try {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(`Réponse HTTP ${response.status}`);
    }

    const kanaList = await response.json();

    if (layout === "gojuon") {
      renderGojuonGrid(container, kanaList);
    } else {
      renderKanaGrid(container, kanaList);
    }
  } catch (error) {
    console.error("Impossible de charger les kana :", error);
    container.textContent = "Erreur de chargement des kana.";
  }
}

// Affichage simple : un kana après l'autre, dans l'ordre du JSON.
// (utilisé si une page ne précise pas data-layout="gojuon")
function renderKanaGrid(container, kanaList) {
  container.innerHTML = "";

  for (const item of kanaList) {
    container.appendChild(buildTile(item));
  }
}

// Affichage "tableau des gojūon" : chaque kana est replacé à sa vraie
// case (ligne/colonne), y compris les cases vides, grâce à GOJUON_LAYOUT.
function renderGojuonGrid(container, kanaList) {
  container.innerHTML = "";

  // On construit une table de correspondance romaji -> kana pour
  // retrouver rapidement le bon caractère à chaque case du tableau.
  const byRomaji = {};
  for (const item of kanaList) {
    byRomaji[item.romaji] = item;
  }

  GOJUON_LAYOUT.forEach((row, rowIndex) => {
    row.forEach((romaji, colIndex) => {
      // Case vide (pas de son à cet endroit du tableau) : on ne crée rien,
      // mais la grille CSS garde quand même la place grâce à grid-row/grid-column.
      if (romaji === "") return;

      const item = byRomaji[romaji];
      if (!item) return; // sécurité si le JSON ne contient pas ce romaji

      const tile = buildTile(item);
      tile.style.gridRow = rowIndex + 1;
      tile.style.gridColumn = colIndex + 1;
      container.appendChild(tile);
    });
  });
}

function buildTile(item) {
  const tile = document.createElement("div");
  tile.className = "kana-tile";

  tile.innerHTML = `
    <span class="kana">${item.kana}</span>
    <span class="romaji">${item.romaji}</span>
  `;

  return tile;
}

loadKanaGrid();
