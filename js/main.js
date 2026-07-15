const game = document.getElementById("game");

function showTitleScreen() {

    game.innerHTML = `
        <h1>DON'T DRINK THE TOLUENE</h1>

        <h2>DDTT</h2>

        <button id="playButton">Play</button>

        <button>Achievements</button>

        <button>Credits</button>

        <p>Version 0.1</p>
    `;

    document.getElementById("playButton")
        .addEventListener("click", showLabMenu);

}

function showLabMenu() {

    game.innerHTML = `
        <h1>Day 1</h1>

        <button>Buffer Preparation</button>

        <button disabled>Dynamic Light Scattering</button>

        <button disabled>SEC</button>

        <button>Back</button>
    `;

}

showTitleScreen();