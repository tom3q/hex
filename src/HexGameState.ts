import { Battle } from './Battle';
import { BoardState } from './BoardState';
import { Hex } from './Hex';
import { Player } from './Player';

export interface HexGameState {
  battle: Battle | null;
  battleTurns: Array<number>;
  board: BoardState;
  players: Array<Player>;
}
