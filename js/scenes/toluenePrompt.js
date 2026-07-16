import { showScene } from "../engine/sceneManager.js";
import { showTolueneGameOver } from "./tolueneGameOver.js";

export function showToluenePrompt(onYes, onNo) {

    const overlay = document.createElement("div");

    overlay.className = "modal-overlay";

    overlay.innerHTML = `
        <div class="modal-panel">

            <h2>TOLUENE</h2>

            <p>This bottle isn't part of the recipe.</p>

            <p>Drink it?</p>

            <div class="navigation">

                <button id="yesButton">YES</button>

                <button id="noButton">NO</button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("yesButton").onclick = () => {

        overlay.remove();

        onYes();

    };

    document.getElementById("noButton").onclick = () => {

        overlay.remove();

        onNo();

    };

}