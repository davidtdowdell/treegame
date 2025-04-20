const Constants = require('../shared/constants');

const TreeGame = require('./treeGame');


class GameList {
  constructor() {
    this.games = {};
  }
  createGame(socket, username) {
    console.log(`Creating game for ${username}`);
    //const gameId = this.generateGameId();
    const game = new TreeGame(`${username}'s game`, socket.id);
    this.games[socket.id] = game;
    game.addPlayer(socket, username);
    //socket.join(socket.id);
    //socket.emit(Constants.MSG_TYPES.GAME_UPDATE, game.getState());
  }
  getAvailableGames(socket) {
    //Send list of available games to the player, but only if canJoin is true
    const availableGames = Object.values(this.games).filter(game => game.canJoin);
    const gameList = availableGames.map(game => ({ name: game.name, id: game.id }));
    socket.emit(Constants.MSG_TYPES.GAME_LIST, gameList);
    console.log('Sending available games to player');
  }
  joinGame(socket, gameId, username) {
    console.log(`Joining game ${gameId} as ${username}`);
    const game = this.games[gameId];
    if (game && game.canJoin) {
      game.addPlayer(socket, username);
    } else {
      console.log(`Game ${gameId} is not available`);
    }
  }
  startGame(socket) {
    //determine which game the player is in
    const game = Object.values(this.games).find(game => game.players[socket.id]);
    if (game) {
      console.log(`Starting game ${game.name}`);
      game.start()
      //socket.join(game.id);
      for (const player in game.players) {
        console.log(`Starting game for ${game.players[player].username}`);
        //game.players[player].socket.emit(Constants.MSG_TYPES.GAME_UPDATE, game.getState());
      }
    } else {
      console.log(`Game not found for player ${socket.id}`);
    }
  }
  processDrawRequest(socket, discard_id) {
    //determine which game the player is in
    const game = Object.values(this.games).find(game => game.players[socket.id]);
    if (game) {
      console.log(`Processing draw request for ${socket.id}`);
      game.processDrawRequest(socket, discard_id);
    } else {
      console.log(`Game not found for player ${socket.id}`);
    }
  }

}

module.exports = GameList;
