import { showScene, goHome } from "../engine/sceneManager.js";

export function showTolueneGameOver() {

    showScene(`

        <div class="screen">

            <div class="panel">

                <h1>GAME OVER</h1>

                <h2>

                    YOU DRANK THE TOLUENE.

                </h2>

                <p>

                    Why would you do that?

                </p>

                <button id="homeButton">

                    MAIN MENU

                </button>

            </div>

        </div>

    `);

    document
        .getElementById("homeButton")
        .addEventListener("click", goHome);

}