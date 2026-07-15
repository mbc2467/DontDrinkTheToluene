const app = document.getElementById("app");

let currentScene = null;
let previousScene = null;

export function showScene(html) {
    app.innerHTML = html;
}

export function setScene(sceneFunction) {

    previousScene = currentScene;
    currentScene = sceneFunction;

    sceneFunction();
}

export function goBack() {

    if (previousScene) {

        const scene = previousScene;

        previousScene = currentScene;
        currentScene = scene;

        scene();

    }

}

export function goHome() {

    import("../scenes/title.js").then(module => {
        currentScene = module.showTitle;
        previousScene = null;
        module.showTitle();
    });

}