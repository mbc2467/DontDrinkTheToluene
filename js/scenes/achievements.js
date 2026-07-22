import { showTitle } from "./title.js";
import { showScene, setScene } from "../engine/sceneManager.js";
import { achievementsList } from "../data/achievementsInfo.js";

import { showAchievementPopup } from "../scenes/achievementPopup.js";

export function showAchievements(){
    let html = `
    <div class="screen">
        <div class="panel" id="achievements-panel">

            <h1>ACHIEVEMENTS</h1>

            <div class="achievement-grid">
    `;

    for (const achievement of achievementsList) {
        html += createAchievementCard(achievement);
    }

    html += `
            </div>

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
export function unlockAchievement(id){

    const achievement =
        achievementsList.find(a => a.id === id);

    if (!achievement) return;

    if (achievement.unlocked) return;

    achievement.unlocked = true;

    showAchievementPopup(achievement.title);

}

export function hasAchievement(id){

    return achievementsList.find(a => a.id === id)?.unlocked;

}
function createAchievementCard(achievement){

    if(!achievement.unlocked && achievement.hidden){

        return `
            <div class="achievement-card locked">

                <h3>?</h3>

                <p>Hidden</p>

            </div>
        `;

    }

    return `

        <div class="achievement-card ${achievement.unlocked ? "unlocked" : "locked"}">

            <h3>${achievement.title}</h3>

            <p>${achievement.description}</p>

        </div>

    `;

}