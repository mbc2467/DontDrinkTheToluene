import { showScene} from "../engine/sceneManager.js";
import { showTitle } from "./title.js";
import { setScene } from "../engine/sceneManager.js";
import { getCharacter } from "../engine/gameState.js";

export function showTolueneGameOver() {
    let html = '';
    console.log('CHARACTER: ' + getCharacter());
    if (getCharacter() === "malcolm") {
        html += `
        <div class="screen">
            <div class="panel gameover-panel">
                <div class="gameover-text">
                    <h1>YOU WIN</h1>
                    <h2>
                        YOU DRANK THE TOLUENE.
                    </h2>
                    <p class="gameover-message">
                        Dr. Thurston nods with approval and you are awarded your PhD on the spot. Against all known laws of chemistry, the toluene grants you complete mastery of protein science and your next paper is accepted into Nature before you've even written it. The spirit of Carl Sagan emerges and announces you have unlimited beamtime at CHESS.
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
        `
    } else {
        html += `
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
        `
    }
    showScene(html);

    document
        .getElementById("homeButton")
        .addEventListener("click", () => {
            setScene(showTitle);
        });

}