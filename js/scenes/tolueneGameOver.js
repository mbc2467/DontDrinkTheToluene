import { showScene} from "../engine/sceneManager.js";
import { showTitle } from "./title.js";
import { setScene } from "../engine/sceneManager.js";

export function showTolueneGameOver() {

    showScene(`

    <div class="screen">

        <div class="panel gameover-panel">

            <div class="gameover-text">

                <h1>GAME OVER</h1>

                <h2>
                    YOU DRANK THE TOLUENE.
                </h2>

                <p class="gameover-message">
                    You are dead, but more importantly,
                    Dr. Thurston is disappointed in you.
                </p>

                <button id="homeButton">
                    MAIN MENU
                </button>

            </div>

            <div class="gameover-image">

                <img
                    src="assets/images/TolueneThurstonSprite.png"
                    alt="Dr. Thurston"
                    class="thurston-sprite">

            </div>

        </div>

    </div>

    `);

    document
        .getElementById("homeButton")
        .addEventListener("click", () => {
            setScene(showTitle);
        });

}