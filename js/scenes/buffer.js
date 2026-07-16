import { showScene, goBack } from "../engine/sceneManager.js";

import { buffers } from "../data/buffers.js";
import { chemicals } from "../data/chemicals.js";

import { showToluenePrompt } from "./toluenePrompt.js";
import { showTolueneGameOver } from "./tolueneGameOver.js";

let currentBuffer = null;
let selectedChemicals = [];
let toluenePromptShown = false;

export function showBufferGame() {
    currentBuffer = randomBuffer();
    selectedChemicals = [];
    toluenePromptShown = false;
    const shuffledChemicals = shuffle(chemicals);
    let html = `
    <div class="screen">
    <div class="panel">
    <h1>MAKE BUFFER</h1>
    <p class="subtitle">
    ${currentBuffer.name}
    ${currentBuffer.subtitle}
    </p>
    <p>
    Select every chemical needed.
    </p>
    <div class="chemical-grid">
    `;

    for (const chemical of shuffledChemicals) {

        html += `

            <div
                class="chemical-card"
                data-name="${chemical}">

                ${chemical}

            </div>

        `;

    }

    html += `
    </div>
    <p id="selectedCount">
        Selected: 0/${currentBuffer.ingredients.length}
    </p>
    <div class="navigation">
    <button id="backButton">
    BACK
    </button>
    <button id="finishButton">
    FINISH
    </button>
    </div>
    </div>
    </div>
    `;

    showScene(html);

    document
    .querySelectorAll(".chemical-card")
    .forEach(card => {

        card.addEventListener("click", () => {

            const chemical = card.dataset.name;
            if (chemical === "Toluene" && !toluenePromptShown) {
                toluenePromptShown = true;
                showToluenePrompt(
                    () => {
                        showTolueneGameOver();
                    },
                    () => {
                        selectedChemicals.push("Toluene");
                        card.classList.add("selected");
                        updateSelectedCount();
                    }
                );
                return;
            }
            if (selectedChemicals.includes(chemical)) {
                selectedChemicals = selectedChemicals.filter(c => c !== chemical);
                card.classList.remove("selected");
                if(chemical === "Toluene") {
                    toluenePromptShown = false;
                }
            } else {
                selectedChemicals.push(chemical);
                card.classList.add("selected");

            }
            updateSelectedCount();
        });
    });

    document.getElementById("selectedCount").textContent = `Selected: ${selectedChemicals.length}`;
    document.getElementById("finishButton").addEventListener("click", finishBufferGame);

    document.getElementById("backButton").addEventListener("click", goBack);
}

function randomBuffer() {
    return buffers[Math.floor(Math.random() * buffers.length)];
}

function updateSelectedCount() {

    document.getElementById("selectedCount").textContent =
        `Selected: ${selectedChemicals.length}/${currentBuffer.ingredients.length}`;

}

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function finishBufferGame() {

    const required = currentBuffer.ingredients;

    const missing = required.filter(
        chemical => !selectedChemicals.includes(chemical)
    );

    const extra = selectedChemicals.filter(
        chemical => !required.includes(chemical)
    );

    if (missing.length === 0 && extra.length === 0) {

        showBufferWin();

    } else {

        showBufferFail(missing, extra);

    }

}

function showBufferWin() {

    showScene(`

        <div class="screen">

            <div class="panel">

                <h1>BUFFER COMPLETE</h1>

                <p>
                    Perfect recipe!
                </p>

                <button id="menuButton">
                    RETURN TO MENU
                </button>

            </div>

        </div>

    `);

    document
        .getElementById("menuButton")
        .addEventListener("click", goBack);

}

function showBufferFail(missing, extra) {

    let html = `

        <div class="screen">

            <div class="panel">

                <h1>BUFFER FAILED</h1>

    `;

    if (missing.length > 0) {

        html += `

            <h2>Missing</h2>

            <ul>

        `;

        for (const chemical of missing) {

            html += `<li>${chemical}</li>`;

        }

        html += `</ul>`;
    }

    if (extra.length > 0) {

        html += `

            <h2>Extra</h2>

            <ul>

        `;

        for (const chemical of extra) {

            html += `<li>${chemical}</li>`;

        }

        html += `</ul>`;
    }

    html += `

            <button id="retryButton">

                TRY AGAIN

            </button>

        </div>

    </div>

    `;

    showScene(html);

    document
        .getElementById("retryButton")
        .addEventListener("click", showBufferGame);

}