import shows from "./shows.json" with { type: "json" };

const answer = shows[Math.floor(Math.random() * shows.length)]; 

const button = document.getElementById("guess-btn");
const input = document.getElementById("guess-input");
const tbody = document.getElementById("guess-table")?.lastElementChild;

if (!(button && input && tbody)) {
  alert("broken js, repair please");
  throw "";
}

function trim_show(show) {
    return {
        name: show.name,
        year: String((new Date(show.premiered)).getFullYear()),
        ended: show.status,
        network: show.network?.name ?? show.webChannel?.name,
        genres: show.genres.sort(),
        rating: String(show.rating.average),
    }
}

function generate_td(value, style=null) {
    const elem = document.createElement("td");
    elem.innerText = value;
    if (style) elem.className = style;
    return  elem;
}

function generate_tr(_guess, _answer) {
    const elem = document.createElement("tr")
    elem.appendChild(generate_td(_guess.name, _guess.name === _answer.name ? "correct" : null))
    elem.appendChild(generate_td(_guess.year, _guess.year === _answer.year ? "correct" : "wrong" ))
    elem.appendChild(generate_td(_guess.ended, _guess.ended === _answer.ended ? "correct" : "wrong"))
    elem.appendChild(generate_td(_guess.network, _guess.network === _answer.network ? "correct" : "wrong"))
    elem.appendChild(generate_td(String(_guess.genres), !(_guess.genres.length !== _answer.genres.length || _guess.genres.some((e, i) => answer.genres[i] !== e)) ? "correct" : "wrong"))
    elem.appendChild(generate_td(_guess.rating, _guess.rating === _answer.rating ? "correct" : "wrong"))
    return elem;
}

const answer_trimmed = trim_show(answer);
function generate_guess(guess) {
    if (answer == guess) {
        alert("lol you won");
        //return ;
    }
    return generate_tr(trim_show(guess), answer_trimmed);
}

button.addEventListener("click", () => {
  const guess = input.value.toLowerCase();
  if (!shows.find((show) => show.name.toLowerCase() == guess)) return;
  input.value = "";
  tbody.appendChild(generate_guess(shows.find((show) => show.name.toLowerCase() == guess)));
});
