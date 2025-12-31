const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');

const Constants = require('../shared/constants');
const GameList = require('./gameList');
const webpackConfig = require('../../webpack.dev.js');

// Setup an Express server
const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
  // Setup Webpack for development
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  // Static serve the dist/ folder in production
  app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);

// Listen for socket.io connections
io.on('connection', socket => {
  console.log('Player connected!', socket.id);
  // Listen for game creation
  socket.on(Constants.MSG_TYPES.CREATE_GAME, createGame);
  // Listen for game list request
  socket.on(Constants.MSG_TYPES.ASK_FOR_GAME_LIST, getGameList);
  // Listen for game joining
  socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  // Listen for game starting
  socket.on(Constants.MSG_TYPES.START_GAME, startGame);
  // Listen for draw request
  socket.on(Constants.MSG_TYPES.DRAW_REQUEST, processDrawRequest);
  // Listen for play request
  socket.on(Constants.MSG_TYPES.PLAY_REQUEST, processPlayRequest);
  // Listen for discard request
  socket.on(Constants.MSG_TYPES.DISCARD_REQUEST, processDiscardRequest);

  socket.on(Constants.MSG_TYPES.CHAT, (message) => {
    console.log('Chat message received:', message);
    const username = socket.username || 'Anonymous'; // Replace with actual username logic
    // Broadcast the chat message to all players
    io.emit(Constants.MSG_TYPES.CHAT, { username, message });
  });

  socket.on(Constants.MSG_TYPES.LEAVE_GAME, leaveGame);
  socket.on('disconnect', onDisconnect);
});

// Setup the Game List
const gameList = new GameList();

function createGame(username, playerId) {
  gameList.createGame(this, username, playerId);
}

function getGameList() {
  gameList.getAvailableGames(this);
}

function joinGame(gameId, username, playerId) {
  console.log(`Joining game ${gameId} as ${username} with playerId ${playerId}`);
  gameList.joinGame(this, gameId, username, playerId);
}

function startGame() {
  gameList.startGame(this);
}

function processDrawRequest(card) {
  console.log(`Processing draw request for ${card}`);
  gameList.processDrawRequest(this, card);
}

function processPlayRequest(card, location) {
  gameList.processPlayRequest(this, card, location);
}

function processDiscardRequest(card) {
  gameList.processDiscardRequest(this, card);
}



function leaveGame() {
  console.log('Player left game!', this.id);
  gameList.endGame(this);
}

function onDisconnect() {
  console.log('Player disconnected!', this.id);
}
