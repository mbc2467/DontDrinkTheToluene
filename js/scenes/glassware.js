import { showScene, setScene } from "../engine/sceneManager.js";
import { unlockGame } from "../engine/gameState.js";
import { showMenu } from "./menu.js";

import { showToluenePrompt } from "./toluenePrompt.js";
import { showTolueneGameOver } from "./tolueneGameOver.js";

import { dirtyGlassSprites } from "../data/sprites.js";
import { tolueneSprite } from "../data/sprites.js";

import { unlockAchievement } from "./achievements.js";

export function showGlasswareGame() {

    let cleaned = 0;
    let time = 20;
    let interval;

    showScene(`
        <div class="screen">

            <div class="panel">

                <h1>CLEAN GLASSWARE</h1>

                <p class="subtitle">
                    Michael somehow convinced everyone this counts as making buffer.
                </p>

                <p>
                    Clean 10 pieces of glassware before time runs out.
                </p>

                <p id="score">
                    Cleaned: 0 / 10
                </p>

                <p id="timer">
                    Time: 20
                </p>

                <div id="glasswareArea" class="glassware-area"></div>

                <div class="navigation">

                    <button id="backButton">
                        BACK
                    </button>

                </div>

            </div>

        </div>
    `);

    const area = document.getElementById("glasswareArea");

    document
        .getElementById("backButton")
        .addEventListener("click", () => {

            clearInterval(interval);

            setScene(showMenu);

        });

        spawnObject();

        let spawnDelay = 800;

        const spawnInterval = setInterval(() => {

            spawnObject();

            if (spawnDelay > 350)
                spawnDelay -= 20;

        }, spawnDelay);

    interval = setInterval(() => {

        time--;

        document.getElementById("timer").textContent =
            `Time: ${time}`;

        if (time <= 0) {

            clearInterval(interval);
            loseGame();

        }

    }, 1000);

    function spawnObject() {

        const object = document.createElement("div");

        object.style.left = Math.random() * 85 + "%";
        object.style.top = Math.random() * 75 + "%";

        // 10% chance of spawning toluene
        const isToluene = Math.random() < 0.10;
        if (isToluene) {
            object.className = "glass toluene";
            object.innerHTML =`<img src="${tolueneSprite}" alt="Toluene">`;
            object.title = "Toluene";
            object.addEventListener("click", () => {
                showToluenePrompt(
                    () => {
                        clearInterval(interval);
                        clearInterval(spawnInterval);
                        showTolueneGameOver();
                    },
                    () => {
                        // Remove the bottle without affecting score.
                        object.remove();
                        //spawnObject();
                    }
                );
            });
        }
        else {

            object.className = "glass";

            const img = document.createElement("img");
            img.src = randomGlassSprite();
            object.appendChild(img);

            object.title = "Dirty Glassware";

            object.addEventListener("click", () => {

                cleaned++;

                document.getElementById("score").textContent =
                    `Cleaned: ${cleaned} / 10`;

                object.remove();

                if (cleaned >= 10) {

                    clearInterval(interval);
                    clearInterval(spawnInterval);

                    winGame();

                }

            });

        }

        area.appendChild(object);

    }

    function winGame() {

        unlockGame("sec");
        unlockAchievement("perfect_glassware");
        showScene(`
            <div class="screen">

                <div class="panel">

                    <h1>SUCCESS!</h1>

                    <p>
                        Michael successfully avoided making buffer.
                    </p>

                    <button id="menuButton">
                        RETURN TO MENU
                    </button>

                </div>

            </div>
        `);
        
        document
            .getElementById("menuButton")
            .addEventListener("click", () => {
                setScene(showMenu);
            });

    }

    function loseGame() {

        showScene(`
            <div class="screen">

                <div class="panel">

                    <h1>TOO SLOW!</h1>

                    <p>
                        There is still dirty glassware everywhere.
                    </p>

                    <button id="retryButton">
                        TRY AGAIN
                    </button>
                    <button id="menuButton">
                        RETURN TO MENU
                    </button>
                </div>

            </div>
        `);

        document
            .getElementById("retryButton")
            .addEventListener("click", showGlasswareGame);
        document
            .getElementById("menuButton")
            .addEventListener("click", () => setScene(showMenu));
    }

}

function randomGlassSprite(){

    return dirtyGlassSprites[
        Math.floor(Math.random()*dirtyGlassSprites.length)
    ];

}