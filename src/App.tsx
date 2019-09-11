import { Client } from 'boardgame.io/react';
import React from 'react';
import { HexGame } from './HexGame';
import { HexBoard } from './HexBoard';

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
