/**
 * @fileoverview All the main boardgame.io game logic is located in
 * this file.
 */

import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import * as HexUtils from 'HexUtils.js';

/**
 * Represents a deck of tokens of one player.
 */
class Deck {
  /**
   * Constructs a fresh deck with all cards of the army.
   * @param {!Object} ctx boardgame.io game context.
   * @param {!string} army Identifier of the army.
   */
  constructor(ctx, army) {
    /** @private @const {!Object} Game context. */
    this.ctx = ctx;
    /** @const {string} Identifier of the army. */
    this.army = army;
    /** @private {!Array<Object>} Remaining headquarter tokens. */
    this.hqTokens = [];
    /** @private {!Array<Object>} Remaining playable tokens. */
    this.tokens = [];

    const armyInfo = require(`resources/armies/${army}.json`);
    let token;
    for (token of armyInfo.tokens) {
      for (let i = 0; i < (token.count || 1); ++i) {
        token.player = ctx.currentPlayer;
        if (token.hq) {
          if (this.hqTokens.length < HexUtils.CACHE_SIZE) {
            this.hqTokens.push(token);
          }
        } else {
          this.tokens.push(token);
        }
      }
    }
  }

  /**
   * Checks whether there are no headquarters tokens left in the deck.
   * @return {boolean} True if there are no headquarters tokens left.
   */
  allHqsDrawn() {
    return !this.hqTokens.length;
  }

  /**
   * Draws next headquarters token from the deck, in order.
   * @return {!Object} Headquarters token drawn.
   */
  drawHq() {
    if (!this.hqTokens.length)
      return null;

    return this.hqTokens.pop();
  }

  /**
   * Draws next playable token from the deck randomly.
   * @return {!Object} Token drawn.
   */
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

/**
 * Represents a hex token on the board.
 */
class Hex {
  /**
   * Constructs a hex object.
   * @param {!string} player Identifier of the player.
   * @param {!string} army Identifier of the army.
   * @param {!Object} token Token description JSON object.
   */
  constructor(player, army, token) {
    /** {!string} Identifier of the army. */
    this.army = army;
    /** {!string} Identifier of the player. */
    this.player = player;
    /** {number} Rotation of the token, in units of 60 degrees. */
    this.rotation = 0;
    /** {!Object} Token description JSON object. */
    this.token = token;
  }
}

/**
 * boardgame.io Game object implementing all of the game logic.
 */
export const HexGame = Game({
  setup: (ctx) => ({
      /** Game cells array for holding the tokens. */
      cells: Array(HexUtils.CELLS_SIZE).fill(null),
      /** All players participating in the game. */
      players: Array(ctx.numPlayers).fill({}),
  }),

  moves: {
    /**
     * Moves a token to an empty cell.
     * @param {!Object} G boardgame.io game state.
     * @param {!Object} ctx boardgame.io game context.
     * @param {number} from The position of the token to move.
     * @param {number} to The position of the destination empty cell.
     * @return A new game state after the move or INVALID_MOVE if
     *
     *      - the token does not belong to the current player, or
     *      - the from position does not contain a token, or
     *      - the to position already contains a token, or
     *      - the to position is a cache of another player.
     */
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

    /**
     * Rotates a token at pos by given number of rotation steps.
     * @param {!Object} G boardgame.io game state.
     * @param {!Object} ctx boardgame.io game context.
     * @param {number} pos The position of the token to rotate.
     * @param {number} rotation The number of rotation steps, with one
     *     step corresponding to 60 degrees rotation. Can be negative.
     * @return A new game state after the rotation or INVALID_MOVE if
     *
     *      - the token does not belong to the current player, or
     *      - the position does not contain a token.
     */
    rotateToken(G, ctx, pos, rotation) {
      if (G.cells[pos] === null)
        return INVALID_MOVE;

      const hex = G.cells[pos];
      if (hex.player !== ctx.currentPlayer)
        return INVALID_MOVE;

      hex.rotation = (hex.rotation + rotation) % 6;
    },

    /**
     * Discards all the tokens in player's cache.
     * @param {!Object} G boardgame.io game state.
     * @param {!Object} ctx boardgame.io game context.
     * @return A new game state without any tokens in player's cache.
     */
    discardCache(G, ctx) {
      const player = Number(ctx.currentPlayer);
      for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
        const pos = HexUtils.PlayerCachePos(player, i);
        G.cells[pos] = null;
      }
    }
  },

  flow: {
    startingPhase: "hqSetup",
    endPhase: false,

    phases: {
      /**
       * The headquarters setup phase.
       *
       * Each player has one turn put their headquarters tokens on the board.
       * All headquarters tokens must be placed on the board before ending the
       * turn. It is not possible to discard headquarters tokens.
       *
       * The phase ends in the second turn of the frst player and the game
       * moves to the normal phase.
       */
      hqSetup: {
        next: "normal",
        allowedMoves: ['moveToken', 'rotateToken'],

        onTurnBegin: (G, ctx) => {
          const player = ctx.currentPlayer;

          if (!G.players[player].deck) {
            /* TODO: Obtain the army from the lobby. */
            G.players[player].deck = new Deck(
              ctx, parseInt(player) ? "borgo" : "moloch");
          }

          let deck = G.players[player].deck;
          if (deck.allHqsDrawn()) {
            ctx.events.endPhase();
            ctx.events.endTurn(player);
            return;
          }

          let cachePos = player * HexUtils.CACHE_SIZE;
          let token;
          while ((token = deck.drawHq())) {
            G.cells[cachePos++] = new Hex(player, deck.army, token);
          }
        },
      },

      /**
       * The main game phase.
       *
       * Each player gets new tokens drawn from the deck to fill the empty
       * cache slots as long as there are still tokens left in the deck. The
       * player may use or keep only 2 tokens. If there is third left, it needs
       * to be discarded.
       *
       * If the board becomes full at the end of a turn, the game switches to
       * the battle stage.
       */
      normal: {
        next: "battle",

        onTurnBegin: (G, ctx) => {
          const player = ctx.currentPlayer;
          let deck = G.players[player].deck;

          for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
            const pos = HexUtils.PlayerCachePos(player, i);
            let cell = G.cells[pos];

            if (cell)
              continue;

            let token = deck.draw();
            G.cells[pos] = new Hex(player, deck.army, token);
          }
        },
      },

      /**
       * The battle stage.
       *
       * TODO: Figure out and implement this.
       */
      battle: {
        next: "normal",
      },
    },
  },
});
