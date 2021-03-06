//import { DynamicElement } from './percentTemplate.js';

/**
 * @typedef SongData
 * @property {String} name
 */

/**
 * Resets the state of the run
 */
function stateReset(apply = true) {
    const rstState = {
        currentStage: 0,
        songBlacklist: {},
        selectedSong: null,
        sortSongs: 'availability',
        openSongList: false,
        enableStageClearPreviousSongs: true
    };
    if (apply) {
        state = rstState;
    }
    return rstState;
}

function toggleSongClear() {
    state.enableStageClearPreviousSongs = !state.enableStageClearPreviousSongs;
    stateChanged();
}
  
let state = stateReset(false);
  
function stateChanged() {
    updateElements();
}

const availSongs = new DynamicElement()
const optSongList = new DynamicElement()
const optStageClear = new DynamicElement()
const currentStage = new DynamicElement()

const randomSongPrompt = Object.assign(
    new DynamicElement(null, {}, true),
    {
        /** @type {SongData} */
        current: null
    }
);

const selectedSong = new DynamicElement(null, {}, true);

const songList = {
    /** @type {HTMLDivElement} */
    element: null
}

let data = {};

function lexOrder(a1, a2) {
    const l = Math.min(a1.length, a2.length);
    for(let i = 0; i < l; ++i) {
        if (a1[i] < a2[i]) {
        return -1;
        } else if (a1[i] > a2[i]) {
        return 1;
        }
    }
    if (a1.length < a2.length) {
        return -1;
    } else if (a1.length > a2.length) {
        return 1;
    } else {
        return 0;
    }
}

const SORTMODES = {
  'name': {
    label: 'Name',
    cmpFn: (w1, w2) => lexOrder([w1.name], [w2.name])
  },
  'availability': {
    label: 'Availability',
    cmpFn: (w1, w2) => lexOrder([!!state.songBlacklist[w1.name]], [!!state.songBlacklist[w2.name]])
  },
  'availabilityAndName': {
    label: 'Availability and Name',
    cmpFn: (w1, w2) => lexOrder([!!state.songBlacklist[w1.name], w1.name], [!!state.songBlacklist[w2.name], w2.name])
  }
};

/**
 * Gets all available songs with VIP or without VIP with the specified blacklist
 * @param {Number} [stageI] - The stage's index
 * @param {Object<String, Boolean>} [blacklist] - The songs' blacklist
 * @returns {SongData[]} An array that contains all available songs
 */
function getAvailableSongs(stageI = 0, blacklist = state.songBlacklist) {
    let songs = [];
    /** @type {String[]} */
    const stages = data.diffs;
    stageI = Math.min(Math.max(stageI, 0), stages.length);
    for (let i = 0; i <= stageI; i++) {
        if (state.enableStageClearPreviousSongs) {
            songs = [];
        }
        songs.push(...stages[i].songs);
    }
    return songs.filter(w => !blacklist[w.name]);
}

/**
 * Returns the name of the specified stage
 * @param {Number} [stageI] - The stage's index
 * @returns {String} The name of the specified stage
 */
function getStageName(stageI = 0) {
    return data.diffs[Math.min(Math.max(stageI, 0), data.diffs.length - 1)].name;
}

/**
 * Picks a random song that is available at the specified stage with the specified blacklist
 * @param {Number} [stageI] - The stage's index
 * @param {Object<String, Boolean>} [blacklist] - The songs' blacklist
 * @returns {SongData} The name of a randomly picked song
 */
function pickRandomSong(stageI = 0, blacklist = state.songBlacklist) {
    const availSongs = getAvailableSongs(stageI, blacklist);
    return availSongs[Math.floor(Math.random() * availSongs.length)];
}

/**
 * Goes to the next stage
 */
function toggleDifficulty() {
    if (state.currentStage < data.diffs.length - 1) {
        ++state.currentStage;
        stateChanged();
    }
    else {
        state.currentStage = 0
        stateChanged()
    }
}

/**
 * Creates a new HTML string from the specified song
 * @param {SongData} song - The song to create the HTML string from
 * @returns {String} The HTML for the specified song
 */
