import { showTitle } from "./title.js";
import { showScene, setScene } from "../engine/sceneManager.js";

export function showCredits(){
    // Display the credits scene
    let html = `
        <div class="screen">
            <div class="panel">
                <h1>CREDITS</h1>
                <p class="subtitle">
                    Created by: Mallory
                </p>
                <div class="navigation">
                    <button id="backButton">
                    BACK
                    </button>
                </div>
            </div>
        </div>
    `;
    showScene(html);
    document
        .getElementById("backButton")
        .addEventListener("click", () => {
            setScene(showTitle);
        });
}