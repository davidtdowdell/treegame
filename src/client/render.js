// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';
import { set } from 'lodash';
import { sendDrawRequest } from './networking';

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
function displayCard(context, species, number, x, y, width, height){
  console.log(`Drawing card: ${species} ${number} at (${x}, ${y}) with size (${width}, ${height})`);
  context.fillStyle = 'white';
  context.font = '9px Arial';
  context.fillText(`Species: ${species}`, x, y + 20);
  context.fillText(`Number: ${number}`, x, y + 40);
  //draw a rectangle for the card 
  context.strokeStyle = 'white';
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);
}

function drawHand(yourHand, yourHandCanvas, yourHandContext){
  //make the canvas wide enough for 9 cards
  yourHandCanvas.width = 700;
  yourHandCanvas.height = 100;
  yourHandCanvas.style.width = '500px';
  yourHandCanvas.style.height = '100px';
  yourHandCanvas.style.backgroundColor = 'green';
  yourHandContext.fillStyle = 'white';
  //draw the cards in your hand
  const cardWidth = 50;
  const cardHeight = 70;
  const cardSpacing = 10;
  let x = 20;
  let y = 20;
  yourHand.forEach((card) => {
    displayCard(yourHandContext, card.species, card.number, x, y, cardWidth, cardHeight);
    x += cardWidth + cardSpacing;
  });
}

export function drawButtons(state, discards){
  // if draw state, make a draw button for each discard
  const drawButtons = document.getElementById('draw-buttons');
  drawButtons.innerHTML = '';
  if (state === 'draw') {
    Object.entries(discards).forEach(([key, discard]) => {
      //if the discard is not empty, create a button to draw the top card
      if (discard.length > 0) {
        const button = document.createElement('button');
        button.innerText = `Draw ${discard[discard.length - 1].species} ${discard[discard.length - 1].number}`;
        button.onclick = () => {
          sendDrawRequest(Constants.MSG_TYPES.DRAW, key);
        };
        drawButtons.appendChild(button);
      }
    });
    //Also add a button to draw from the deck
    const button = document.createElement('button');
    button.innerText = `Draw from deck`;
    button.onclick = () => {
      sendDrawRequest(Constants.MSG_TYPES.DRAW, null);
    };
    drawButtons.appendChild(button);
  } //end if
}



export function renderBoards(boards, discards, yourHand){
  // create a canvas for each board inside the game-canvas-span
  const gameCanvasSpan = document.getElementById('game-canvas-span');
  gameCanvasSpan.innerHTML = ''; // Clear previous canvases
  var index = 0
  Object.entries(boards).forEach(([key, board]) => {
    const boardCanvas = document.createElement('canvas');
    boardCanvas.id = `board-canvas-${key}`;
    gameCanvasSpan.appendChild(boardCanvas);
    const boardContext = boardCanvas.getContext('2d');
    // Make the canvas red
    boardCanvas.width = 200;
    boardCanvas.height = 200;
    boardCanvas.style.width = '200px';
    boardCanvas.style.height = '200px';
    boardCanvas.style.backgroundColor = 'red';
    boardContext.fillStyle = 'white';
    //Put text inside the canvas to display the board
    boardContext.font = '18px Arial';
    boardContext.fillText(`Board: ${key}`, 20, 20);
    //TODO draw the cards on the board.

    //Add another canvas for the discards
    const discardCanvas = document.createElement('canvas');
    discardCanvas.id = `discard-canvas-${key}`;
    gameCanvasSpan.appendChild(discardCanvas);
    const discardContext = discardCanvas.getContext('2d');
    discardCanvas.width = 200;
    discardCanvas.height = 200;
    discardCanvas.style.width = '200px';
    discardCanvas.style.height = '200px';
    discardCanvas.style.backgroundColor = 'blue';
    discardContext.fillStyle = 'white';
    //Put text inside the canvas to display the discard pile
    discardContext.font = '18px Arial';
    discardContext.fillText(`Discard: ${index}`, 20, 20);
    //TODO draw the cards on the discard pile.
    index++;
  });
  //Add a canvas to display your hand
  const yourHandCanvas = document.createElement('canvas');
  yourHandCanvas.id = `your-hand-canvas`;
  gameCanvasSpan.appendChild(yourHandCanvas);
  const yourHandContext = yourHandCanvas.getContext('2d');
  drawHand(yourHand, yourHandCanvas, yourHandContext);
}



export function displayGameTitle(name, playerTurn, turnAction){
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
