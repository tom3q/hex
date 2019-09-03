import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import * as HexUtils from 'HexUtils.js';

class Deck {
  constructor(army) {
    this.army = army;

    let armyInfo = require(`resources/armies/${army}.json`);
    console.log(armyInfo);

    this.hqTokens = [];
    this.tokens = [];

    for (let token of armyInfo.tokens) {
      if (token.hq)
        this.hqTokens.push(token);
      else
        this.tokens.push(token);
    }
  }
}

export const HexGame = Game({
  setup: (ctx) => {
    let cells = Array(HexUtils.CELLS_SIZE).fill(null);
    for (let player = 0; player < ctx.numPlayers; ++player) {
      let deck = new Deck("borgo");
      let cachePos = player * HexUtils.CACHE_SIZE;
      let i = 0;
      for (let token of deck.hqTokens) {
        cells[cachePos + i] = {
          token: deck.army + '_' + token.id,
          rotation: 0,
        }
        if (++i >= 3)
          break;
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
