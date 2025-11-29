// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';
import { set } from 'lodash';
import { sendDrawRequest, sendPlayRequest, sendDiscardRequest } from './networking';

const Constants = require('../shared/constants');

const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = Constants;

const waitForPlayersMenu = document.getElementById('wait-for-players-menu');

// Get the canvas graphics context
//const canvas = document.getElementById('game-canvas');
//const context = canvas.getContext('2d');
//const dpr = window.devicePixelRatio || 1;
//setCanvasDimensions();

function setCanvasDimensions() {

  const canvasWidth = 1000; // Desired display width
  const canvasHeight = 800; // Desired display height

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
  context.scale(dpr, dpr);

}

const speciesColors = [
  //10 different colors for the species
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'brown',
  'cyan',
  'magenta',
];

class Card {
  constructor(species, number, row = null, col = null) {
    this.species = species;
    this.number = number;
    this.row = row;
    this.col = col;
    this.x = null;
    this.y = null;
    this.width = null;
    this.height = null;
    this.north = null;
    this.south = null;
    this.east = null;
    this.west = null;
  }
  displayCard(context, x, y, width, height, highlight = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    //draw a rectangle for the card, fill with species color
    if (this.species !== null) {
      context.fillStyle = speciesColors[this.species];
      context.fillRect(x, y, width, height);
    }
    //draw a border around the card
    context.strokeStyle = highlight ? 'white' : 'black';
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);
    if (this.number !== null) {
      // draw a circle in the middle of the card
      context.beginPath();
      context.arc(x + width / 2, y + height / 2, width / 3, 0, Math.PI * 2);
      context.fillStyle = 'white';
      context.fill();
      context.strokeStyle = 'black';
      context.lineWidth = 2;
      context.stroke();
      context.closePath();
      //draw the number in the circle
      context.fillStyle = 'black';
      context.font = `${Math.floor(width * 0.4)}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(this.number, x + width / 2, y + height / 2);
    }
  }
  //check if the card is clicked
  isClicked(mouseX, mouseY) {
    if (mouseX > this.x && mouseX < this.x + this.width && mouseY > this.y && mouseY < this.y + this.height) {
      return true;
    }
    return false;
  }
  //highlight the card
  highlight(context) {
    context.strokeStyle = 'white';
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.width, this.height);
  }
  //unhighlight the card
  unhighlight(context) {
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.width, this.height);
  }

}

let selectedCard = null;


class Hand {
  constructor(canvas, context, label, isDiscard = false) {
    this.handCanvas = canvas;
    this.handContext = context;
    const maxWidth = Math.min(700, window.innerWidth - 20);
    this.handCanvas.width = maxWidth;
    this.handCanvas.height = 100;
    this.handCanvas.style.width = maxWidth + 'px';
    this.handCanvas.style.height = '100px';
    this.handCanvas.style.backgroundColor = 'green';
    this.handContext.fillStyle = 'white';
    this.label = label;
    this.isDiscard = isDiscard
    this.cards = [];
    selectedCard = null;
    this.selectedCardIndex = null;
  }
  addCard(species, number) {
    this.cards.push(new Card(species, number));
  }
  addCards(cards) {
    cards.forEach((card) => {
      this.addCard(card.species, card.number);
    });
  }
  displayHand() {
    // clear the canvas
    this.handContext.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
    //Put label inside the canvas
    this.handContext.font = '18px Arial';
    this.handContext.fillText(this.label, 20, 20);
    // display each card in a row
    let cardWidth = 50;
    let cardHeight = 70;
    let cardSpacing = 10;

    // Calculate total width needed
    const totalWidth = this.cards.length * (cardWidth + cardSpacing) + cardSpacing; // + cardSpacing for the last gap or initial offset logic
    const availableWidth = this.handCanvas.width - 40; // 20px padding on each side

    if (totalWidth > availableWidth) {
      const scale = availableWidth / totalWidth;
      cardWidth *= scale;
      cardHeight *= scale;
      cardSpacing *= scale;
    }

    let x = 20;
    let y = 20;
    if (this.isDiscard) {
      // iterate through this.cards in reverse order
      this.cards.reverse();
    }
    this.cards.forEach((card, index) => {
      card.displayCard(this.handContext, x, y, cardWidth, cardHeight, this.selectedCardIndex === index);
      x += cardWidth + cardSpacing;
    });
    if (!this.isDiscard) {
      // add event listener for mouse click
      this.handCanvas.addEventListener('click', (event) => {
        const rect = this.handCanvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left);
        const mouseY = event.clientY - rect.top;
        this.checkCardClick(mouseX, mouseY);
      });
    }
  }
  checkCardClick(mouseX, mouseY) {
    this.cards.forEach((card) => {
      if (card.isClicked(mouseX, mouseY)) {
        //if the card is already selected, unselect it
        if (selectedCard != null) {
          selectedCard.unhighlight(this.handContext);
        }
        selectedCard = card;
        selectedCard.highlight(this.handContext);
        this.selectedCardIndex = this.cards.indexOf(card);
      }
    });
  }

}

class GardenBoard {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    const maxSize = Math.min(800, window.innerWidth - 20);
    this.canvas.width = maxSize;
    this.canvas.height = maxSize;
    this.canvas.style.width = maxSize + 'px';
    this.canvas.style.height = maxSize + 'px';
    this.canvas.style.backgroundColor = "#f5e6bcff";
    this.context.fillStyle = 'white';
    this.cardWidth = 50;
    this.cardHeight = 70;
    this.cardSpacing = 10;
    this.ghostCards = [];
    this.cards = [];
    this.maxCol = 0;
    this.maxRow = 0;
    this.minCol = 0;
    this.minRow = 0;
  }
  setMaxAndMinRowCol(serverCards) {
    serverCards.forEach((card) => {
      if (card.row < this.minRow) {
        this.minRow = card.row;
      }
      if (card.row > this.maxRow) {
        this.maxRow = card.row;
      }
      if (card.col < this.minCol) {
        this.minCol = card.col;
      }
      if (card.col > this.maxCol) {
        this.maxCol = card.col;
      }
    });
    // increment maxRow and maxCol by 1 to make space for the new cards
    this.maxRow++;
    this.maxCol++;
    // decrement minRow and minCol by 1 to make space for the new cards
    this.minRow--;
    this.minCol--;
    //calculate card size to fit on the board
    const boardWidth = this.canvas.width - 40;
    const boardHeight = this.canvas.height - 40;
    this.cardWidth = (boardWidth - this.cardSpacing * (this.maxCol - this.minCol)) / (this.maxCol - this.minCol + 1);
    this.cardHeight = (boardHeight - this.cardSpacing * (this.maxRow - this.minRow)) / (this.maxRow - this.minRow + 1);
  }

  displayBoard(text, serverCards = []) {
    //put text inside the canvas to display the board
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.font = '18px Arial';
    this.context.fillStyle = 'black';
    this.context.fillText(text, 20, 20);
    console.log(serverCards);
    this.setMaxAndMinRowCol(serverCards);
    // from minRow to maxRow, draw the cards
    let x = 20;
    let y = 50;
    serverCards.forEach((card) => {
      //calculate the x and y position of the card
      x = 20 + (card.col - this.minCol) * (this.cardWidth + this.cardSpacing);
      y = 50 + (card.row - this.minRow) * (this.cardHeight + this.cardSpacing);
      //create a new card object
      const newCard = new Card(card.species, card.number, card.row, card.col);
      newCard.displayCard(this.context, x, y, this.cardWidth, this.cardHeight);
      // check if there is a card in the above row
      if (card.row > this.minRow) {
        const northCard = serverCards.find((c) => c.row === card.row - 1 && c.col === card.col);
        if (!northCard) {
          //create a ghost card in that position
          const ghostCard = new Card(null, null, card.row - 1, card.col);
          ghostCard.displayCard(this.context, x, y - this.cardHeight - this.cardSpacing, this.cardWidth, this.cardHeight, true);
          this.ghostCards.push(ghostCard);
        }
      }
      // check if there is a card in the below row
      if (card.row < this.maxRow) {
        const southCard = serverCards.find((c) => c.row === card.row + 1 && c.col === card.col);
        if (!southCard) {
          //create a ghost card in that position
          const ghostCard = new Card(null, null, card.row + 1, card.col);
          ghostCard.displayCard(this.context, x, y + this.cardHeight + this.cardSpacing, this.cardWidth, this.cardHeight, true);
          this.ghostCards.push(ghostCard);
        }
      }
      // check if there is a card in the left column  
      if (card.col > this.minCol) {
        const westCard = serverCards.find((c) => c.row === card.row && c.col === card.col - 1);
        if (!westCard) {
          //create a ghost card in that position
          const ghostCard = new Card(null, null, card.row, card.col - 1);
          ghostCard.displayCard(this.context, x - this.cardWidth - this.cardSpacing, y, this.cardWidth, this.cardHeight, true);
          this.ghostCards.push(ghostCard);
        }
      }
      // check if there is a card in the right column
      if (card.col < this.maxCol) {
        const eastCard = serverCards.find((c) => c.row === card.row && c.col === card.col + 1);
        if (!eastCard) {
          //create a ghost card in that position
          const ghostCard = new Card(null, null, card.row, card.col + 1);
          ghostCard.displayCard(this.context, x + this.cardWidth + this.cardSpacing, y, this.cardWidth, this.cardHeight, true);
          this.ghostCards.push(ghostCard);
        }
      }

    });


    //Add click listener to the canvas
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left);
      const mouseY = event.clientY - rect.top;
      this.checkCardClick(mouseX, mouseY);
    });
  }
  checkCardClick(mouseX, mouseY) {
    this.ghostCards.forEach((card) => {
      if (card.isClicked(mouseX, mouseY) && selectedCard !== null) {
        //TODO do something with the card
        console.log(`ghost Card clicked: ${card.row} ${card.col}`);
        selectedCard.row = card.row;
        selectedCard.col = card.col;
        sendPlayRequest(selectedCard);
      }
    });
    // if there are no cards on the board
    if (this.cards.length === 0 && selectedCard !== null) {
      selectedCard.row = 0;
      selectedCard.col = 0;
      sendPlayRequest(selectedCard);
    }
  }
}

export function drawButtons(state, discards, playerNames, deckSize, scores) {
  // if draw state, make a draw button for each discard
  const drawButtons = document.getElementById('draw-buttons');
  drawButtons.innerHTML = '';
  if (state === 'draw') {
    //Also add a button to draw from the deck
    const button = document.createElement('button');
    button.innerText = `Draw from deck (${deckSize} cards left)`;
    button.onclick = () => {
      sendDrawRequest(Constants.MSG_TYPES.DRAW, null);
    };
    drawButtons.appendChild(button);
    // Add a button to draw from each discard pile
    for (const [key, discard] of Object.entries(discards)) {
      //if discard is not empty, add a button
      if (discard.length === 0) {
        continue;
      }
      const button = document.createElement('button');
      const playerName = playerNames[key];
      button.innerText = `Draw from ${playerName}'s discard pile`;
      button.onclick = () => {
        console.log(`Discard pile ${key} clicked`);
        sendDrawRequest(key);
      };
      drawButtons.appendChild(button);
    }

  }
  //if discard state make a discard button for the selected card
  if (state === 'discard') {
    const discardButton = document.createElement('button');
    discardButton.innerText = `Discard selected card`;
    discardButton.onclick = () => {
      sendDiscardRequest(selectedCard);
    }
    drawButtons.appendChild(discardButton);
  };
  //if end state make a score value for each player
  if (state === 'end') {
    //For each player, write their name and score
    for (const [key, score] of Object.entries(scores)) {
      const playerName = playerNames[key];
      const scoreValue = document.createElement('div');
      scoreValue.innerText = `${playerName}: ${score}`;
      drawButtons.appendChild(scoreValue);
    }
  }

}



