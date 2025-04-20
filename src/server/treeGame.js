const Constants = require('../shared/constants');


class Card {
  constructor(species, number) {
    this.species = species;
    this.number = number;
    this.left = null;
    this.right = null;
    this.top = null;
    this.bottom = null;
  }
}


class TreeGame {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.players = {};
    this.state = {};
    this.playerNames = [];
    this.canJoin = true;
    this.deck = [];
    this.numSpecies = 0;
    this.playerHands = {};
    this.discards = {};
    this.boards = {};
    this.currentPlayer = null;
    this.state = null;
  }
  addPlayer(socket, username) {
    console.log(`Adding player ${username} to game ${this.name}`);
    this.players[socket.id] = { username, socket };
    this.playerNames.push(username);
    //socket.join(this.id);
    //send player list to all players
    for (const player in this.players) {
      console.log(`Sending player list to ${this.players[player].username}`);
      this.players[player].socket.emit(Constants.MSG_TYPES.PLAYER_LIST, this.playerNames);
    }
  }
  start() {
    console.log(`Starting game ${this.name}`);
    this.canJoin = false;
    //count the number of players
    const playerCount = Object.keys(this.players).length;
    this.numSpecies = 4 + 2 * playerCount;
    //create the deck
    this.deck = [];
    for (let i = 0; i < this.numSpecies; i++) {
        for (let j = 1; j <=8; j++){
            this.deck.push(new Card(i, j));
        }
    }
    //create a discard stack for each player
    for (const player in this.players) {
      this.discards[this.players[player].socket.id] = [];
    }
    //create a board for each player
    for (const player in this.players) {
      this.boards[this.players[player].socket.id] = null;
    }
    //shuffle the deck
    this.deck = this.deck.sort(() => Math.random() - 0.5);
    //deal 7 cards to each player
    for (const player in this.players) {
      this.playerHands[this.players[player].socket.id] = [];
      for (let i = 0; i < 7; i++) {
        this.playerHands[this.players[player].socket.id].push(this.deck.pop());
      }
    }
    //print each player's hand
    for (const player in this.players) {
      console.log(`Player ${this.players[player].username}'s hand:`);
      console.log(this.playerHands[this.players[player].socket.id]);
    }
    //set the current player to the first player and state to draw
    this.currentPlayer = Object.keys(this.players)[0];
    this.state = Constants.GAME_STATES.DRAW;
    //send the game state to all players
    this.sendGameData();
  }
  sendGameData() {
    console.log(`Sending game data to players with state ${this.state}`);
    for (const player in this.players) {
      this.players[player].socket.emit(Constants.MSG_TYPES.GAME_UPDATE, {
        name: this.name,
        state: this.state,
        //only the current player's hand to that player
        yourHand: this.playerHands[this.players[player].socket.id],
        discards: this.discards,
        boards: this.boards,
        //name of current player
        currentPlayerName: this.players[this.currentPlayer].username,

      });
    }
  }
  processDrawRequest(socket, discard_id) {
    console.log(`Processing draw request from ${socket.id}`);
    //check if the player is the current player
    if (socket.id !== this.currentPlayer) {
      console.log(`It's not your turn ${socket.id}`);
      return;
    }
    // check if state is draw
    if (this.state !== Constants.GAME_STATES.DRAW) {
      console.log(`State is not draw ${this.state}`);
      return;
    }

    //if discard_id is null, draw from deck
    if (discard_id === null) {
      //draw from deck
      const card = this.deck.pop();
      this.playerHands[socket.id].push(card);
      console.log(`Player ${this.players[socket.id].username} drew ${card.species} ${card.number}`);
    } else {
      //draw from discard pile
      const card = this.discards[discard_id].pop();
      this.playerHands[socket.id].push(card);
      console.log(`Player ${this.players[socket.id].username} drew ${card.species} ${card.number} from discard pile`);
    }
    // if player hand has 9 cards, set the state to play
    if (this.playerHands[socket.id].length === 9) {
      this.state = Constants.GAME_STATES.PLAY;
      console.log(`Player ${this.players[socket.id].username} has 9 cards, state set to play`);
    }
    //send the game state to all players
    this.sendGameData();
  }

  
}



module.exports = TreeGame;
