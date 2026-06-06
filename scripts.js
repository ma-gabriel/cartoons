import shows_full from "./shows.json" with { type: "json" };

const button = document.getElementById("guess-btn");
const input = document.getElementById("guess-input");
const tbody = document.getElementById("guess-table")?.lastElementChild;
const tr =
  document.getElementById("guess-table")?.firstElementChild?.firstElementChild;
const predictions = document.getElementById("input-predictions");
const popUp = document.getElementById("win-popup");
const overlay = document.getElementById("overlay");

if (!(button && input && tbody && tr && predictions && popUp && overlay)) {
  alert("broken js, ask geymat for repairs please");
  throw "";
}

let shows = shows_full.slice();
let answer;
let answerTrimmed;
let day = new Date().getUTCDate() - 6; // works only for june, days since launch
let mode;
let selectedPrediction = -1;
let predictionsList = [];
setUpNewGame(location.hash === "#/unlimited" ? "unlimited" : "daily");

function getTodaysShow() {
  const candidates = [
    216, 396, 55138, 555, 3134, 6489, 83, 672, 35073, 713, 37196, 184, 45148,
  ];
  return shows.find((show) => show.id === candidates[day]);
}

function isEqual(elem1, elem2, category) {
  if (category === "genres")
    return !(
      elem1.genres.length !== elem2.genres.length ||
      elem1.genres.some((e, i) => elem2.genres[i] !== e)
    );
  return elem1[category] === elem2[category];
}

function trimShow(show) {
  return {
    name: show.name,
    image: show.image.medium,
    year: String(new Date(show.premiered).getFullYear()),
    ended: show.status,
    network: show.network?.name ?? show.webChannel?.name,
    genres: show.genres.sort(),
    rating: String(show.rating.average),
  };
}

function generateTd(value, style = null) {
  const elem = document.createElement("td");
  elem.innerText = value;
  if (style) elem.className = style;
  return elem;
}

function getGuessesCookie() {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("guesses="))
      ?.split("=")[1] || "[]"
  );
}
function generateTdPicture(src, style = null) {
  const elem = document.createElement("td");
  const img = document.createElement("img");
  img.style.maxHeight = "100%";
  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.width = "auto";
  img.style.borderRadius = "10px";
  elem.style.padding = "0px";
  if (style) elem.className = style;
  img.src = src;
  elem.append(img);
  return elem;
}

function generateTr(_guess, _answer) {
  function upDownNone(a, b) {
    if (a > b) return " ↑";
    if (a < b) return " ↓";
    return "";
  }
  const elem = document.createElement("tr");
  elem.appendChild(
    generateTd(_guess.name, _guess.name === _answer.name ? "correct" : null),
  );
  elem.appendChild(
    generateTdPicture(
      _guess.image,
      _guess.image === _answer.image ? "correct" : null,
    ),
  );
  elem.appendChild(
    generateTd(
      _guess.year + upDownNone(_answer.year, _guess.year),
      _guess.year === _answer.year
        ? "correct"
        : Math.abs(_guess.year - _answer.year) < 3
          ? "close"
          : "wrong",
    ),
  );
  elem.appendChild(
    generateTd(
      _guess.ended,
      _guess.ended === _answer.ended ? "correct" : "wrong",
    ),
  );
  elem.appendChild(
    generateTd(
      _guess.network,
      _guess.network === _answer.network ? "correct" : "wrong",
    ),
  );
  elem.appendChild(
    generateTd(
      String(_guess.genres),
      isEqual(_guess, _answer, "genres")
        ? "correct"
        : _guess.genres.some((item) => answer.genres.includes(item))
          ? "close"
          : "wrong",
    ),
  );
  elem.appendChild(
    generateTd(
      _guess.rating + upDownNone(_answer.rating, _guess.rating),
      _guess.rating === _answer.rating
        ? "correct"
        : Math.abs(_guess.rating - _answer.rating) < 0.5
          ? "close"
          : "wrong",
    ),
  );
  return elem;
}

function updateInfos(_guess) {
  let elem = tr.firstElementChild;
  let categories = [
    "name",
    "image",
    "year",
    "ended",
    "network",
    "genres",
    "rating",
  ];
  let i = 0;
  while (elem) {
    if (
      elem.dataset.found === undefined &&
      isEqual(_guess, answerTrimmed, categories[i])
    ) {
      elem.dataset.found === "true";
      elem.classList.add("found");
      function filterCategory(i) {
        return (e) => {
          e.target.classList.remove("found");
          e.target.classList.add("filtered");
          shows = shows.filter(
            (show) =>
              trimShow(show)[categories[i]] === answerTrimmed[categories[i]],
          );
        };
      }
      elem.addEventListener("click", filterCategory(i));
      if (categories[i] !== "image") elem.innerText = _guess[categories[i]];
    }
    i++;
    elem = elem.nextElementSibling;
  }
}

