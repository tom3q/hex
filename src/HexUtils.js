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
 * @param {number} x The horizontal coordinate.
 * @param {number} y The vertical cordinate.
 * @return {boolean} true if given coordinates correspond to a hex.
 */
export function XyIsValid(x, y) {
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
 * @param {number} x Horizontal coordinate.
 * @param {number} y Vertical coordinate.
 * @return {number} Index in the game cells array.
 */
export function XyToPos(x, y) {
  return MAX_PLAYERS * CACHE_SIZE + y * BOARD_WIDTH + x;
}

/**
 * Translates game cells array index into corresponding player ID.
 * @param {number} pos Game cells array index.
 * @return {number} Player ID.
 */
export function CachePosToPlayer(pos) {
  const player = Math.floor(pos / CACHE_SIZE);
  if (player >= MAX_PLAYERS)
    return -1;
  return player;
}

/**
 * Checks whether given cells array index is a cache.
 * @param {number} pos Game cells array index.
 * @return {boolean} True if the index is a cache.
 */
export function PosIsCache(pos) {
  return pos < CACHE_SIZE * MAX_PLAYERS;
}

/**
 * Returns a game cells array index for given player's cache index.
 * @param {number} player Player ID.
 * @param {number} pos Index in the cache.
 * @return {number} Index to the game cells array.
 */
export function PlayerCachePos(player, pos) {
  return player * CACHE_SIZE + pos;
}
