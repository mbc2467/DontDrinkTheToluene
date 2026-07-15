import { showScene, goBack, goHome } from "../engine/sceneManager.js";

export function showMenu() {

    showScene(`

    <div class="screen">

        <div class="panel">

            <h1>Today's Lab Tasks</h1>

            <p class="subtitle">
                Choose an experiment to begin.
            </p>

            <div class="experiment-grid">

                <button id="bufferButton" class="experiment-button">
                    <span class="experiment-icon">🧪</span>
                    Buffer Preparation
                </button>

                <button class="experiment-button" disabled>
                    <span class="experiment-icon">📈</span>
                    Dynamic Light Scattering
                    <small>Coming Soon</small>
                </button>

                <button class="experiment-button" disabled>
                    <span class="experiment-icon">🧬</span>
                    Size Exclusion Chromatography
                    <small>Coming Soon</small>
                </button>

                <button class="experiment-button" disabled>
                    <span class="experiment-icon">⚡</span>
                    Ion Exchange Chromatography
                    <small>Coming Soon</small>
                </button>

            </div>

            <hr>

            <button>
                🏆
            </button>

            <button>
                ⚙
            </button>

            <div class="navigation">

                <button id="backButton">
                    ← Back
                </button>

                <button id="homeButton">
                    ⌂ Home
                </button>

            </div>

        </div>

    </div>

    `);

    document
        .getElementById("backButton")
        .addEventListener("click", goBack);

    document
        .getElementById("homeButton")
        .addEventListener("click", goHome);

    document
        .getElementById("bufferButton")
        .addEventListener("click", () => {

            console.log("Starting Buffer Preparation");

        });
}