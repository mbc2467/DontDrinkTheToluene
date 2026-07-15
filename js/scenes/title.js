import { showScene } from "../engine/sceneManager.js";
import { showCharacterSelect } from "./characterSelect.js";

export function showTitle() {

    showScene(`

        <div class="screen">

            <div class="panel">

                <h1 class="game-title">
                    Don't Drink the Toluene
                </h1>

                <p class="subtitle">
                    Thurston Lab Summer 2026
                </p>

                <button id="playButton" class="primary-button">
                    Play
                </button>

                <button class="secondary-button">
                    Achievements
                </button>

                <button class="secondary-button">
                    Credits
                </button>

            </div>

        </div>

    `);

    document
        .getElementById("playButton")
        .addEventListener("click", showCharacterSelect);

}