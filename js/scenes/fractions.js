import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";
import { unlockGame } from "../engine/gameState.js";

let tubes = [];

let animationId = null;

let spawnTimer = null;

let targetStart = 12;
let targetEnd = 16;

let score = 0;
let mistakes = 0;

export function showFractionsGame() {
    let html = `
    <div class="screen">
    <div class="panel">
    <h1>COLLECT FRACTIONS</h1>
    <p class="subtitle">
    collect every fraction between ${targetStart} and ${targetEnd}.
    </p>
    <div class="chemical-grid">
    `;

    html += `
    <div class="navigation">
    <button id="backButton">
    BACK
    </button>
    </div>
    </div>
    </div>
    `;

    showScene(html);
    document
        .getElementById("backButton")
        .addEventListener("click", () => {
            setScene(showMenu);
        });
}

function spawnTube() {

    const number = Math.floor(Math.random() * 25) + 1;

    const tube = document.createElement("div");

    tube.className = "fraction-tube";

    tube.textContent = number;

    tube.style.left = "-40px";

    tube.style.top =
        (40 + Math.random() * 180) + "px";

    document
        .getElementById("fractionArea")
        .appendChild(tube);

    tubes.push({

        element: tube,
        number: number,
        x: -40,
        y: parseFloat(tube.style.top)

    });

}

function animate() {

    for (const tube of tubes) {

        tube.x += 2.5;

        tube.element.style.left = tube.x + "px";

    }

    animationId = requestAnimationFrame(animate);

}