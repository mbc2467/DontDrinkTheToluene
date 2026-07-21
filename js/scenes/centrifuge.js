import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";
import { unlockGame } from "../engine/gameState.js";

import { showToluenePrompt } from "./toluenePrompt.js";
import { showTolueneGameOver } from "./tolueneGameOver.js";

import { tolueneSprite } from "../data/sprites.js";

// 10 rotor positions = 5 pairs = 10 total tubes (Toluene, Buffer, one or
// more proteins, and generic Balance tubes filling out the rest)
const ROTOR_POSITIONS = 10;

// flip this off to skip straight to the result state while playtesting
// the click-to-place / pairing logic without sitting through animations
const ENABLE_SPIN_ANIMATION = true;

// no hard loss condition by default - the puzzle has no timer and the
// player can always rearrange and retry. Set this to a number to make
// showCentrifugeFailure() actually fire after that many failed spins.
const MAX_ATTEMPTS = null;

const SUCCESS_ANIMATION_MS = 1600;
const FAILURE_ANIMATION_MS = 900;

const MIN_SHAKE_PX = 2;
const MAX_SHAKE_PX = 16;

// --- rotor disc geometry (pixel-art bitmap, not an image asset) ---
const ROTOR_GRID = 30;       // bitmap resolution (cells across)
const ROTOR_PIXEL = 10;       // px size of each bitmap cell when rendered
const ROTOR_DISC_PX = ROTOR_GRID * ROTOR_PIXEL;
const SLOT_RADIUS_FRAC = 0.72; // slot ring radius as a fraction of disc radius
const SLOT_SIZE = 40;

const PROTEIN_SAMPLES = ["Alpha", "Beta High", "Beta Low 1", "Beta Low 2", "Gamma"];

const VOLUME_TOLERANCE = 0.001;

let tubes = [];
let resultBySlot = {};
let attempts = 0;
let promptOpen = false;
let spinning = false;
let selectedTubeId = null;

let idCounter = 0;

function nextId() {
    return "tube-" + (idCounter++);
}

function shuffled(array) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;

}

// generates one distinct volume per pair, each a bit further from the
// last so no two pairs land suspiciously close together on the scale
function generateDistinctVolumes(count) {

    const volumes = [];
    let value = 4.0 + Math.random() * 0.6;

    for (let i = 0; i < count; i++) {
        volumes.push(Math.round(value * 10) / 10);
        value += 0.4 + Math.random() * 0.5;
    }

    return volumes;

}

function makeTube(label, volume) {

    return {
        id: nextId(),
        label: label,
        volume: volume,
        isToluene: label === "Toluene",
        // "tray" | "scale" | numeric rotor slot index
        location: "tray"
    };

}

// every round always has Toluene + Buffer + at least one protein;
// remaining slots are backfilled with generic "Balance N" tubes so the
// tube count always exactly matches ROTOR_POSITIONS
function buildTubes() {

    const proteinPool = shuffled(PROTEIN_SAMPLES);
    const proteinCount = 1 + Math.floor(Math.random() * proteinPool.length);
    const chosenProteins = proteinPool.slice(0, proteinCount);

    const labels = ["Toluene", "Buffer", ...chosenProteins];

    const genericNeeded = ROTOR_POSITIONS - labels.length;

    for (let i = 1; i <= genericNeeded; i++) {
        labels.push(`Balance ${i}`);
    }

    const shuffledLabels = shuffled(labels);
    const pairCount = ROTOR_POSITIONS / 2;
    const volumes = generateDistinctVolumes(pairCount);

    const built = [];

    // walk the shuffled label list two at a time, and give each pair the
    // same volume - this is what actually defines "who belongs together",
    // completely independent of what the two labels happen to be
    for (let i = 0; i < pairCount; i++) {

        const volume = volumes[i];
        const labelA = shuffledLabels[i * 2];
        const labelB = shuffledLabels[i * 2 + 1];

        built.push(makeTube(labelA, volume));
        built.push(makeTube(labelB, volume));

    }

    return shuffled(built);

}

