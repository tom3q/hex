import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import * as HexUtils from 'HexUtils.js';

class Deck {
  constructor(ctx, army) {
    this.ctx = ctx;
    this.army = army;
    this.hqTokens = [];
    this.tokens = [];

    const armyInfo = require(`resources/armies/${army}.json`);
    let token;
    for (token of armyInfo.tokens) {
      for (let i = 0; i < (token.count || 1); ++i) {
        if (token.hq) {
          if (this.hqTokens.length < HexUtils.CACHE_SIZE)
            this.hqTokens.push(token);
        } else {
          this.tokens.push(token);
        }
      }
    }
  }

  allHqsDrawn() {
    return !this.hqTokens.length;
  }

  drawHq() {
    if (!this.hqTokens.length)
      return null;

    return this.hqTokens.pop();
  }

  draw() {
    let idx = 0;

    if (!this.tokens.length)
      return null;

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
    let players = Array(ctx.numPlayers);

    for (let player = 0; player < ctx.numPlayers; ++player) {
      players[player] = {
        deck: new Deck(ctx, "borgo"),
      };
    }
    return {
      cells: cells,
      players: players
    };
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
    startingPhase: "hqSetup",
    endPhase: false,

    phases: {
      hqSetup: {
        next: "normal",

        onTurnBegin: (G, ctx) => {
          const player = ctx.currentPlayer;
          let deck = G.players[player].deck;

          if (deck.allHqsDrawn()) {
            ctx.events.endPhase();
            ctx.events.endTurn(player);
            return;
          }

          let cachePos = player * HexUtils.CACHE_SIZE;
          let token;
          while (token = deck.drawHq()) {
            G.cells[cachePos++] = {
              token: deck.army + '_' + token.id,
              rotation: 0,
            }
          }
        },
      },

      normal: {
        next: "battle",

        onTurnBegin: (G, ctx) => {
          const player = ctx.currentPlayer;
          const cachePos = player * HexUtils.CACHE_SIZE;
          let deck = G.players[player].deck;

          for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
            let cell = G.cells[cachePos + i];

            if (cell)
              continue;

            let token = deck.draw();
            G.cells[cachePos + i] = {
              token: deck.army + '_' + token.id,
              rotation: 0,
            }
          }
        },
      },

      battle: {
        next: "normal",
      },
    },
  },
});
