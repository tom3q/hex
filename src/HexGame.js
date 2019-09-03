import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import * as HexUtils from 'HexUtils.js';

class Deck {
  constructor(ctx, army) {
    this.ctx = ctx;
    this.army = army;

    let armyInfo = require(`resources/armies/${army}.json`);
    console.log(armyInfo);

    this.hqTokens = [];
    this.tokens = [];

    let token;
    for (token of armyInfo.tokens) {
      for (let i = 0; i < (token.count || 1); ++i) {
        if (token.hq)
          this.hqTokens.push(token);
        else
          this.tokens.push(token);
      }
    }

    console.log(this.tokens);
  }

  draw() {
    let idx = 0;

    do {
      idx = Math.floor(this.ctx.random.Number() * this.tokens.length);
    } while (idx === this.tokens.length);

    let token = this.tokens[idx];
    this.tokens[idx] = this.tokens[this.tokens.length - 1];
    this.tokens.pop();

    return token;
  }
}

export const HexGame = Game({
  setup: (ctx) => {
    let cells = Array(HexUtils.CELLS_SIZE).fill(null);
    for (let player = 0; player < ctx.numPlayers; ++player) {
      let deck = new Deck(ctx, "borgo");
      let cachePos = player * HexUtils.CACHE_SIZE;
      let i = 0;
if (false) {
      for (let token of deck.hqTokens) {
        cells[cachePos + i] = {
          token: deck.army + '_' + token.id,
          rotation: 0,
        }
        if (++i >= 3)
          break;
      }
} else {
      for (i = 0; i < 3; ++i) {
        let token = deck.draw();
        cells[cachePos + i] = {
          token: deck.army + '_' + token.id,
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

      G.cells[pos].rotation = (G.cells[pos].rotation + rotation) % 6;
    },
  },

  flow: {
    endGameIf: (G, ctx) => {
    },
  },
});