export function showCentrifugeGame() {

    tubes = buildTubes();
    resultBySlot = {};
    attempts = 0;
    promptOpen = false;
    spinning = false;
    selectedTubeId = null;

    const html = `
    <div class="screen">
    <div class="panel" id="centrifugePanel">

    <h1>BALANCE THE CENTRIFUGE</h1>

    <p class="subtitle">
        Every sample for light scattering needs the correctly matched
        balance directly opposite it before you spin.
    </p>

    <p id="centrifugeMessage" class="centrifuge-message" style="visibility: hidden;"></p>

    <div class="centrifuge-layout">

        <div class="rotor-column">
            <div id="rotorDisc" class="rotor-disc" style="width: ${ROTOR_DISC_PX}px; height: ${ROTOR_DISC_PX}px;"></div>
        </div>

        <div class="tray-column">
            <div id="tubeTray" class="tube-tray"></div>
        </div>

        <div class="scale-column">
            <div id="scale" class="scale-housing">
                <div class="scale-plate" id="scalePlate"></div>
                <div class="scale-display" id="scaleDisplay">--.- g</div>
            </div>
        </div>

    </div>

    <div class="navigation">
        <button id="spinButton" class="spin-button">SPIN</button>
        <button id="backButton">BACK</button>
    </div>

    </div>
    </div>
    `;

    showScene(html);

    renderRotorDiscBackground();

    const tray = document.getElementById("tubeTray");
    const scalePlate = document.getElementById("scalePlate");

    tray.addEventListener("click", () => handleDestinationClick("tray"));
    scalePlate.addEventListener("click", () => handleDestinationClick("scale"));

    document
        .getElementById("spinButton")
        .addEventListener("click", handleSpin);

    document
        .getElementById("backButton")
        .addEventListener("click", () => {
            setScene(showMenu);
        });

    renderBoard();

}

// --- pixel-art rotor disc (a real low-res bitmap, scaled up - not a
// blurred CSS filter trick) ---
function renderRotorDiscBackground() {

    const disc = document.getElementById("rotorDisc");

    if (!disc) {
        return;
    }

    disc.innerHTML = "";

    const center = (ROTOR_GRID - 1) / 2;
    const radius = ROTOR_GRID / 2 - 0.5;

    for (let y = 0; y < ROTOR_GRID; y++) {
        for (let x = 0; x < ROTOR_GRID; x++) {

            const dx = x - center;
            const dy = y - center;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > radius) {
                continue;
            }

            const cell = document.createElement("div");
            cell.className = "rotor-pixel";

            // banded shading purely from distance-from-center buckets -
            // gives the disc a brushed-metal look while staying blocky
            const band = Math.floor((dist / radius) * 4);
            cell.classList.add(`rotor-pixel-band-${band}`);

            cell.style.left = (x * ROTOR_PIXEL) + "px";
            cell.style.top = (y * ROTOR_PIXEL) + "px";
            cell.style.width = ROTOR_PIXEL + "px";
            cell.style.height = ROTOR_PIXEL + "px";

            disc.appendChild(cell);

        }
    }

    // slot layer sits above the pixel bitmap, positioned with the same
    // trig used for the pairing logic (opposite-index = geometric opposite)
    const slotLayer = document.createElement("div");
    slotLayer.className = "rotor-slot-layer";
    slotLayer.id = "rotorSlotLayer";
    disc.appendChild(slotLayer);

}

function computeSlotPosition(i) {

    const angle = (2 * Math.PI / ROTOR_POSITIONS) * i - Math.PI / 2;
    const discCenter = ROTOR_DISC_PX / 2;
    const discRadius = ROTOR_DISC_PX / 2;
    const ringRadius = discRadius * SLOT_RADIUS_FRAC;

    return {
        x: discCenter + ringRadius * Math.cos(angle) - SLOT_SIZE / 2,
        y: discCenter + ringRadius * Math.sin(angle) - SLOT_SIZE / 2
    };

}

function moveTube(tubeId, destination) {

    const tube = tubes.find(t => t.id === tubeId);

    if (!tube) {
        return;
    }

    tube.location = destination;

    // any rearrangement invalidates the last spin's read - the player
    // has to spin again to find out if the new arrangement is correct
    resultBySlot = {};
    hideMessage();

    renderBoard();

}

