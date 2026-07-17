import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";
import { unlockGame } from "../engine/gameState.js";
import { tolueneSprite } from "../data/sprites.js";

const TOTAL_TUBES = 14;
const SPAWN_INTERVAL_MS = 900;
const TUBE_SPEED = 2.5;

let tubes = [];
let spawnQueue = [];

let animationId = null;
let spawnTimer = null;

let targetStart = 12;
let targetEnd = 16;

let score = 0;
let mistakes = 0;
let targetsCollected = 0;
let targetsTotal = 0;

let gameOver = false;

export function showFractionsGame() {

    // reset all per-run state - showFractionsGame can be called again
    // for a retry, so nothing here can be left over from last time.
    tubes = [];
    spawnQueue = [];
    score = 0;
    mistakes = 0;
    targetsCollected = 0;
    gameOver = false;

    const targets = [];

    for (let n = targetStart; n <= targetEnd; n++) {
        targets.push(n);
    }

    targetsTotal = targets.length;

    const decoyCount = Math.max(TOTAL_TUBES - targets.length, 0);
    const decoys = [];

    while (decoys.length < decoyCount) {

        const n = Math.floor(Math.random() * 25) + 1;

        if (n < targetStart || n > targetEnd) {
            decoys.push(n);
        }

    }

    spawnQueue = shuffled([...targets, ...decoys]);

    const html = `
    <div class="screen">
    <div class="panel">

    <h1>COLLECT FRACTIONS</h1>

    <p class="subtitle">
        Collect every fraction between ${targetStart} and ${targetEnd}.
        Leave the rest.
    </p>

    <div class="fraction-hud">
        <span id="fractionScore">Collected: 0 / ${targetsTotal}</span>
        <span id="fractionMistakes">Mistakes: 0</span>
    </div>
    <div class=panel>
        <div id="fractionArea" class="chemical-grid"></div>
    </div>
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
            stopGame();
            setScene(showMenu);
        });

    startGame();

}

function shuffled(array) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;

}

function startGame() {

    spawnTimer = setInterval(spawnTube, SPAWN_INTERVAL_MS);
    animationId = requestAnimationFrame(animate);

}

function stopGame() {

    if (spawnTimer) {
        clearInterval(spawnTimer);
        spawnTimer = null;
    }

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

}

function spawnTube() {

    if (spawnQueue.length === 0) {

        clearInterval(spawnTimer);
        spawnTimer = null;
        return;

    }

    const number = spawnQueue.shift();

    const tube = document.createElement("div");

    tube.className = "fraction-tube";
    tube.textContent = number;
    tube.style.left = "-40px";
    tube.style.top = (40 + Math.random() * 180) + "px";

    const entry = {
        element: tube,
        number: number,
        x: -40,
        resolved: false
    };

    tube.addEventListener("click", () => handleTubeClick(entry));

    document
        .getElementById("fractionArea")
        .appendChild(tube);

    tubes.push(entry);

}

function animate() {

    const area = document.getElementById("fractionArea");

    // scene was torn down without going through stopGame - bail out
    // quietly instead of looping forever against a dead DOM.
    if (!area) {
        return;
    }

    const limit = area.clientWidth + 40;

    for (const entry of [...tubes]) {

        entry.x += TUBE_SPEED;
        entry.element.style.left = entry.x + "px";

        if (!entry.resolved && entry.x > limit) {
            missTube(entry);
        }

    }

    animationId = requestAnimationFrame(animate);

}

function handleTubeClick(entry) {

    if (entry.resolved || gameOver) {
        return;
    }

    entry.resolved = true;

    const isTarget = isInRange(entry.number);

    if (isTarget) {

        score++;
        targetsCollected++;
        entry.element.classList.add("correct");

    } else {

        mistakes++;
        entry.element.classList.add("incorrect");

    }

    updateHud();

    // brief flash of correct/incorrect state before the tube vanishes
    setTimeout(() => removeTube(entry), 200);

    checkGameEnd();

}

function missTube(entry) {

    entry.resolved = true;

    if (isInRange(entry.number)) {
        mistakes++;
    }

    updateHud();
    removeTube(entry);
    checkGameEnd();

}

function removeTube(entry) {

    entry.element.remove();
    tubes = tubes.filter(t => t !== entry);

}

function isInRange(number) {

    return number >= targetStart && number <= targetEnd;

}

function updateHud() {

    const scoreEl = document.getElementById("fractionScore");
    const mistakesEl = document.getElementById("fractionMistakes");

    if (scoreEl) {
        scoreEl.textContent = `Collected: ${targetsCollected} / ${targetsTotal}`;
    }

    if (mistakesEl) {
        mistakesEl.textContent = `Mistakes: ${mistakes}`;
    }

}

function checkGameEnd() {

    if (gameOver) {
        return;
    }

    if (spawnQueue.length === 0 && tubes.length === 0) {

        gameOver = true;
        stopGame();

        const passed = targetsCollected === targetsTotal && mistakes === 0;

        showResult(passed);

    }

}

function showResult(passed) {

    const nav = document.querySelector(".navigation");

    if (passed) {

        unlockGame("fractions");

        nav.innerHTML = `
            <p class="result-message">All fractions collected!</p>
            <button id="menuButton">
                RETURN TO MENU
            </button>
        `;

    } else {

        nav.innerHTML = `
            <p class="result-message">
                Collected ${targetsCollected} / ${targetsTotal}, ${mistakes} mistake(s).
            </p>
            <button id="retryButton">
                TRY AGAIN
            </button>
            <button id="menuButton">
                RETURN TO MENU
            </button>
        `;

        document
            .getElementById("retryButton")
            .addEventListener("click", () => {
                setScene(showFractionsGame);
            });

    }

    document
        .getElementById("menuButton")
        .addEventListener("click", () => {
            setScene(showMenu);
        });

}