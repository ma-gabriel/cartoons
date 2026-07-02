import shows_full from "./shows.json" with { type: "json" };

const button = document.getElementById("guess-btn");
const input = document.getElementById("guess-input");
const tbody = document.getElementById("guess-table")?.lastElementChild;
const tr =
  document.getElementById("guess-table")?.firstElementChild?.firstElementChild;
const predictions = document.getElementById("input-predictions");
const popUp = document.getElementById("win-popup");
const overlay = document.getElementById("overlay");
const modeSection = document.getElementById("mode-section");

if (
  !(button && input && tbody && tr) ||
  !(predictions && popUp && overlay && modeSection)
) {
  alert("broken js, ask geymat for repairs please");
  throw "";
}

function getTommorowMidnightUTC() {
  const midnight = new Date();
  midnight.setDate((new Date()).getDate() + 1);
  midnight.setUTCHours(0);
  midnight.setUTCMinutes(0);
  midnight.setUTCSeconds(0);
  midnight.setUTCMilliseconds(0);
  return midnight;
}
setInterval(function () {
  const now = new Date();
  const midnight = getTommorowMidnightUTC();
  const time = (midnight - now) / 1000;
  if (time < 0) modeSection.nextElementSibling.innerText = "Next Daily out";
  else
    modeSection.nextElementSibling.innerText = `Next Daily in ${Math.floor(time / 3600)} hours ${Math.floor((time % 3600) / 60)} minutes`;
}, 1000);

let shows = shows_full.slice();
let answer;
let answerTrimmed;
let day = getDaysSinceStart();
let mode;
let selectedPrediction = -1;
let predictionsList = [];
setUpNewGame(location.hash === "#/endless" ? "endless" : "daily");

function getTodaysShow() {
  return shows[((day + 1) * 2147483647) % shows.length];
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

function isSimilarNetwork(network1, network2) {
  if (network1 === "Disney XD" && ["Disney Channel"].includes(network2))
    return true;
  if (network1 === "Disney Channel" && ["Disney XD"].includes(network2))
    return true;
  return false;
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
        : Math.abs(_guess.year - _answer.year) <= 3
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
      _guess.network === _answer.network
        ? "correct"
        : isSimilarNetwork(_guess.network, _answer.network)
          ? "close"
          : "wrong",
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
        : Math.abs(_guess.rating - _answer.rating) <= 0.5
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

function goToEndless() {
  location.hash = "#/endless";
  setUpNewGame("endless");
}
function goToDaily() {
  location.hash = "#/daily";
  setUpNewGame("daily");
}
function giveUp() {
  generateGuess(answer);
}
function retry() {
  setUpNewGame("endless");
}
function makeWinModeSection(which) {
  function clearEvent() {
    modeSection.firstElementChild.removeEventListener("click", goToEndless);
    modeSection.firstElementChild.removeEventListener("click", giveUp);
    modeSection.firstElementChild.removeEventListener("click", retry);
    modeSection.nextElementSibling.removeEventListener("click", goToDaily);
  }
  if (!["hidden", "endless", "give up", "retry"].includes(which)) {
    alert(
      "makeWinModeSection function received wrong argument, contact geymat if happened",
    );
    throw 0;
  }
  if (which === "hidden") {
    modeSection.classList.add("hidden");
    modeSection.nextElementSibling.style.cursor = "default";
    return;
  }
  if (which === "endless") {
    modeSection.classList.remove("hidden");
    modeSection.firstElementChild.innerText = "endless mode";
    modeSection.lastElementChild.innerText =
      "The endless mode is harder due to the answer being random (unlike the daily that has famous answer until july 3rd), but you still have as many guess as you want";
    clearEvent();
    modeSection.firstElementChild.addEventListener("click", goToEndless);
    modeSection.nextElementSibling.style.cursor = "default";
    return;
  }
  if (which === "give up") {
    modeSection.classList.remove("hidden");
    modeSection.firstElementChild.innerText = "give up";
    modeSection.lastElementChild.innerText =
      "Want the answer ? For free ? In this economy ?";
    clearEvent();
    modeSection.firstElementChild.addEventListener("click", giveUp);
    modeSection.nextElementSibling.style.removeProperty("cursor");
    modeSection.nextElementSibling.addEventListener("click", goToDaily);
    return;
  }
  if (which === "retry") {
    modeSection.classList.remove("hidden");
    modeSection.firstElementChild.innerText = "new game";
    modeSection.lastElementChild.innerText = "Not called endless for no reason";
    clearEvent();
    modeSection.firstElementChild.addEventListener("click", retry);
    modeSection.nextElementSibling.style.removeProperty("cursor");
    modeSection.nextElementSibling.addEventListener("click", goToDaily);
    return;
  }
}

function makeWinPopUp() {
  popUp.classList.remove("hidden");
  overlay.classList.remove("hidden");
  let elem = popUp.firstElementChild.nextElementSibling;
  elem.firstElementChild.firstElementChild.removeAttribute("href");
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
    document.cookie = `guesses=${JSON.stringify(value)}; expires=${getTommorowMidnightUTC().toString()}; path=${location.path}`;
  }
  resetPrediction();
  shows.splice(shows.indexOf(guess), 1);
  input.value = "";
  if (answer === guess) {
    makeWinModeSection(
      ["refreshing", "daily"].includes(mode) ? "endless" : "retry",
    );
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
  shows = shows_full.slice();
  day = getDaysSinceStart();
  if (gamemode === "endless") {
    location.hash = "#/endless";
    makeWinModeSection("give up");
    answer = shows[Math.floor(Math.random() * shows.length)];
    answerTrimmed = trimShow(answer);
    mode = "unlimited";
    return;
  }
  makeWinModeSection("hidden");
  location.hash = "#/daily";
  answer = getTodaysShow();
  answerTrimmed = trimShow(answer);
  mode = "refreshing";
  JSON.parse(getGuessesCookie()).forEach((guess) =>
    generateGuess(shows.find((show) => show.id == guess)),
  );
  mode = "daily";
}

function getDaysSinceStart() {
  const today = new Date();
  const start = new Date("2026-06-08");
  const timeDiff = today - start;
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return dayDiff;
}