function selectTube(tube) {

    if (promptOpen || spinning) {
        return;
    }

    if (tube.isToluene) {

        // toluene always offers the drink prompt on click, but also
        // becomes the selected tube - declining leaves it selected so
        // the very next click places it, no separate "grab" step needed
        selectedTubeId = tube.id;
        renderBoard();
        openToluenePrompt();
        return;

    }

    selectedTubeId = (selectedTubeId === tube.id) ? null : tube.id;
    renderBoard();

}

function handleDestinationClick(destination) {

    if (promptOpen || spinning || selectedTubeId === null) {
        return;
    }

    // guard against the destination having been filled by something else
    // between selection and this click (shouldn't normally happen since
    // occupied spots are caught by the tube's own click handler first)
    if (destination !== "tray") {

        const occupied = tubes.some(t => t.id !== selectedTubeId && t.location === destination);

        if (occupied) {
            return;
        }

    }

    moveTube(selectedTubeId, destination);
    selectedTubeId = null;

}

function renderBoard() {

    renderTray();
    renderRotorSlots();
    renderScale();
    updateSpinButton();

}

function createTubeElement(tube) {

    const el = document.createElement("div");

    el.className = "tube-item" + (tube.isToluene ? " toluene-tube" : "");

    if (tube.id === selectedTubeId) {
        el.classList.add("tube-selected");
    }

    if (tube.isToluene) {

        const img = document.createElement("img");
        img.src = tolueneSprite;
        img.className = "tube-sprite-img";
        img.alt = "";
        el.appendChild(img);

    } else {

        const vial = document.createElement("div");
        vial.className = "tube-vial";
        el.appendChild(vial);

    }

    const label = document.createElement("span");
    label.className = "tube-label";
    label.textContent = tube.label;
    el.appendChild(label);

    el.addEventListener("click", (e) => {
        e.stopPropagation();
        selectTube(tube);
    });

    return el;

}

function renderTray() {

    const tray = document.getElementById("tubeTray");

    if (!tray) {
        return;
    }

    tray.innerHTML = "";

    tubes
        .filter(t => t.location === "tray")
        .forEach(t => tray.appendChild(createTubeElement(t)));

}

function renderRotorSlots() {

    const layer = document.getElementById("rotorSlotLayer");

    if (!layer) {
        return;
    }

    layer.innerHTML = "";

    for (let i = 0; i < ROTOR_POSITIONS; i++) {

        const { x, y } = computeSlotPosition(i);

        const slot = document.createElement("div");
        slot.className = "rotor-slot";
        slot.style.width = SLOT_SIZE + "px";
        slot.style.height = SLOT_SIZE + "px";
        slot.style.left = x + "px";
        slot.style.top = y + "px";

        if (resultBySlot[i] === "correct") {
            slot.classList.add("slot-correct");
        } else if (resultBySlot[i] === "incorrect") {
            slot.classList.add("slot-incorrect");
        }

        slot.addEventListener("click", () => handleDestinationClick(i));

        const occupant = tubes.find(t => t.location === i);

        if (occupant) {
            slot.appendChild(createTubeElement(occupant));
        }

        layer.appendChild(slot);

    }

}

function renderScale() {

    const plate = document.getElementById("scalePlate");
    const display = document.getElementById("scaleDisplay");

    if (!plate || !display) {
        return;
    }

    plate.innerHTML = "";

    const occupant = tubes.find(t => t.location === "scale");

    if (occupant) {
        plate.appendChild(createTubeElement(occupant));
        display.textContent = `${occupant.volume.toFixed(1)} g`;
    } else {
        display.textContent = "--.- g";
    }

}

function updateSpinButton() {

    const button = document.getElementById("spinButton");

    if (!button) {
        return;
    }

    const allPlaced = tubes.every(t => typeof t.location === "number");

    button.disabled = !allPlaced || spinning || promptOpen;

}

function oppositeOf(i) {
    return (i + ROTOR_POSITIONS / 2) % ROTOR_POSITIONS;
}

