// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#3-client-entrypoints
import { createGame, askForGameList, connect, startGame, play, leaveGame, joinSelectedGame } from './networking';
import { startRendering, stopRendering } from './render';
import { startCapturingInput, stopCapturingInput } from './input';
import { downloadAssets } from './assets';
import { initState } from './state';
import { setLeaderboardHidden } from './leaderboard';
import { addChatMessage } from './chatlog';
import { getGameList } from './playerList';

// I'm using a tiny subset of Bootstrap here for convenience - there's some wasted CSS,
// but not much. In general, you should be careful using Bootstrap because it makes it
// easy to unnecessarily bloat your site.
import './css/bootstrap-reboot.css';
import './css/main.css';


const startMenu = document.getElementById('opening-menu');
const createGameButton = document.getElementById('create-game-button');
const waitForPlayersMenu = document.getElementById('wait-for-players-menu');
const joinGameButton = document.getElementById('join-game-button');
const chooseGameToJoinMenu = document.getElementById('choose-game-to-join-menu');
const startGameButton = document.getElementById('start-game-button');
const leaveGameButton = document.getElementById('leave-game-button');

const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');

Promise.all([
  connect(onGameOver),
  downloadAssets(),
]).then(() => {
  const storedGameId = localStorage.getItem('gameId');
  const storedUsername = localStorage.getItem('username');

  if (storedGameId && storedUsername) {
    console.log(`Auto-rejoining game ${storedGameId} as ${storedUsername}`);
    usernameInput.value = storedUsername; // Restore username to input
    joinSelectedGame(storedGameId, storedUsername);
    // We might want to show the wait menu or game view directly, but the server update will trigger that.
    // However, we should hide the start menu initially to avoid flicker.
    startMenu.classList.add('hidden');
    waitForPlayersMenu.classList.remove('hidden'); // Show wait menu until update arrives
  } else {
    startMenu.classList.remove('hidden');
    usernameInput.focus();
  }

  createGameButton.onclick = () => {
    // Create a new game!
    startMenu.classList.add('hidden');
    console.log(`Creating new game for ${usernameInput.value}`);
    createGame(usernameInput.value);
    waitForPlayersMenu.classList.remove('hidden');
  };
  joinGameButton.onclick = () => {
    // Join an existing game!
    startMenu.classList.add('hidden');
    console.log(`${usernameInput.value} wants to join a game`);
    askForGameList();
    chooseGameToJoinMenu.classList.remove('hidden');
  };
  startGameButton.onclick = () => {
    // Start the game 
    startGame();
  };
  leaveGameButton.onclick = () => {
    leaveGame();
    leaveGameButton.classList.add('hidden');
    document.getElementById('game-view').classList.add('hidden');
    startMenu.classList.remove('hidden');
    //reload page to clear state
    window.location.reload();
  };
  //usernameInput.focus();
  //playButton.onclick = () => {
  // Play!
  //play(usernameInput.value);
  //playMenu.classList.add('hidden');
  //initState();
  //startCapturingInput();
  //startRendering();
  //setLeaderboardHidden(false);
  //};
}).catch(console.error);

function onGameOver() {
  //stopCapturingInput();
  //stopRendering();
  //playMenu.classList.remove('hidden');
  //setLeaderboardHidden(true);
}
