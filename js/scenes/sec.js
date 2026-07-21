import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";
import { unlockGame } from "../engine/gameState.js";

let selectedPort = null;

// Every connection is stored here
let connections = [];

// Solution is defined in terms of COMPONENT IDENTITY (data-port), never
// physical position. This is what stays true no matter how the
// components get shuffled onto the board.
const solution = [

    "buffer-out|pump-in",

    "column-top|pump-out",

    "column-bottom|uv-in",

    "output-in|uv-out"

];

// The 3 physical slots in the middle of the board. Their position on
// screen and port shape (left/right vs top/bottom) never change.
// "id" / in-route / out-route are PHYSICAL POSITION identifiers only -
// they say nothing about which component currently lives there.
const MIDDLE_SLOTS = [
    {
        id: "slotA",
        routeIn: "slotA-in",
        routeOut: "slotA-out",
        inSide: "left",
        outSide: "right"
    },
    {
        id: "slotB",
        routeIn: "slotB-in",
        routeOut: "slotB-out",
        inSide: "top",
        outSide: "bottom"
    },
    {
        id: "slotC",
        routeIn: "slotC-in",
        routeOut: "slotC-out",
        inSide: "left",
        outSide: "right"
    }
];

// The 3 components that get randomly assigned to the slots above
// every time the game loads. portIn/portOut are the identity strings
// checked against `solution` - unrelated to which slot they land in.
const MIDDLE_COMPONENTS = [
    { portIn: "pump-in",    portOut: "pump-out",     label: "PUMP" },
    { portIn: "column-top", portOut: "column-bottom", label: "SEC COLUMN" },
    { portIn: "uv-in",      portOut: "uv-out",        label: "UV MONITOR" }
];

function shuffled(array) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;

}

function renderMiddleNode(slot, component) {

    return `
        <div class="sec-node" id="${slot.id}">
            <div
                class="port ${slot.inSide} in"
                data-port="${component.portIn}"
                data-route="${slot.routeIn}">
            </div>

            <span>${component.label}</span>

            <div
                class="port ${slot.outSide} out"
                data-port="${component.portOut}"
                data-route="${slot.routeOut}">
            </div>
        </div>
    `;

}

export function showSECGame() {

    selectedPort = null;
    connections = [];

    const placements = shuffled(MIDDLE_COMPONENTS)
        .map((component, i) => ({ slot: MIDDLE_SLOTS[i], component }));

    showScene(`
    <div class="screen">

        <div class="panel">

            <h1>CLEAN THE SEC</h1>

            <p class="subtitle">
                Connect the tubing to clean the SEC column.
            </p>

            <div id="secBoard" class="sec-board">

                <svg id="tubeLayer" class="tube-layer"></svg>

                <div class="sec-node" id="buffer">
                    <span>BUFFER</span>
                    <div
                        class="port right out"
                        data-port="buffer-out"
                        data-route="buffer-out">
                    </div>
                </div>

                ${placements.map(p => renderMiddleNode(p.slot, p.component)).join("")}

                <div class="sec-node" id="output">
                    <div
                        class="port left in"
                        data-port="output-in"
                        data-route="output-in">
                    </div>

                    <span>WASTE OUTPUT</span>
                </div>

            </div>

            <div class="navigation">

                <button id="backButton">
                    BACK
                </button>

            </div>

        </div>

    </div>
    `);

    document.querySelectorAll(".port").forEach(port => {
        port.addEventListener("click", handlePortClick);
    });

    document.getElementById("backButton")
        .addEventListener("click", () => {
            setScene(showMenu);
        });

}

function handlePortClick(event) {

    const port = event.target;

    if (selectedPort === null) {

        selectedPort = port;
        port.classList.add("selected-port");
        return;

    }

    // clicked same port
    if (selectedPort === port) {

        selectedPort.classList.remove("selected-port");
        selectedPort = null;
        return;

    }

    // cannot connect IN->IN or OUT->OUT
    if (
        (selectedPort.classList.contains("in") &&
         port.classList.contains("in")) ||

        (selectedPort.classList.contains("out") &&
         port.classList.contains("out"))
    ) {

        selectedPort.classList.remove("selected-port");
        selectedPort = null;
        return;

    }

    removeExistingConnections(selectedPort);
    removeExistingConnections(port);

    // The graph just changed, so any correct/incorrect verdict from a
    // previous check is stale - wipe it so ports don't show leftover
    // red/green from a connection that no longer exists.
    clearPortStatus();

    // Identity check (used for scoring) - order doesn't matter since
    // this is sorted before joining.
    const key = [
        selectedPort.dataset.port,
        port.dataset.port
    ].sort().join("|");

    connections.push({
        start: selectedPort,
        end: port,
        key: key
    });

    redrawTubes();

    selectedPort.classList.remove("selected-port");
    selectedPort = null;

    if (connections.length === 4) {
        checkConnections();
    }

}

function removeExistingConnections(port) {

    connections = connections.filter(connection => {

        return (
            connection.start !== port &&
            connection.end !== port
        );

    });

}

function clearPortStatus() {

    document.querySelectorAll(".port").forEach(port => {
        port.classList.remove("correct", "incorrect");
    });

}

function redrawTubes() {

    const svg = document.getElementById("tubeLayer");

    svg.innerHTML = "";

    for (const connection of connections) {

        drawTube(connection);

    }

}

function centerOf(el, board) {

    const rect = el.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2 - board.left,
        y: rect.top + rect.height / 2 - board.top
    };

}

