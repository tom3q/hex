import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import * as HexUtils from 'HexUtils.js';

export const HexGame = Game({
  setup: () => {
    let cells = Array(HexUtils.CELLS_SIZE).fill(null);
    for (let y = 0; y < HexUtils.BOARD_HEIGHT; y++) {
      for (let x = 0; x < HexUtils.BOARD_WIDTH; x++) {
        if (HexUtils.XyIsValid(x, y) && (x * y % 4 > 2)) {
          cells[HexUtils.XyToPos(x, y)] = {
            token: 'borgo_net_fighter',
            rotation: 0,
          }
        }
      }
    }
    return { cells: cells };
  },

  moves: {
    moveToken(G, ctx, from, to) {
      if (G.cells[to] !== null)
        return INVALID_MOVE;

      G.cells[to] = G.cells[from];
      G.cells[from] = null;
    },

    rotateToken(G, ctx, pos, rotation) {
      if (G.cells[pos] === null)
        return INVALID_MOVE;

      G.cells[pos].rotation = (G.cells[pos].rotation + rotation) % 360;
    },
  },

  flow: {
    endGameIf: (G, ctx) => {
    },
  },
});
