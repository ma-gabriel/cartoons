import shows_full from "./shows.json" with { type: "json" };
let shows = shows_full.slice();
const answer = shows[Math.floor(Math.random() * shows.length)];
window.answer = answer;
window.shows = shows_full;

const button = document.getElementById("guess-btn");
const input = document.getElementById("guess-input");
const tbody = document.getElementById("guess-table")?.lastElementChild;
const tr =
  document.getElementById("guess-table")?.firstElementChild?.firstElementChild;
const predictions = document.getElementById("input-predictions");

if (!(button && input && tbody && tr && predictions)) {
  alert("broken js, repair please");
  throw "";
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

const answerTrimmed = trimShow(answer);
function generateGuess(guess) {
  predictions.innerHTML = "";
  shows.splice(shows.indexOf(guess), 1);
  input.value = "";
  if (answer == guess) {
    alert("lol you won");
  }
  const show_trimmed = trimShow(guess);
  tbody.insertBefore(
    generateTr(show_trimmed, answerTrimmed),
    tbody.firstChild,
  );
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

function launchPrediction() {
  predictions.innerHTML = "";
  if (!input.value) return;
  shows
    .filter((show) =>
      show.name.toLowerCase().includes(input.value.toLowerCase()),
    )
    .sort((showA, showB) => showA.name > showB.name)
    .slice(0, 1000)
    .forEach((show) => predictions.appendChild(displayShow(show)));
}
input.addEventListener("input", launchPrediction);

input.addEventListener("keydown", (event) => {
  if (event.code === "Enter") button.click();
});
