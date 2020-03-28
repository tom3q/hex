import { Server } from 'boardgame.io/server';
import { HexGame } from 'hex-game/HexGame';

const server = Server({ games: [HexGame] });
server.run(8000);
