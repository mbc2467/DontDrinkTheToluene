import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";

let selectedPort = null;

// Every connection is stored here
let connections = [];

export function showSECGame() {

    selectedPort = null;
    connections = [];

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
                        data-port="buffer-out">
                    </div>
                </div>

                <div class="sec-node" id="pump">
                    <div
                        class="port left in"
                        data-port="pump-in">
                    </div>

                    <span>PUMP</span>

                    <div
                        class="port right out"
                        data-port="pump-out">
                    </div>
                </div>

                <div class="sec-node" id="column">
                    <div
                        class="port top in"
                        data-port="column-top">
                    </div>

                    <span>SEC COLUMN</span>

                    <div
                        class="port bottom out"
                        data-port="column-bottom">
                    </div>
                </div>

                <div class="sec-node" id="uv">
                    <div
                        class="port left in"
                        data-port="uv-in">
                    </div>

                    <span>UV MONITOR</span>

                    <div
                        class="port right out"
                        data-port="uv-out">
                    </div>
                </div>

                <div class="sec-node" id="output">
                    <div
                        class="port left in"
                        data-port="output-in">
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

    connections.push({
        start: selectedPort,
        end: port
    });

    redrawTubes();

    selectedPort.classList.remove("selected-port");
    selectedPort = null;

}

function removeExistingConnections(port) {

    connections = connections.filter(connection => {

        return (
            connection.start !== port &&
            connection.end !== port
        );

    });

}

function redrawTubes() {

    const svg = document.getElementById("tubeLayer");

    svg.innerHTML = "";

    for (const connection of connections) {

        drawTube(connection.start, connection.end);

    }

}

function drawTube(startPort, endPort) {

    const svg = document.getElementById("tubeLayer");

    const board = document
        .getElementById("secBoard")
        .getBoundingClientRect();

    const a = startPort.getBoundingClientRect();
    const b = endPort.getBoundingClientRect();

    const x1 = a.left + a.width / 2 - board.left;
    const y1 = a.top + a.height / 2 - board.top;

    const x2 = b.left + b.width / 2 - board.left;
    const y2 = b.top + b.height / 2 - board.top;

    const start = startPort.dataset.port;
    const end = endPort.dataset.port;

    const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    path.setAttribute(
        "d",
        getTubePath(start, end, x1, y1, x2, y2)
    );

    path.setAttribute("class", "tube");

    svg.appendChild(path);

}

const routes = {

    // BUFFER -> PUMP
    "buffer-out|pump-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${(x1+x2)/2} ${y1}
        L ${(x1+x2)/2} ${y2}
        L ${x2} ${y2}
    `,

    // BUFFER -> COLUMN
    "buffer-out|column-top": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1+40} ${y1}
        L ${x1+40} ${y1-55}
        L ${x2} ${y1-55}
        L ${x2} ${y2}
    `,

    // BUFFER -> UV
    "buffer-out|uv-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${((x1+x2)/2)-10} ${y1}
        L ${((x1+x2)/2)-10} ${y2}
        L ${x2} ${y2}
    `,

    // BUFFER -> OUTPUT
    "buffer-out|output-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1+40} ${y1}
        L ${x1+40} ${y1-70}
        L ${x2-40} ${y1-70}
        L ${x2-40} ${y2}
        L ${x2} ${y2}
    `,



    // PUMP -> COLUMN
    "column-top|pump-out": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1+25} ${y1}
        L ${x1+25} ${y2-20}
        L ${x2} ${y2-20}
        L ${x2} ${y2}
    `,

    // PUMP -> UV
    "pump-out|uv-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x2} ${y2}
    `,

    // PUMP -> OUTPUT
    "output-in|pump-out": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${((x1+x2)/2)+10} ${y1}
        L ${((x1+x2)/2)+10} ${y2}
        L ${x2} ${y2}
    `,



    // COLUMN -> PUMP
    "column-bottom|pump-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1} ${y1+10}
        L ${x2-30} ${y1+10}
        L ${x2-30} ${y2}
        L ${x2} ${y2}
    `,

    // COLUMN -> UV (correct path)
    "column-bottom|uv-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1} ${y2}
        L ${x2} ${y2}
    `,

    // COLUMN -> OUTPUT
    "column-bottom|output-in": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1} ${y1+10}
        L ${x2-30} ${y1+10}
        L ${x2-30} ${y2}
        L ${x2} ${y2}
    `,



    // UV -> PUMP
    "pump-in|uv-out": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1+30} ${y1}
        L ${x1+30} ${y1+55}
        L ${x2-30} ${y1+55}
        L ${x2-30} ${y2}
        L ${x2} ${y2}
    `,

    // UV -> COLUMN
    "column-top|uv-out": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1+30} ${y1}
        L ${x1+30} ${y1-50}
        L ${x2+65} ${y1-50}
        L ${x2+65} ${y2-20}
        L ${x2} ${y2-20}
        L ${x2} ${y2}
    `,

    // UV -> OUTPUT (correct path)
    "output-in|uv-out": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${(x1+x2)/2} ${y1}
        L ${(x1+x2)/2} ${y2}
        L ${x2} ${y2}
    `
};



function getTubePath(start, end, x1, y1, x2, y2) {

    const key = [start, end].sort().join("|");

    const builder = routes[key];

    if (builder) {
        return builder(x1, y1, x2, y2);
    }

    // Fallback if a route wasn't defined
    return `
        M ${x1} ${y1}
        L ${x2} ${y1}
        L ${x2} ${y2}
    `;
}

function getPortPosition(port){

    const board = document
        .getElementById("secBoard")
        .getBoundingClientRect();

    const rect = port.getBoundingClientRect();

    return {
        x: rect.left + rect.width/2 - board.left,
        y: rect.top + rect.height/2 - board.top
    };

}

function getSide(port){

    if(port.classList.contains("left")) return "left";
    if(port.classList.contains("right")) return "right";
    if(port.classList.contains("top")) return "top";
    if(port.classList.contains("bottom")) return "bottom";

}

function offsetPoint(point, side){

    const d = 25;

    switch(side){

        case "left":
            return {x:point.x-d, y:point.y};

        case "right":
            return {x:point.x+d, y:point.y};

        case "top":
            return {x:point.x, y:point.y-d};

        case "bottom":
            return {x:point.x, y:point.y+d};

    }

}