import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
//import { Local } from 'boardgame.io/multiplayer';
import React from 'react';
import { HexGame } from 'hex-game/HexGame';
import { HexBoard } from '../src/HexBoard';

const HexClient = Client({
  //debug: false,
  game: HexGame,
  board: HexBoard,
  multiplayer: SocketIO({ server: '100.115.92.200:8000' }),
  //multiplayer: Local(),
});

const App = () => {
  return (
    <div>
      <HexClient playerID="0" />
      <HexClient playerID="1" />
    </div>
  );
}

export default App;
