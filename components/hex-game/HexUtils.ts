/**
 * @fileoverview hex board is projected into a grid of 5x9 cells
 * to allow easy addressing and help rendering in the client.
 * Moreover, the game cells array is prepended with cells that
 * correspond to player's caches.
 * This file contains utilities to deal with this model.
 */

/** Width of the cell grid used by the hex board. */
export const BOARD_WIDTH = 5;
/** Height of the cell grid used by the hex board. */
export const BOARD_HEIGHT = 9;
/** Maximum number of players in the game. */
export const MAX_PLAYERS = 4;
/** Number of token slots in the cache. */
export const CACHE_SIZE = 3;
/** Number of cells used for the caches. */
export const CACHE_CELLS = MAX_PLAYERS * CACHE_SIZE;
/** Total size of the game cells array. */
export const CELLS_SIZE = CACHE_CELLS + BOARD_WIDTH * BOARD_HEIGHT;

/**
 * Checks whether given board grid coordinates correspond to a hex.
 * @param x The horizontal coordinate.
 * @param y The vertical cordinate.
 * @return true if given coordinates correspond to a hex.
 */
export function XyIsValid(x: number, y:number): boolean {
  // 2
  // 1 3
  // 0 2 4
  // 1 3
  // 0 2 4
  // 1 3
  // 0 2 4
  // 1 3
  // 2
  if (y % 2) {
    if (!(x % 2))
      return false;
    return true;
  } else if (y === 0 || y === BOARD_HEIGHT - 1) {
    if (x !== 2)
      return false;
    return true;
  } else {
    if (x % 2)
      return false;
    return true;
  }
}

/**
 * Translates hex grid coordinates into game cells array index.
 * @param x Horizontal coordinate.
 * @param y Vertical coordinate.
 * @return Index in the game cells array.
 */
export function XyToPos(x: number, y: number): number {
  return MAX_PLAYERS * CACHE_SIZE + y * BOARD_WIDTH + x;
}

/**
 * A pair of coordinates on the hex grid coordinates.
 */
export class Coordinates {
  /** Horizontal coordinate. */
  x: number;
  /** Vertical coordinate. */
  y: number;

  /**
   * Constructs a Coordinates object.
   * @param x The horizontal coordinate.
   * @param y The vertical coordinate.
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Translates the coordinates into game cells array index.
   * @return Index in the game cells array.
   */
  toPos(): number {
    return XyToPos(this.x, this.y);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  /**
   * Translates game cells array index into hex grid coordinates.
   * @param pos Game cells array index.
   * @return A Coordinate object or null if the position was invalid.
   */
  static fromPos(pos: number): Coordinates | null {
    if (PosIsCache(pos)) return null;
    return new Coordinates(
      /** X coordinate. */
      (pos - CACHE_CELLS) % BOARD_WIDTH,
      /** Y coordinate. */
      Math.floor((pos - CACHE_CELLS) / BOARD_WIDTH),
    );
  }
}

/**
 * Translates game cells array index into corresponding player ID.
 * @param pos Game cells array index.
 * @return Player ID.
 */
export function CachePosToPlayer(pos: number): number {
  const player = Math.floor(pos / CACHE_SIZE);
  if (player >= MAX_PLAYERS)
    return -1;
  return player;
}

/**
 * Checks whether given cells array index is a cache.
 * @param pos Game cells array index.
 * @return True if the index is a cache.
 */
export function PosIsCache(pos: number): boolean {
  return pos < CACHE_SIZE * MAX_PLAYERS;
}

/**
 * Returns a game cells array index for given player's cache index.
 * @param player Player ID.
 * @param pos Index in the cache.
 * @return Index to the game cells array.
 */
export function PlayerCachePos(player: number, pos: number): number {
  return player * CACHE_SIZE + pos;
}
