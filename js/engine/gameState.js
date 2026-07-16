import { minigames } from "../data/minigames.js";

let state = {

    character: null,

    unlockedGames: ["buffer"],

    achievements: [],

    scores: {}

};

let unlockedGames = ["buffer"];

export function isUnlocked(id) {
    return unlockedGames.includes(id);
}

export function unlockGame(id) {
    if (!unlockedGames.includes(id)) {
        unlockedGames.push(id);
    }
    const game = minigames.find(game => game.id === id);
    if (game) {
        game.unlocked = true;
        game.status = "READY";
    }
}

export function getState() {
    return state;
}

export function setCharacter(id) {
    state.character = id;
}

export function getCharacter() {
    return state.character;
}