//works
function createSongHTML(song) {
    if (song === null || song === undefined) {
        return "None";
    }
    return song.name;
}

/**
 * Called when "getRandomSong" button is pressed
 */
function getRandomSongPressed() {
    randomSongPrompt.parent.classList.remove("hidden");
    
    const selSong = pickRandomSong(state.currentStage);
    randomSongPrompt.current = selSong;
    randomSongPrompt.update({ SELECTED_SONG: createSongHTML(selSong) });
}

/**
 * Populates the list of songs and creates all needed elements
 */
function populateSongList() {
    songList.element.classList.toggle("hidden", !state.openSongList);
    if (!state.openSongList) {
        return;
    }
  
    while (songList.element.lastElementChild !== null) {
        songList.element.removeChild(songList.element.lastElementChild);
    }
  
    const allSongs = getAvailableSongs(state.currentStage, { });
    allSongs.sort(SORTMODES[state.sortSongs].cmpFn);
    for (const song of allSongs) {
        const name = song.name;
        const div = document.createElement("div");
    
        const button = document.createElement("button");
        button.id = `blacklistButton_${name}`;
        button.classList.add("defaultButton", "songListButton", "left");
        button.innerText = state.songBlacklist[name] ? "W" : "B";
    
        const label = document.createElement("label");
        if (createSongHTML(song).length <= 22) {
            label.innerHTML = `<span style="color: ${state.selectedSong !== null && state.selectedSong.name === name ? "blue" : state.songBlacklist[name] ? "red" : "white"};overflow-x:hidden">${createSongHTML(song)}</span>`
        }
        else {
            label.innerHTML = `<span style="color: ${state.selectedSong !== null && state.selectedSong.name === name ? "blue" : state.songBlacklist[name] ? "red" : "white"};overflow-x:hidden">${createSongHTML(song).slice(0,22)+"..."}</span>`
        };
        label.classList.add("defaultText", "songListLabel");
        label.htmlFor = button.id;
    
        button.addEventListener("click", (ev) => {
            state.songBlacklist[name] = !state.songBlacklist[name];
            stateChanged();
        });
    
        div.appendChild(button);
        div.appendChild(label);
    
        songList.element.appendChild(div);
    };
}


/**
* Updates all elements on the page with the right information
*/
function updateElements() {
    currentStage.update({ CURRENT_STAGE: getStageName(state.currentStage) });
    selectedSong.update({ CURRENT_SONG: createSongHTML(state.selectedSong) });
    availSongs.update({ SONG_COUNT: getAvailableSongs(state.currentStage, state.songBlacklist).length });
    optSongList.update({ ACTION: state.openSongList ? "Close" : "Open" });
    optStageClear.update({ ACTION: state.enableStageClearPreviousSongs ? "Disable" : "Enable" });

    populateSongList();
}

/**
* Toggles song list's visibility
*/
function toggleSongList() {
    state.openSongList = !state.openSongList;
    stateChanged();
}

/**
* Accepts or rejects the currently random picked song
* @param {Boolean} accept - Whether or not to accept the song
* @param {Boolean} addToBlacklist - Whether or not to add the song to the blacklist
*/
function confirmRandomSong(accept = true, addToBlacklist = true) {
    randomSongPrompt.parent.classList.add("hidden");
    state.selectedSong = accept ? randomSongPrompt.current : null;
    if (addToBlacklist) {
        state.songBlacklist[randomSongPrompt.current.name] = true;
    }
    stateChanged();
}

window.addEventListener("load", async () => {
    currentStage.element = document.getElementById("currentStage");
    availSongs.element = document.getElementById("availSongs");
    randomSongPrompt.element = document.getElementById("randomlySelectedSong");
    selectedSong.element = document.getElementById("selectedSong");
    songList.element = document.getElementById("songList");
    optSongList.element = document.getElementById("optSongList");
    optStageClear.element = document.getElementById("optStageClear");

    data = await (await fetch("data.json")).json();

    /*
    document.body.onbeforeunload = (ev) => {
    // Show unsaved state
    if (isDirty) {
        ev.preventDefault();
        ev.returnValue = '';
        return '';
    }
    };
    */
    stateChanged();
});
