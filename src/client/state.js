// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#7-client-state
import { renderBoards, drawButtons, displayGameTitle } from './render';

let lastUpdate = null;

window.addEventListener('resize', () => {
  if (lastUpdate) {
    renderBoards(lastUpdate.boards, lastUpdate.discards, lastUpdate.yourHand, lastUpdate.playerNames);
  }
});



const waitForPlayersMenu = document.getElementById('wait-for-players-menu');
const gameView = document.getElementById('game-view');

export function processGameUpdate(update) {
  //print the update
  console.log('Game update received:', update);
  lastUpdate = update;
  if (update.id) {
    localStorage.setItem('gameId', update.id);
    // Also save username if we have it (though it's better to save it on join)
    const usernameInput = document.getElementById('username-input');
    if (usernameInput && usernameInput.value) {
      localStorage.setItem('username', usernameInput.value);
    }
  }
  waitForPlayersMenu.classList.add('hidden');
  gameView.classList.remove('hidden');
  document.getElementById('leave-game-button').classList.remove('hidden');
  //update game name
  const gameNameValue = document.getElementById('game-name-value');
  gameNameValue.innerText = update.name;
  //update turn indicator
  const turnIndicator = document.getElementById('turn-indicator');
  turnIndicator.innerText = `${update.currentPlayerName}'s turn to ${update.state}`;
  renderBoards(update.boards, update.discards, update.yourHand, update.playerNames);
  drawButtons(update.state, update.discards, update.playerNames, update.deckSize, update.scores);
  //if update.scores are nonzero

}


