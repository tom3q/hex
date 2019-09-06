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
        token.player = ctx.currentPlayer;
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
      players[player] = {};
    }
    return {
      cells: cells,
      players: players
    };
  },

  moves: {
    moveToken(G, ctx, from, to) {
      if (HexUtils.PosIsCache(to) &&
          HexUtils.CachePosToPlayer(to) !== Number(ctx.currentPlayer))
        return INVALID_MOVE;

      if (G.cells[from] === null)
        return INVALID_MOVE;

      if (G.cells[to] !== null)
        return INVALID_MOVE;

      const hex = G.cells[from];
      if (hex.player !== ctx.currentPlayer)
        return INVALID_MOVE;

      G.cells[from] = null;
      G.cells[to] = hex;
    },

    rotateToken(G, ctx, pos, rotation) {
      if (G.cells[pos] === null)
        return INVALID_MOVE;

      const hex = G.cells[pos];
      if (hex.player !== ctx.currentPlayer)
        return INVALID_MOVE;

      hex.rotation = (hex.rotation + rotation) % 6;
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

          if (!G.players[player].deck)
            G.players[player].deck = new Deck(
              ctx, parseInt(player) ? "borgo" : "moloch");

          let deck = G.players[player].deck;
          if (deck.allHqsDrawn()) {
            ctx.events.endPhase();
            ctx.events.endTurn(player);
            return;
          }

          let cachePos = player * HexUtils.CACHE_SIZE;
          let token;
          while ((token = deck.drawHq())) {
            G.cells[cachePos++] = {
              token: deck.army + '_' + token.id,
              player: player,
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
              player: player,
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
