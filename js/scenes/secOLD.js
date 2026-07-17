import { showScene, setScene } from "../engine/sceneManager.js";
import { showMenu } from "./menu.js";

let selectedPort = null;

// Every connection is stored here
let connections = [];
const solution = [

    "buffer-out|pump-in",

    "column-top|pump-out",

    "column-bottom|uv-in",

    "output-in|uv-out"

];

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

    // The graph just changed, so any correct/incorrect verdict from a
    // previous check is stale - wipe it so ports don't show leftover
    // red/green from a connection that no longer exists.
    clearPortStatus();

    const key = [
        selectedPort.dataset.port,
        port.dataset.port
    ].sort().join("|");

    connections.push({
        start:selectedPort,
        end:port,
        key:key
    });

    redrawTubes();

    selectedPort.classList.remove("selected-port");
    selectedPort = null;

    if(connections.length === 4){
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

function drawTube(connection) {

    const startPort = connection.start;
    const endPort = connection.end;

    const svg = document.getElementById("tubeLayer");

    const board = document
        .getElementById("secBoard")
        .getBoundingClientRect();

    let a = startPort.getBoundingClientRect();
    let b = endPort.getBoundingClientRect();

    let startName = startPort.dataset.port;
    let endName = endPort.dataset.port;

    // Normalize so the path is identical no matter which port was
    // clicked first - swap both the names AND their coordinates
    // together so they stay paired correctly.
    if (startName > endName) {

        [startName, endName] = [endName, startName];
        [a, b] = [b, a];

    }

    const x1 = a.left + a.width / 2 - board.left;
    const y1 = a.top + a.height / 2 - board.top;

    const x2 = b.left + b.width / 2 - board.left;
    const y2 = b.top + b.height / 2 - board.top;

    const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    path.setAttribute(
        "d",
        getTubePath(
            startName,
            endName,
            x1,
            y1,
            x2,
            y2
        )
    );

    path.classList.add("tube");

    if (connection.correct === true) {
        path.classList.add("correct");
    } else if (connection.correct === false) {
        path.classList.add("incorrect");
    }

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
        L ${x1} ${y1-20}
        L ${x1-65} ${y1-20}
        L ${x1-65} ${y2}
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
        L ${x1-30} ${y1}
        L ${x1-30} ${y1+55}
        L ${x2+30} ${y1+55}
        L ${x2+30} ${y2}
        L ${x2} ${y2}
    `,

    // UV -> COLUMN
    "column-top|uv-out": (x1,y1,x2,y2) => `
        M ${x1} ${y1}
        L ${x1} ${y1-30}
        L ${x2+10} ${y1-30}
        L ${x2+10} ${y2}
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

    // start/end are already normalized (alphabetically ordered) by
    // drawTube, along with their matching coordinates, so we can look
    // the route up directly without re-sorting anything here.
    const key = `${start}|${end}`;

    const builder = routes[key];

    if (builder) {
        return builder(x1, y1, x2, y2);
    }

    return `
        M ${x1} ${y1}
        L ${x2} ${y2}
    `;
}

function checkConnections(){

    // Reset once, before scoring - not on every iteration - so all
    // four verdicts survive the loop instead of only the last one.
    clearPortStatus();

    let solved = true;

    for(const connection of connections){

        connection.correct = solution.includes(connection.key);

        if(connection.correct){

            connection.start.classList.add("correct");
            connection.end.classList.add("correct");

        }
        else{

            connection.start.classList.add("incorrect");
            connection.end.classList.add("incorrect");
            solved = false;

        }

    }

    redrawTubes();

    if(solved){

        unlockGame("ls");

        document.querySelector(".navigation").innerHTML = `
            <button id="menuButton">
                RETURN TO MENU
            </button>
        `;

        document
            .getElementById("menuButton")
            .addEventListener("click",()=>{

                setScene(showMenu);

            });

    }

}