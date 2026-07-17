import { showScene } from "../engine/sceneManager.js";
import { showTolueneGameOver } from "./tolueneGameOver.js";
import { showTitle } from "./title.js";
import { setScene } from "../engine/sceneManager.js";
import { tolueneSprite } from "../data/sprites.js";

let funnyPrompts = [
    "This bottle looks interesting.",
    "This bottle smells vaguely of cherries.",
    "This bottle has a skull and crossbones on it.",
    "Malcolm says this bottle is totally safe to drink.",
    "Dr. Thurston gives you a stern look",
    "Dr. Thurston says 'DDTT' but you don't know what it means.",
]

export function showToluenePrompt(onYes, onNo) {

    const overlay = document.createElement("div");

    overlay.className = "modal-overlay";

    overlay.innerHTML = `
        <div class="modal-panel">

            <h2>TOLUENE</h2>
    
            <p>${funnyPrompts[Math.floor(Math.random() * funnyPrompts.length)]}</p>

            <p>Drink it?</p>

            <div class="navigation">

                <button id="yesButton">YES</button>

                <button id="noButton">NO</button>

            </div>

            <img
                src="assets/images/TOLUENE.png"
                alt="toluene"
                class="toluene-sprite">

        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("yesButton").onclick = () => {

        overlay.remove();

        setScene(showTolueneGameOver);

    };

    document.getElementById("noButton").onclick = () => {

        overlay.remove();

        onNo();

    };

}