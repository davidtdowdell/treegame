This is a somewhat vibe-coded implementation of the card game Arboretum.
It's based on this tutorial: [**How to Build a Multiplayer (.io) Web Game**](https://victorzhou.com/blog/build-an-io-game-part-1/).

Built with [Node.js](https://nodejs.org/), [socket.io](https://socket.io/), and [HTML5 Canvas](https://www.w3schools.com/html/html5_canvas.asp).

## How to run it and host it so others can play it
Make sure you have npm and nodejs installed.
First, clone the repository to a location you like.
Then, inside it, call "npm install".
Then, "npm run develop". Then check localhost:3000.
To host it online so others can play it, you can install ngrok.
Then use "ngrok http 3000" in another terminal to host it online. The link will be printed out in the terminal.


## Development

To get started, make sure you have Node and NPM installed. Then,

```bash
$ npm install
$ npm run develop
```

on your local machine.

To run the project in a production setting, simply

```bash
$ npm install
$ npm run build
$ npm start
```

## Tests

To run the tests for this this project, simply

```bash
$ npm install
$ npm test
```