function handleSpin() {

    if (spinning || promptOpen) {
        return;
    }

    const allPlaced = tubes.every(t => typeof t.location === "number");

    if (!allPlaced) {
        return;
    }

    const pairs = [];

    for (let i = 0; i < ROTOR_POSITIONS / 2; i++) {

        const posA = i;
        const posB = oppositeOf(i);

        const tubeA = tubes.find(t => t.location === posA);
        const tubeB = tubes.find(t => t.location === posB);

        const diff = Math.abs(tubeA.volume - tubeB.volume);
        const correct = diff < VOLUME_TOLERANCE;

        pairs.push({ posA, posB, correct, diff });

    }

    attempts++;

    resultBySlot = {};

    for (const p of pairs) {
        resultBySlot[p.posA] = p.correct ? "correct" : "incorrect";
        resultBySlot[p.posB] = p.correct ? "correct" : "incorrect";
    }

    const allCorrect = pairs.every(p => p.correct);

    if (allCorrect) {
        runSuccessSpin();
    } else {

        // total mis-balance across all pairs drives how hard the rotor
        // shakes - a couple of tubes slightly off gives a mild wobble,
        // several badly mismatched pairs gives a violent shake
        const severity = pairs.reduce((sum, p) => sum + (p.correct ? 0 : p.diff), 0);
        runFailureSpin(severity);

    }

}

function runSuccessSpin() {

    spinning = true;
    selectedTubeId = null;
    renderBoard();

    const disc = document.getElementById("rotorDisc");

    if (ENABLE_SPIN_ANIMATION && disc) {

        disc.classList.add("spin-success");
        setTimeout(finishSuccess, SUCCESS_ANIMATION_MS);

    } else {

        finishSuccess();

    }

}

function finishSuccess() {

    spinning = false;
    setScene(showCentrifugeSuccess);

}

function computeShakeMagnitude(severity) {

    const magnitude = MIN_SHAKE_PX + severity * 6;
    return Math.min(MAX_SHAKE_PX, magnitude);

}

function runFailureSpin(severity) {

    spinning = true;
    selectedTubeId = null;
    renderBoard();

    const disc = document.getElementById("rotorDisc");
    const panel = document.getElementById("centrifugePanel");

    if (ENABLE_SPIN_ANIMATION && disc) {

        const magnitude = computeShakeMagnitude(severity);

        disc.style.setProperty("--shake-magnitude", magnitude + "px");
        disc.classList.add("shake");

        if (panel) {
            panel.style.setProperty("--shake-magnitude", (magnitude * 0.35) + "px");
            panel.classList.add("jitter");
        }

        setTimeout(() => finishFailure(disc, panel), FAILURE_ANIMATION_MS);

    } else {

        finishFailure(disc, panel);

    }

}

function finishFailure(disc, panel) {

    spinning = false;

    if (disc) {
        disc.classList.remove("shake");
    }

    if (panel) {
        panel.classList.remove("jitter");
    }

    showMessage("Rotor Imbalance Detected!");

    if (MAX_ATTEMPTS !== null && attempts >= MAX_ATTEMPTS) {
        setScene(showCentrifugeFailure);
        return;
    }

    // leave resultBySlot in place so the just-finished spin's red/green
    // highlighting is visible for the player to act on
    renderRotorSlots();
    updateSpinButton();

}

function showMessage(text) {

    const el = document.getElementById("centrifugeMessage");

    if (!el) {
        return;
    }

    el.textContent = text;
    el.style.visibility = "visible";

}

function hideMessage() {

    const el = document.getElementById("centrifugeMessage");

    if (!el) {
        return;
    }

    el.style.visibility = "hidden";

}

function openToluenePrompt() {

    promptOpen = true;
    updateSpinButton();

    showToluenePrompt(
        () => {
            // drank it - run's over
            promptOpen = false;
            setScene(showTolueneGameOver);
        },
        () => {
            // declined - toluene stays selected, game resumes exactly
            // where the player left off
            promptOpen = false;
            renderBoard();
        }
    );

}

// --- win/loss screens: intentionally blank, customize freely ---

function showCentrifugeSuccess() {

    showScene(`
    <div class="screen">
        <div class="panel">
            <!-- TODO: customize success screen -->
            <!-- e.g. h1 "SUCCESS", message "The rotor is perfectly -->
            <!-- balanced. Your samples are ready for light scattering.", -->
            <!-- a RETURN TO MENU button, and unlockGame(...) -->
        </div>
    </div>
    `);

}

function showCentrifugeFailure() {

    showScene(`
    <div class="screen">
        <div class="panel">
            <!-- TODO: customize failure screen -->
            <!-- only reached if MAX_ATTEMPTS is set to a number above -->
        </div>
    </div>
    `);

}