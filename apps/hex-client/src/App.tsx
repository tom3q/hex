import React from 'react';
import { HexGame } from 'hex-game/HexGame';
import { HexBoard } from './HexBoard';
import { Lobby } from 'boardgame.io/react';
import './App.css';

const App = () => {
  const importedGames = [
    { game: HexGame, board: HexBoard }
  ];
  return (
    <div>
      <Lobby
        gameServer={`http://localhost:8000`}
        lobbyServer={`http://localhost:8000`}
        gameComponents={importedGames}
      />;
    </div>
  );
}

export default App;