function drawTube(connection) {

    const startPort = connection.start;
    const endPort = connection.end;

    const svg = document.getElementById("tubeLayer");

    const board = document
        .getElementById("secBoard")
        .getBoundingClientRect();

    const startName = startPort.dataset.route;
    const endName = endPort.dataset.route;

    const key = [startName, endName].sort().join("|");
    const route = ROUTES_BY_KEY[key];

    const startPoint = centerOf(startPort, board);
    const endPoint = centerOf(endPort, board);

    // Every route below names its two endpoints explicitly (a, b).
    // Whichever physical port matches "a" always becomes pa, no
    // matter which port the player happened to click first - so the
    // resulting path is always identical either way round.
    let pa, pb;

    if (route && startName === route.a) {
        pa = startPoint;
        pb = endPoint;
    } else {
        pa = endPoint;
        pb = startPoint;
    }

    const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    path.setAttribute(
        "d",
        route
            ? route.path(pa, pb)
            : `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`
    );

    path.classList.add("tube");

    if (connection.correct === true) {
        path.classList.add("correct");
    } else if (connection.correct === false) {
        path.classList.add("incorrect");
    }

    svg.appendChild(path);
}

// Every possible pairing of the 8 physical ports on the board, keyed
// only by PHYSICAL POSITION (buffer, slotA/B/C in+out, output) - these
// never change no matter which component is shuffled into a slot.
// Each entry names its endpoints "a" and "b" explicitly; the path
// function always receives (pa, pb) in that fixed order.
const ROUTE_DEFS = [

    // BUFFER -> SLOT A (in)
    {
        a: "buffer-out", b: "slotA-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${(pa.x + pb.x) / 2} ${pa.y}
            L ${(pa.x + pb.x) / 2} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // BUFFER -> SLOT B (in)
    {
        a: "buffer-out", b: "slotB-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x + 40} ${pa.y}
            L ${pa.x + 40} ${pa.y - 55}
            L ${pb.x} ${pa.y - 55}
            L ${pb.x} ${pb.y}
        `
    },

    // BUFFER -> SLOT C (in)
    {
        a: "buffer-out", b: "slotC-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${((pa.x + pb.x) / 2) - 10} ${pa.y}
            L ${((pa.x + pb.x) / 2) - 10} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // BUFFER -> OUTPUT
    {
        a: "buffer-out", b: "output-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x + 40} ${pa.y}
            L ${pa.x + 40} ${pa.y - 70}
            L ${pb.x - 40} ${pa.y - 70}
            L ${pb.x - 40} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT B (in) -> SLOT A (out)
    {
        a: "slotB-in", b: "slotA-out",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x} ${pa.y - 20}
            L ${pb.x + 15} ${pa.y - 20}
            L ${pb.x + 15} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT A (out) -> SLOT C (in)
    {
        a: "slotA-out", b: "slotC-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pb.x} ${pb.y}
        `
    },

    // OUTPUT -> SLOT A (out)
    {
        a: "output-in", b: "slotA-out",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${((pa.x + pb.x) / 2) + 10} ${pa.y}
            L ${((pa.x + pb.x) / 2) + 10} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT B (out) -> SLOT A (in)
    {
        a: "slotB-out", b: "slotA-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x} ${pb.y + 50}
            L ${pb.x-25} ${pb.y + 50}
            L ${pb.x-25} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT B (out) -> SLOT C (in)  [part of the correct solution]
    {
        a: "slotB-out", b: "slotC-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT B (out) -> OUTPUT
    {
        a: "slotB-out", b: "output-in",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x} ${pa.y + 10}
            L ${pb.x - 30} ${pa.y + 10}
            L ${pb.x - 30} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT A (in) -> SLOT C (out)
    {
        a: "slotA-in", b: "slotC-out",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x - 30} ${pa.y}
            L ${pa.x - 30} ${pa.y + 60}
            L ${pb.x + 30} ${pb.y + 60}
            L ${pb.x + 30} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // SLOT B (in) -> SLOT C (out)
    {
        a: "slotB-in", b: "slotC-out",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${pa.x} ${pa.y - 30}
            L ${pb.x + 10} ${pa.y - 30}
            L ${pb.x + 10} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    },

    // OUTPUT -> SLOT C (out)  [part of the correct solution]
    {
        a: "output-in", b: "slotC-out",
        path: (pa, pb) => `
            M ${pa.x} ${pa.y}
            L ${(pa.x + pb.x) / 2} ${pa.y}
            L ${(pa.x + pb.x) / 2} ${pb.y}
            L ${pb.x} ${pb.y}
        `
    }

];

const ROUTES_BY_KEY = {};

for (const route of ROUTE_DEFS) {
    const key = [route.a, route.b].sort().join("|");
    ROUTES_BY_KEY[key] = route;
}

function checkConnections() {

    // Reset once, before scoring - not on every iteration - so all
    // four verdicts survive the loop instead of only the last one.
    clearPortStatus();

    let solved = true;

    for (const connection of connections) {

        connection.correct = solution.includes(connection.key);

        if (connection.correct) {

            connection.start.classList.add("correct");
            connection.end.classList.add("correct");

        }
        else {

            connection.start.classList.add("incorrect");
            connection.end.classList.add("incorrect");
            solved = false;

        }

    }

    redrawTubes();

    if (solved) {

        unlockGame("fractions");

        document.querySelector(".navigation").innerHTML = `
            <button id="menuButton">
                RETURN TO MENU
            </button>
        `;

        document
            .getElementById("menuButton")
            .addEventListener("click", () => {

                setScene(showMenu);

            });

    }

}

function showSECWin() {

    showScene(`

        <div class="screen">

            <div class="panel">

                <h1>TUBING COMPLETE</h1>

                <p>
                    We can clean the SEC now!
                </p>

                <button id="menuButton">
                    RETURN TO MENU
                </button>

            </div>

        </div>

    `);
    unlockGame("fractions");
    document
        .getElementById("menuButton")
        .addEventListener("click", () => setScene(showMenu));

}