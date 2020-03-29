import { Hex } from './Hex';

/**
 * Manages state of the board, i.e. which hexes are occupied by tokens.
 */
export interface BoardState {
  /** Game cells array for holding the tokens. */
  cells: Array<Hex | null>;
}
