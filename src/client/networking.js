// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#4-client-networking
import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';
import { processGameUpdate } from './state';
import { addChatMessage } from './chatlog';
import { listPlayers, listGames } from './playerList';

const Constants = require('../shared/constants');

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });
const connectedPromise = new Promise(resolve => {
  socket.on('connect', () => {
    console.log('Connected to server!');
    resolve();
  });
});

export const connect = onGameOver => (
  connectedPromise.then(() => {
    // Register callbacks
    socket.on(Constants.MSG_TYPES.PLAYER_LIST, listPlayers);
    socket.on(Constants.MSG_TYPES.GAME_LIST, listGames);

    socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
    socket.on(Constants.MSG_TYPES.GAME_OVER, onGameOver);
    socket.on(Constants.MSG_TYPES.CHAT, (message) => {
      console.log('Chat message received:', message);
      addChatMessage(message);
    });
    socket.on('disconnect', () => {
      console.log('Disconnected from server.');
      document.getElementById('disconnect-modal').classList.remove('hidden');
      document.getElementById('reconnect-button').onclick = () => {
        window.location.reload();
      };
    });
  })
);

export const createGame = username => {
  socket.emit(Constants.MSG_TYPES.CREATE_GAME, username);
}

export const askForGameList = () => {
  socket.emit(Constants.MSG_TYPES.ASK_FOR_GAME_LIST);
}

export const joinSelectedGame = gameId => {
  const usernameInput = document.getElementById('username-input');
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, gameId, usernameInput.value);
}

export const startGame = () => {
  socket.emit(Constants.MSG_TYPES.START_GAME);
}

export const play = username => {
  socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export const updateDirection = throttle(20, dir => {
  socket.emit(Constants.MSG_TYPES.INPUT, dir);
});

export const sendChatToServer = (message) => {
  socket.emit(Constants.MSG_TYPES.CHAT, message);
}
