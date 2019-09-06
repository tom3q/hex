export const BOARD_WIDTH = 5;
export const BOARD_HEIGHT = 9;
export const MAX_PLAYERS = 4;
export const CACHE_SIZE = 3;
export const CELLS_SIZE = MAX_PLAYERS * CACHE_SIZE
                          + BOARD_WIDTH * BOARD_HEIGHT;

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

export function XyToPos(x, y) {
  return MAX_PLAYERS * CACHE_SIZE + y * BOARD_WIDTH + x;
}

export function CachePosToPlayer(pos) {
  const player = Math.floor(pos / CACHE_SIZE);
  if (player >= MAX_PLAYERS)
    return -1;
  return player;
}

export function PosIsCache(pos) {
  return pos < CACHE_SIZE * MAX_PLAYERS;
}
