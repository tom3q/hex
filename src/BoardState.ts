import { immerable } from 'immer';
import * as HexUtils from './HexUtils';
import { Hex } from './Hex';

/**
 * @callback
 * @param hex A hex object.
 * @param x The horizontal coordinate of the hex.
 * @param y The vertical coordinate of the hex.
 */
type ForEachHexCallback = (hex: Hex, coords: HexUtils.Coordinates) => void;

/**
 * Manages state of the board, i.e. which hexes are occupied by tokens.
 */
export class BoardState {
  [immerable] = true

  /** Game cells array for holding the tokens. */
  cells: Array<Hex | null>;

  constructor() {
    this.cells = Array(HexUtils.CELLS_SIZE).fill(null);
  }

  /**
   * Removes the token from given position and returns it if any.
   * @param pos Index to the cells array.
   * @return Hex object removed or null.
   */
  remove(pos: number): Hex | null {
    const hex = this.cells[pos];
    this.cells[pos] = null;
    return hex;
  }

  /**
   * Puts a token on given position if it is not occupied yet.
   * @param pos Index to the cells array.
   * @param hex Hex object with the token.
   * @return True if it was possible to put the token on given position.
   */
  put(pos: number, hex: Hex): boolean {
    if (this.cells[pos]) return false;

    this.cells[pos] = hex;
    return true;
  }

  /**
   * Gets the token from given position if any.
   * @param pos Index to the cells array.
   * @return Hex object or null.
   */
  get(pos: number): Hex | null {
    return this.cells[pos];
  }

  /**
   * Executes given function on each occupied hex of the board.
   * @param cells The game cells array.
   * @param func The function to execute
   */
  forEachHex(func: ForEachHexCallback): void {
    for (let y = 0; y < HexUtils.BOARD_HEIGHT; ++y) {
      for (let x = 0; x < HexUtils.BOARD_WIDTH; ++x) {
        const coords = new HexUtils.Coordinates(x, y);
        const hex = this.cells[coords.toPos()];
        if (hex)
          func(hex, coords);
      }
    }
  }
}
