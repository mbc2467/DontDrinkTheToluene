import { minigames } from "../data/minigames.js";
import { characters } from "../data/characters.js";

export const DEBUG = false;

let state = {

    character: null,

    unlockedGames: ["buffer"],

    achievements: [],

    scores: {}

};

let unlockedGames = ["buffer"];
if (DEBUG) {

    minigames.forEach(game => {

        game.unlocked = true;
        game.status = "READY";

    });

}

export function isUnlocked(id) {
    return state.unlockedGames.includes(id);
}

export function unlockGame(id) {
    if (DEBUG) return;
    
    if (!state.unlockedGames.includes(id)) {
        state.unlockedGames.push(id);
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

export function unlockMalcolm() {
  const malcolm = characters.find(char => char.id === 'malcolm');

  if (malcolm) {
    malcolm.unlocked = true;
    malcolm.description = "Training complete. Malcolm is now available!";
  }
}
