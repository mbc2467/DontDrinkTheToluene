import { showScene, setScene } from "../engine/sceneManager.js";
import { characters } from "../data/characters.js";
import { showMenu } from "./menu.js";
import { setCharacter } from "../engine/gameState.js";
import { showTitle } from "./title.js";

let selectedCharacter = null;

function createCharacterCard(character) {
    return `
        <div class="character-card ${character.unlocked ? "" : "locked"}"
             data-id="${character.id}">

            <div class="portrait">
                <span>Portrait</span>
                <small>Coming Soon</small>
            </div>

            <div class="character-info">

                <h2>${character.name}</h2>

                <p>${character.title}</p>

                <p>${character.description}</p>

            </div>

        </div>
    `;
}

export function showCharacterSelect() {

    let html = `
        <div class="character-panel">

            <h1>Select Character</h1>

            <div class="character-grid">

    `;

    for (const character of characters) {
        html += createCharacterCard(character);
    }

    html += `

        </div>
        <div class="navigation">
        <button id="backButton">
        BACK
        </button>
        <button id="nextButton" disabled>
            Next
        </button>

        </div>
    `;

    showScene(html);

    document
        .querySelectorAll(".character-card")
        .forEach(card => {

            if (card.classList.contains("locked"))
                return;

            card.addEventListener("click", () => {

                document
                    .querySelectorAll(".character-card")
                    .forEach(c => c.classList.remove("selected"));

                card.classList.add("selected");

                setCharacter(card.dataset.id);

                document.getElementById("nextButton").disabled = false;

            });

        });

    document
        .getElementById("nextButton")
        .addEventListener("click", () => {
            setScene(showMenu);
        });
    document
        .getElementById("backButton")
        .addEventListener("click", () => {
            setScene(showTitle);
        });

}