export function renderBoards(boards, discards, yourHand, playerNames) {
  // create a canvas for each board inside the game-canvas-span
  const gameCanvasSpan = document.getElementById('game-canvas-span');
  gameCanvasSpan.innerHTML = ''; // Clear previous canvases
  var index = 0
  Object.entries(boards).forEach(([key, board]) => {
    const boardCanvas = document.createElement('canvas');
    boardCanvas.id = `board-canvas-${key}`;
    gameCanvasSpan.appendChild(boardCanvas);
    const boardContext = boardCanvas.getContext('2d');
    let gardenBoard = new GardenBoard(boardCanvas, boardContext);
    //Get player name from playerNames
    const playerName = playerNames[key];
    gardenBoard.displayBoard(`${playerName}'s Board`, board.cards);

    //Add another canvas for the discards -- use the Hand class
    const discardCanvas = document.createElement('canvas');
    discardCanvas.id = `discard-canvas-${key}`;
    gameCanvasSpan.appendChild(discardCanvas);
    const discardContext = discardCanvas.getContext('2d');

    let discard = new Hand(discardCanvas, discardContext, `${playerName}'s Discard`, true);
    discard.addCards(discards[key]);
    discard.displayHand();

    //TODO draw the cards on the discard pile.
    index++;
  });
  //Add a canvas to display your hand
  const yourHandCanvas = document.createElement('canvas');
  yourHandCanvas.id = `your-hand-canvas`;
  gameCanvasSpan.appendChild(yourHandCanvas);
  const yourHandContext = yourHandCanvas.getContext('2d');
  let handBoard = new Hand(yourHandCanvas, yourHandContext, `Your Hand`);
  handBoard.addCards(yourHand);
  handBoard.displayHand();
}



