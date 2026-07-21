import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";
import { unlockGame } from "../engine/gameState.js";
import { fractionSprite, tolueneSprite } from "../data/sprites.js";

import { showToluenePrompt } from "./toluenePrompt.js";
import { showTolueneGameOver } from "./tolueneGameOver.js";

const TOTAL_TUBES = 18;
const SPAWN_INTERVAL_MS = 900;
const TUBE_SPEED = 1.0;

// bounds for the numbers that can appear at all, and how big the
// "collect this range" target window can be on any given run
const RANGE_MIN = 0;
const RANGE_MAX = 16;
const MIN_TARGET_SIZE = 4;
const MAX_TARGET_SIZE = 6;
const GAME_AREA_HEIGHT = 120;

// sentinel value dropped into spawnQueue alongside the numeric tubes -
// distinguishable from any real fraction because those are always numbers
const TOLUENE_MARKER = "TOL";

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
let paused = false;

function pickTargetRange() {

    const size = Math.floor(Math.random() * (MAX_TARGET_SIZE - MIN_TARGET_SIZE + 1)) + MIN_TARGET_SIZE;

    // keep the whole window inside [RANGE_MIN, RANGE_MAX]
    const maxStart = RANGE_MAX - (size - 1);
    const start = Math.floor(Math.random() * (maxStart - RANGE_MIN + 1)) + RANGE_MIN;

    return { start, end: start + size - 1 };

}

export function showFractionsGame() {

    // defensive: if a previous run somehow never reached its game-over
    // path (e.g. the animate loop was left dangling), make sure it's
    // killed before we start a fresh one - two rAF loops stacking on
    // top of each other is what caused the "faster on retry" bug.
    stopGame();

    // reset all per-run state - showFractionsGame can be called again
    // for a retry, so nothing here can be left over from last time.
    tubes = [];
    spawnQueue = [];
    score = 0;
    mistakes = 0;
    targetsCollected = 0;
    gameOver = false;
    paused = false;

    const { start, end } = pickTargetRange();
    targetStart = start;
    targetEnd = end;

    const targets = [];

    for (let n = targetStart; n <= targetEnd; n++) {
        targets.push(n);
    }

    targetsTotal = targets.length;

    // build the decoy pool from every number in range that ISN'T a target,
    // then shuffle and slice - avoids duplicate decoys and avoids the
    // unbounded retry loop the old "keep rolling until it's outside the
    // range" approach could hit
    const decoyPool = [];

    for (let n = RANGE_MIN; n <= RANGE_MAX; n++) {
        if (n < targetStart || n > targetEnd) {
            decoyPool.push(n);
        }
    }

    const shuffledDecoyPool = shuffled(decoyPool);

    // reserve one slot out of TOTAL_TUBES for the toluene tube so the
    // overall tube count on screen doesn't creep up
    const decoyBudget = Math.max(TOTAL_TUBES - targets.length - 1, 0);
    const decoyCount = Math.min(decoyBudget, shuffledDecoyPool.length);
    const decoys = shuffledDecoyPool.slice(0, decoyCount);

    // toluene gets shuffled in with everything else, so it shows up
    // once, at a random point, while fractions are still coming through
    spawnQueue = shuffled([...targets, ...decoys, TOLUENE_MARKER]);

    const html = `
    <div class="screen">
    <div class="panel">

    <h1>COLLECT FRACTIONS</h1>

    <p class="subtitle">
        Collect every fraction between
        <span class="green-text">${targetStart}</span>
        and
        <span class="green-text">${targetEnd}</span>.
        Leave the rest.
    </p>

    <div class="fraction-hud">
        <span id="fractionScore">Collected: 0 / ${targetsTotal}</span>
        <span id="fractionMistakes">Mistakes: 0</span>
    </div>
    <div class="fraction-board">
        <div id="fractionArea" class="fraction-area"></div>
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

    // #fractionArea's own height is still driven by the JS constant so
    // there's a single source of truth for it; width/position/overflow
    // now live in the .fraction-area CSS class instead of being set here,
    // so it can never mismatch its parent's actual available width again.
    const fractionArea = document.getElementById("fractionArea");

    if (fractionArea) {
        fractionArea.style.height = GAME_AREA_HEIGHT + "px";
    }

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

// thin aliases so the toluene pause/resume path reads clearly at the
// call site, even though they're just the existing start/stop under the hood
function pauseGame() {
    paused = true;
    stopGame();
}

function resumeGame() {
    paused = false;
    startGame();
}

function spawnTube() {

    if (spawnQueue.length === 0) {

        clearInterval(spawnTimer);
        spawnTimer = null;
        return;

    }

    const number = spawnQueue.shift();
    const isToluene = number === TOLUENE_MARKER;

    const tube = document.createElement("div");

    tube.className = isToluene ? "fraction-tube toluene" : "fraction-tube";
    tube.style.position = "absolute";
    tube.style.left = "-40px";
    tube.style.top = (10 + Math.random() * (GAME_AREA_HEIGHT - 80)) + "px";

    const img = document.createElement("img");
    img.src = isToluene ? tolueneSprite : fractionSprite;
    img.className = "fraction-sprite-img";
    img.alt = "";
    img.draggable = false;

    const label = document.createElement("span");
    label.className = "fraction-label";
    label.textContent = isToluene ? "TOL" : number;

    tube.appendChild(img);
    tube.appendChild(label);

    const entry = {
        element: tube,
        number: number,
        isToluene: isToluene,
        x: -40,
        resolved: false
    };

    tube.addEventListener("click", () => {
        if (isToluene) {
            handleToluenePickup(entry);
        } else {
            handleTubeClick(entry);
        }
    });

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

    if (entry.resolved || gameOver || paused) {
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

    // brief flash of correct/incorrect state before the tube vanishes -
    // checkGameEnd() has to run AFTER removeTube, not before, or the
    // last tube clicked is still sitting in `tubes` when we check for
    // an empty array and the win condition never fires.
    setTimeout(() => {
        removeTube(entry);
        checkGameEnd();
    }, 200);

}

function handleToluenePickup(entry) {

    if (entry.resolved || gameOver || paused) {
        return;
    }

    entry.resolved = true;
    pauseGame();

    showToluenePrompt(
        () => {
            // drank it - run's over
            stopGame();
            gameOver = true;
            showTolueneGameOver();
        },
        () => {
            // declined - tube just goes away, no score effect, game resumes
            removeTube(entry);
            resumeGame();
            checkGameEnd();
        }
    );

}

function missTube(entry) {

    entry.resolved = true;

    // toluene tubes are optional pickups - drifting offscreen unclicked
    // just makes it disappear, it's not a real fraction to miss
    if (!entry.isToluene && isInRange(entry.number)) {
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

    if (gameOver || paused) {
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

    let html = `
    <div class="screen">
        <div class="panel">
    `;

    const message = passed
        ? "All fractions collected!"
        : `Collected ${targetsCollected} / ${targetsTotal}, ${mistakes} mistake(s).`;

    html += `
            <h2>${passed ? "LEVEL CLEAR" : "GAME OVER"}</h2>
            <p class="result-message">${message}</p>
            
                ${passed ? "" : '<button id="retryButton">TRY AGAIN</button>'}
                <button id="menuButton">RETURN TO MENU</button>
            
        </div>
    </div>
    `;

    showScene(html);

    if (passed) {
        unlockGame("fractions");
    } else {

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