function makeWinPopUp() {
  popUp.classList.remove("hidden");
  overlay.classList.remove("hidden");
  let elem = popUp.firstElementChild.nextElementSibling;
  if (answer.officialSite)
    elem.firstElementChild.firstElementChild.href = answer.officialSite;
  elem.firstElementChild.firstElementChild.innerText = answer.name;
  elem = elem.nextElementSibling;
  elem.src = answer.image.original;
  elem = elem.nextElementSibling;
  elem.innerHTML = answer.summary;
}

function generateGuess(guess) {
  if (mode === "daily") {
    const value = JSON.parse(getGuessesCookie());
    value.push(guess.id);
    document.cookie =
      "guesses=" +
      JSON.stringify(value) +
      "; expires=" +
      new Date(Date.UTC(2026, 5, day + 6, 23, 59, 59)).toString() +
      "; path=/";
  }
  resetPrediction();
  shows.splice(shows.indexOf(guess), 1);
  input.value = "";
  if (answer === guess) {
    makeWinPopUp();
  }
  const show_trimmed = trimShow(guess);
  tbody.insertBefore(generateTr(show_trimmed, answerTrimmed), tbody.firstChild);
  updateInfos(show_trimmed, answerTrimmed);
}

button.addEventListener("click", () => {
  const guess = input.value.toLowerCase();
  const found = shows.find((show) => show.name.toLowerCase() == guess);
  if (!found) return;
  generateGuess(found);
});

function displayShow(show) {
  const elem = document.createElement("span");
  elem.style.height = "100px";
  elem.style.display = "flex";
  elem.style.alignItems = "center";
  elem.style.gap = "10px";
  elem.style.width = "500px";
  elem.style.background = "#424242";
  elem.style.borderRadius = "10px";
  elem.style.border = "2px solid #2d778dff";
  elem.style.padding = "10px";
  elem.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  elem.style.color = "#E0E0E0";
  elem.style.transition = "background 0.3s";
  elem.addEventListener("mouseenter", () => {
    elem.style.background = "#575757";
  });
  elem.addEventListener("mouseleave", () => {
    elem.style.background = "#424242";
  });
  elem.addEventListener("click", () => generateGuess(show));

  const img = document.createElement("img");
  img.src = show.image.medium;
  img.style.maxHeight = "80%";
  img.style.maxWidth = "80%";
  img.style.height = "auto";
  img.style.width = "auto";
  img.style.borderRadius = "10px";
  elem.append(img);

  const p = document.createElement("p");
  p.innerText = show.name;
  p.style.marginTop = "10px";
  p.style.fontSize = "16px";
  p.style.textAlign = "center";
  p.style.fontWeight = "bold";
  elem.append(p);

  return elem;
}

function resetPrediction() {
  selectedPrediction = -1;
  predictions.innerHTML = "";
  predictionsList = [];
}

function launchPrediction() {
  resetPrediction();
  if (!input.value) return;
  predictionsList = shows
    .filter((show) =>
      show.name.toLowerCase().includes(input.value.toLowerCase()),
    )
    .sort((showA, showB) => showA.name > showB.name)
    .slice(0, 1000);
  predictionsList.forEach((show) => predictions.appendChild(displayShow(show)));
}
input.addEventListener("input", launchPrediction);

input.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    event.preventDefault();
    button.click();
  } else if (event.code === "ArrowDown") {
    event.preventDefault();
    if (predictionsList.length > selectedPrediction + 1) {
      selectedPrediction++;
      input.value = predictionsList[selectedPrediction].name;
    }
  } else if (event.code === "ArrowUp") {
    event.preventDefault();
    if (selectedPrediction > 0) {
      selectedPrediction--;
      input.value = predictionsList[selectedPrediction].name;
    }
  }
});

function resetOldGame() {
  input.value = "";
  tbody.innerHTML = "";
  tr.innerHTML = `<th>Show</th><th>Poster</th><th>year of release</th><th>still running</th><th>network</th><th>genres</th><th>average rating</th>`;
  resetPrediction();
}

function setUpNewGame(gamemode) {
  resetOldGame();
  day = new Date().getUTCDate() - 6;
  if (gamemode === "unlimited") {
    location.hash = "#/unlimited";
    answer = shows[Math.floor(Math.random() * shows.length)];
    answerTrimmed = trimShow(answer);
    mode = "unlimited";
    return;
  }
  location.hash = "#/daily";
  answer = getTodaysShow();
  answerTrimmed = trimShow(answer);
  mode = "refreshing";
  JSON.parse(getGuessesCookie()).forEach((guess) =>
    generateGuess(shows.find((show) => show.id == guess)),
  );
  mode = "daily";
}
