let state = {

    character: null,

    unlockedGames: ["buffer"],

    achievements: [],

    scores: {}

};

export function getState() {
    return state;
}

export function setCharacter(id) {
    state.character = id;
}

export function getCharacter() {
    return state.character;
}