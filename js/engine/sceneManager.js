const app = document.getElementById("app");

export function showScene(html) {
    app.innerHTML = html;
}

export function setScene(sceneFunction) {
    sceneFunction();
}