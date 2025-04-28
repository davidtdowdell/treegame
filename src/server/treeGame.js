const Constants = require('../shared/constants');


class Card {
  constructor(species, number, row = null, col = null) {
    this.species = species;
    this.number = number;
    this.row = row;
    this.col = col;
  }
}

class Garden {
  constructor() {
    this.cards = [];
  }
  addCard(card) {
    this.cards.push(card);
  }
}


class TreeGame {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.players = {};
    this.state = {};
    this.playerNames = {};
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
    this.playerNames[socket.id] = username;
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
    this.numSpecies = 2// 4 + 2 * playerCount;
    //if (this.numSpecies > 10) {
    //  console.log(`Too many players, max species is 10`);
    //  this.numSpecies = 10;
    //}
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
      this.boards[this.players[player].socket.id] = new Garden();
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
        //name of all players
        playerNames: this.playerNames,
        //id of current player
        currentPlayer: this.currentPlayer,
        deckSize: this.deck.length,

      });
    }
  }
  processDrawRequest(socket, discard_id) {
    console.log(`Processing draw request from ${socket.id} for discard ${discard_id}`);
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
      //draw from deck if deck is not empty
      if (this.deck.length === 0) {
        console.log(`Deck is empty, cannot draw`);
        return;
      }
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
  processPlayRequest(socket, card){
    //check if the player is the current player
    if (socket.id !== this.currentPlayer) {
      console.log(`It's not your turn ${socket.id}`);
      return;
    }
    // check if state is play
    if (this.state !== Constants.GAME_STATES.PLAY) {
      console.log(`State is not play ${this.state}`);
      return;
    }
    // Check that card is not null
    if (card === null) {
      console.log(`Card is null`);
      return;
    }
    // find the index of the card in hand that matches the species and number
    const index = this.playerHands[socket.id].findIndex(c => c.species === card.species && c.number === card.number);
    if (index === -1) {
      console.log(`Card ${card.species} ${card.number} not found in hand`);
      return;
    }
    // Make sure the card's row and col are not already occupied
    if (this.boards[socket.id].cards.some(c => c.row === card.row && c.col === card.col)) {
      console.log(`Card ${card.row} ${card.col} already exists on board`);
      return;
    }
    console.log(`Player ${this.players[socket.id].username} played ${card.species} ${card.number} to row ${card.row} col ${card.col}`);
    // remove card from hand
    this.playerHands[socket.id].splice(index, 1);
    //add card to board 
    this.boards[socket.id].addCard(new Card(card.species, card.number, card.row, card.col));
    //update state to discard
    this.state = Constants.GAME_STATES.DISCARD;

    //send the game state to all players
    this.sendGameData();
  }
  calculateScores() {
    console.log(`Calculating scores`);
    // create a score object for each player
    const scores = {};
    for (const player in this.players) {
      scores[this.players[player].socket.id] = 0;
    }
    // iterate through each species
    for (let i = 0; i < this.numSpecies; i++) {
      // does any player have the 1st card of this species in hand?
      let hasFirstCard = false;
      for (const player in this.players) {
        const playerHand = this.playerHands[this.players[player].socket.id];
        if (playerHand.some(c => c.species === i && c.number === 1)) {
          hasFirstCard = player;
          console.log(`Player ${this.players[player].username} has the 1st card of species ${i}`);
          break;
        }
      }
      // if another player has the 8, set it to 0
      if (hasFirstCard) {
        for (const player in this.players) {
          const key = this.players[player].socket.id;
          const hand = this.playerHands[key];
          if (key !== hasFirstCard) {
            for (const card of hand) {
              if (card.species === i && card.number === 8) {
                card.number = 0;
                console.log(`Player ${this.players[key].username} has 8 of species ${i}, score set to 0`);
              }
            }
          }
        }
      }
      //now determine the highest sum of cards of that species
      // iterate through each player and calculate their score
      let maxScore = -1;
      let speciesSums = {};
      for (const player in this.players) {
        const key = this.players[player].socket.id;
        const hand = this.playerHands[key];
        const score = hand.reduce((acc, card) => {
          if (card.species === i) {
            return acc + card.number;
          }
          return acc;
        }, 0);
        if (score > maxScore) {
          maxScore = score;
        }
        speciesSums[key] = score;
        console.log(`Player ${this.players[player].username} has a score of ${score} for species ${i}`);
      }
      for (const player in this.players) {
        const key = this.players[player].socket.id;
        if (speciesSums[key] === maxScore) {
          console.log(`Player ${this.players[player].username} has the highest score of ${maxScore} for species ${i}`);
          //todo: add score to player
        }
      }
    }//end for loop for species
  }

  processDiscardRequest(socket, card) {
    //check if the player is the current player
    if (socket.id !== this.currentPlayer) {
      console.log(`It's not your turn ${socket.id}`);
      return;
    }
    // check if state is discard
    if (this.state !== Constants.GAME_STATES.DISCARD) {
      console.log(`State is not discard ${this.state}`);
      return;
    }
    // Check that card is not null
    if (card === null) {
      console.log(`Card is null`);
      return;
    }
    // find the index of the card in hand that matches the species and number
    const index = this.playerHands[socket.id].findIndex(c => c.species === card.species && c.number === card.number);
    if (index === -1) {
      console.log(`Card ${card.species} ${card.number} not found in hand`);
      return;
    }
    console.log(`Player ${this.players[socket.id].username} discarded ${card.species} ${card.number}`);
    // remove card from hand
    this.playerHands[socket.id].splice(index, 1);
    //add card to discard pile
    this.discards[socket.id].push(new Card(card.species, card.number));
    //update state to draw
    this.state = Constants.GAME_STATES.DRAW;
    //set the current player to the next player
    this.currentPlayer = Object.keys(this.players)[(Object.keys(this.players).indexOf(socket.id) + 1) % Object.keys(this.players).length];
    
    //if the current deck is empty, end the game
    if (this.deck.length === 0) {
      console.log(`Deck is empty, ending game`);
      this.state = Constants.GAME_STATES.END;
      this.calculateScores();
      this.sendGameData();
      return;
    }

    //send the game state to all players
    this.sendGameData();
  }
}



module.exports = TreeGame;
