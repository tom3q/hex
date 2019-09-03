export const BOARD_WIDTH = 5;
export const BOARD_HEIGHT = 9;
export const MAX_PLAYERS = 4;
export const CACHE_SIZE = 4;
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
  } else if (y === 0 || y === this.BOARD_HEIGHT - 1) {
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
  return this.MAX_PLAYERS * this.CACHE_SIZE + y * this.BOARD_WIDTH + x;
}
