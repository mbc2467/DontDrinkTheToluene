import { minigames } from "../data/minigames.js";
import { getCharacter } from "../engine/gameState.js";
import { showScene} from "../engine/sceneManager.js";
import { showTitle } from "./title.js";

import { setScene } from "../engine/sceneManager.js";
import { showCharacterSelect } from "./characterSelect.js";

import { showBufferGame } from "./buffer.js";
import { showGlasswareGame } from "./glassware.js";

import { showSECGame } from "./sec.js";

function createExperimentCard(game) {
    console.log("Creating experiment card");
    return `
        <div
            class="experiment-card ${game.unlocked ? "" : "locked"}"
            data-id="${game.id}">

            <div class="experiment-code">
                ${game.code}
            </div>

            <div class="experiment-title">
                ${game.title}
            </div>

            <div class="experiment-status">
                STATUS: ${game.status}
            </div>

        </div>
    `;
}

export function showMenu() {

    let html = `
        <div class="screen">

            <div class="panel">

                <h1>SELECT EXPERIMENT</h1>

                <p class="subtitle">
                    Choose today's laboratory task.
                </p>

                <div class="experiment-grid">
    `;

    for (const game of minigames) {
        html += createExperimentCard(game);
    }

    html += `
                </div>

                <div class="navigation">

                    <button id="backButton">
                        < BACK
                    </button>

                    <button id="homeButton">
                        HOME >
                    </button>

                </div>

            </div>

        </div>
    `;

    showScene(html);

    document
        .getElementById("backButton")
        .addEventListener("click", () => {
            setScene(showCharacterSelect);
            console.log("Back button clicked");
        });

    document
        .getElementById("homeButton")
        .addEventListener("click", () => {
            setScene(showTitle);
        });

    document
        .querySelectorAll(".experiment-card")
        .forEach(card => {

            if (card.classList.contains("locked"))
                return;

            card.addEventListener("click", () => {

                const id = card.dataset.id;

                switch (id) {
                    case "buffer":
                        if (getCharacter() === "michael") {
                            setScene(showGlasswareGame);
                        } else {
                            setScene(showBufferGame);
                        }
                        break;
                    // Future minigames
                    case "sec":
                        setScene(showSECGame);
                        break;
                    case "ls":
                        console.log("Light Scattering");
                        break;
                    case "iec":
                        console.log("IEC");
                        break;
                }

            });

        });

}