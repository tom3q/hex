import { Battle } from './Battle';
import { Hex } from './Hex';
import { Player } from './Player';

export interface HexGameState {
  battle: Battle | null;
  battleTurns: Array<number>;
  cells: Array<Hex | null>;
  players: Array<Player>;
}