export function displayGameTitle(name, playerTurn, turnAction) {
  // Display the game title on top of the canvas and hide the last menu
  waitForPlayersMenu.classList.add('hidden');
  canvas.classList.remove('hidden');
  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  //Put the game title in the top left of the canvas
  context.fillStyle = 'white';
  context.font = '18px Arial';
  context.fillText(`${name}: ${playerTurn}'s turn to ${turnAction}`, 20, 20);
}




//window.addEventListener('resize', debounce(40, setCanvasDimensions));

let animationFrameRequestId;

function render() {
  const { me, others, bullets } = getCurrentState();
  if (me) {
    // Draw background
    //renderBackground(me.x, me.y);

    // Draw boundaries
    //context.strokeStyle = 'black';
    //context.lineWidth = 1;
    //context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);

    // Draw all bullets
    //bullets.forEach(renderBullet.bind(null, me));

    // Draw all players
    //renderPlayer(me, me);
    //others.forEach(renderPlayer.bind(null, me));
  }

  // Rerun this render function on the next frame
  //animationFrameRequestId = requestAnimationFrame(render);
}

function renderBackground(x, y) {
  const backgroundX = MAP_SIZE / 2 - x + canvas.width / 2;
  const backgroundY = MAP_SIZE / 2 - y + canvas.height / 2;
  const backgroundGradient = context.createRadialGradient(
    backgroundX,
    backgroundY,
    MAP_SIZE / 10,
    backgroundX,
    backgroundY,
    MAP_SIZE / 2,
  );
  backgroundGradient.addColorStop(0, 'black');
  backgroundGradient.addColorStop(1, 'gray');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

// Renders a ship at the given coordinates
function renderPlayer(me, player) {
  const { x, y, direction } = player;
  const canvasX = canvas.width / 2 + x - me.x;
  const canvasY = canvas.height / 2 + y - me.y;

  // Draw ship
  context.save();
  context.translate(canvasX, canvasY);
  context.rotate(direction);
  context.drawImage(
    getAsset('ship.svg'),
    -PLAYER_RADIUS,
    -PLAYER_RADIUS,
    PLAYER_RADIUS * 2,
    PLAYER_RADIUS * 2,
  );
  context.restore();

  // Draw health bar
  context.fillStyle = 'white';
  context.fillRect(
    canvasX - PLAYER_RADIUS,
    canvasY + PLAYER_RADIUS + 8,
    PLAYER_RADIUS * 2,
    2,
  );
  context.fillStyle = 'red';
  context.fillRect(
    canvasX - PLAYER_RADIUS + PLAYER_RADIUS * 2 * player.hp / PLAYER_MAX_HP,
    canvasY + PLAYER_RADIUS + 8,
    PLAYER_RADIUS * 2 * (1 - player.hp / PLAYER_MAX_HP),
    2,
  );
}

function renderBullet(me, bullet) {
  const { x, y } = bullet;
  context.drawImage(
    getAsset('bullet.svg'),
    canvas.width / 2 + x - me.x - BULLET_RADIUS,
    canvas.height / 2 + y - me.y - BULLET_RADIUS,
    BULLET_RADIUS * 2,
    BULLET_RADIUS * 2,
  );
}

function renderMainMenu() {
  //const t = Date.now() / 7500;
  //const x = MAP_SIZE / 2 + 800 * Math.cos(t);
  //const y = MAP_SIZE / 2 + 800 * Math.sin(t);
  //renderBackground(x, y);

  // Rerun this render function on the next frame
  //animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

//animationFrameRequestId = requestAnimationFrame(renderMainMenu);

// Replaces main menu rendering with game rendering.
export function startRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(render);
}

// Replaces game rendering with main menu rendering.
export function stopRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}
