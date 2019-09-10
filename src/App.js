import { Client } from 'boardgame.io/react';
import React from 'react';
import { HexGame } from 'HexGame.js';
import { HexBoard } from 'HexBoard.js';

const HexClient = Client({
  debug: false,
  game: HexGame,
  board: HexBoard,
  multiplayer: { local: true },
});

const App = () => (
  <div>
    <HexClient playerID="0" />
    <HexClient playerID="1" />
  </div>
);

export default App;
