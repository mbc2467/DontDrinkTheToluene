const queue = [];
let showing = false;

export function showAchievementPopup(title) {

    queue.push(title);

    if (!showing) {
        displayNext();
    }

}

function displayNext() {

    if (queue.length === 0) {

        showing = false;
        return;

    }

    showing = true;

    const title = queue.shift();

    const popup = document.createElement("div");

    popup.className = "achievement-popup";

    popup.innerHTML = `
        <div class="achievement-popup-title">
            ACHIEVEMENT UNLOCKED
        </div>

        <div class="achievement-popup-name">
            ${title}
        </div>
    `;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.classList.add("show");
    });

    setTimeout(() => {

        popup.classList.remove("show");

        setTimeout(() => {

            popup.remove();

            displayNext();

        }, 300);

    }, 3000);

}