/**
 * @fileoverview All the main boardgame.io game logic is located in
 * this file.
 */

import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import { TurnOrder } from 'boardgame.io/core';
import * as HexUtils from 'HexUtils.js';
import { immerable } from "immer";

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
        if (token.hq) {
          /** TODO: Take this from game settings. */
          token.health = 20;
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
  [immerable] = true
  /**
   * Constructs a hex object.
   * @param {!string} player Identifier of the player.
   * @param {!string} army Identifier of the army.
   * @param {!Object} token Token description JSON object.
   */
  constructor(player, army, token) {
    /** {!string} Identifier of the army. */
    this.army = army;
    /** {number} Damage received by the unit. */
    this.damage = 0;
    /** {number} Current health level of the unit. */
    this.health = token.health || 1;
    /** {Array<number>} The list of unit initiatives sorted descending. */
    this.initiative = [];
    /** {!string} Identifier of the player. */
    this.player = player;
    /** {number} Rotation of the token, in units of 60 degrees. */
    this.rotation = 0;
    /** {!Object} Token description JSON object. */
    this.token = token;
    /** {number} The turn number the token was used. */
    this.turnUsed = null;

    if (Array.isArray(token.initative)) {
      this.initiative = [ ...token.initiative ].sort((a, b) => b - a);
    } else {
      this.initiative = [ token.initiative ];
    }
  }
}

/**
 * Represents a player in the game.
 */
class Player {
  [immerable] = true
  /**
   * Construct a player object.
   */
  constructor() {
    /** {Object} Deck of the player. */
    this.deck = null;
    /** {number} How many tokens the player used in current turn. */
    this.tokensUsedInTurn = 0;
    /** {boolean} Whether the player ended their turn. */
    this.turnEnded = false;
  }
}

/*
 * Contains state of a battle.
 */
class Battle {
  [immerable] = true

  /**
   * Constructs a battle object.
   */
  constructor(initiative, playerToResume) {
    /** {number} Current initiative segment. */
    this.initiative = initiative;
    /** {number} The next player to give turn to after the battle. */
    this.playerToResume = playerToResume;
  }
}

/**
 * Validates whether the player made a valid combination of moves for the turn.
 * @param {!Object} G boardgame.io game state
 * @param {!Object} ctx boardgame.io game metadata
 * @return true if the the moves were valid and the turn can be ended, or false if
 *
 *      - there are any headquarter tokens in the cache (HQ setup phase), or
 *      - the player did not discard at least one of the tokens.
 */
function isTurnValid(G, ctx) {
  const player = Number(ctx.currentPlayer);

  let numTokensInCache = 0;
  for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
    const pos = HexUtils.PlayerCachePos(player, i);
    let hex = G.cells[pos];
    if (!hex)
      continue;

    ++numTokensInCache;

    if (hex.token.hq)
      return false;
  }

  const playerState = G.players[player];
  const tokensUsed = playerState.tokensUsedInTurn + numTokensInCache;
  if (tokensUsed >= HexUtils.CACHE_SIZE)
    return false;

  return true;
}

/**
 * Produces handlers for instant tokens.
 */
class InstantHandlerFactoryClass {
  /**
   * @private Handle airstrike instant action.
   *
   * Inflicts 1 damage on given hex and surrounding ones. Cannot be cast on
   * an edge hex.
   */
  handleAirstike_ = (G, ctx, on) => {
     const offsets = [
                         { x: 0, y: -2 },
       { x: -1, y: -1 },                  { x: 1, y: -1 },
                         { x: 0, y:  0 },
       { x: -1, y:  1 },                  { x: 1, y:  1 },
                         { x: 0, y:  2 },
     ];

     let target = HexUtils.posToXy(on);
     let offset;
     for (offset of offsets) {
       const x = target.x + offset.x;
       const y = target.y + offset.y;
       if (!HexUtils.XyIsValid(x, y)) {
         return false;
       }
     }

     for (offset of offsets) {
       const x = target.x + offset.x;
       const y = target.y + offset.y;
       const pos = HexUtils.XyToPos(x, y);
       const hex = G.cells[pos];
       if (hex && !hex.token.hq && ++hex.damage >= hex.health) {
         G.cells[pos] = null;
       }
     }
     return true;
  }

  /**
   * @private Handle battle instant action.
   *
   * Validates current turn and starts a battle if valid.
   */
  handleBattle_ = (G, ctx, on) => {
    if (!isTurnValid(G, ctx))
      return false;

    ctx.events.endPhase( { next: 'battle' } );
    G.players[ctx.currentPlayer].turnEnded = true;
    return true;
  }

  /**
   * Returns handler for given instant token type.
   * @param {!string} Instant token type identifier.
   * @return {function(!Object, !Object, number): boolean} Handler function,
   *     or null if the type is invalid.
   */
  getHandler = (type) => {
    switch(type) {
      case 'airstrike':
        return this.handleAirstike_;

      case 'battle':
        return this.handleBattle_;

      default:
        return null;
    }
  }
}
const InstantHandlerFactory = new InstantHandlerFactoryClass();

/**
 * boardgame.io Game object implementing all of the game logic.
 */
export const HexGame = Game({
  setup: (ctx) => ({
    /** {Object} State of the battle if in progress. */
    battle: null,
    /** {Array<number>} Turn order for the battle phase. */
    battleTurns: [],
    /** Game cells array for holding the tokens. */
    cells: Array(HexUtils.CELLS_SIZE).fill(null),
    /** All players participating in the game. */
    players: Array.from({ length: ctx.numPlayers }, () => new Player())
  }),

  moves: {
    /**
     * Verifies end turn conditions and marks the turn as ended if all of them
     * are met.
     * @return A new game state with player's turn ended or INVALID_MOVE otherwise.
     */
    endTurn(G, ctx) {
      if (!isTurnValid(G, ctx))
        return INVALID_MOVE;

      const player = Number(ctx.currentPlayer);
      const playerState = G.players[player];
      playerState.turnEnded = true;
    },

    /**
     * Moves a token to an empty cell.
     * @param {number} from The position of the token to move.
     * @param {number} to The position of the destination empty cell.
     * @return A new game state after the move or INVALID_MOVE if
     *
     *      - the token does not belong to the current player, or
     *      - the from position does not contain a token, or
     *      - the token is an instant token, or
     *      - the to position already contains a token, or
     *      - the player already used the maximum number of tokens in the turn, or
     *      - the to position is a cache of another player.
     */
    moveToken(G, ctx, from, to) {
      const player = Number(ctx.currentPlayer);
      if (HexUtils.PosIsCache(to) &&
          HexUtils.CachePosToPlayer(to) !== player)
        return INVALID_MOVE;

      if (G.cells[from] === null)
        return INVALID_MOVE;

      const hex = G.cells[from];
      if (hex.player !== player)
        return INVALID_MOVE;

      if (hex.token.instant)
        return INVALID_MOVE;

      if (G.cells[to] !== null)
        return INVALID_MOVE;

      if (hex.turnUsed !== null && hex.turnUsed !== ctx.turn)
        return INVALID_MOVE;

      const playerState = G.players[player];
      if (!hex.hq) {
        if (HexUtils.PosIsCache(from)) {
          if (playerState.tokensUsedInTurn === HexUtils.CACHE_SIZE - 1) {
            return INVALID_MOVE;
          }
          playerState.tokensUsedInTurn++;
          hex.turnUsed = ctx.turn;
        }
        if (HexUtils.PosIsCache(to)) {
          playerState.tokensUsedInTurn--;
          hex.turnUsed = null;
        }
      }

      G.cells[from] = null;
      G.cells[to] = hex;
    },

    /**
     * Rotates a token at pos by given number of rotation steps.
     * @param {number} pos The position of the token to rotate.
     * @param {number} rotation The number of rotation steps, with one
     *     step corresponding to 60 degrees rotation. Can be negative.
     * @return A new game state after the rotation or INVALID_MOVE if
     *
     *      - the token does not belong to the current player, or
     *      - the token is an instant token, or
     *      - the position does not contain a token.
     */
    rotateToken(G, ctx, pos, rotation) {
      const player = Number(ctx.currentPlayer);
      if (G.cells[pos] === null)
        return INVALID_MOVE;

      const hex = G.cells[pos];
      if (hex.player !== player)
        return INVALID_MOVE;

      if (hex.instant)
        return INVALID_MOVE;

      hex.rotation = (hex.rotation + rotation) % 6;
    },

    /**
     * Discards token(s) from the player's cache.
     * @param {number} pos Position of the token to discard, null to discard all.
     * @return A new game state with the token removed from player's cache.
     */
    discardCache(G, ctx, pos) {
      const player = Number(ctx.currentPlayer);
      if (pos === null) {
        for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
          const pos = HexUtils.PlayerCachePos(player, i);
          G.cells[pos] = null;
        }
        return;
      }

      if (!HexUtils.PosIsCache(pos))
        return INVALID_MOVE;

      if (HexUtils.CachePosToPlayer(pos) !== player)
        return INVALID_MOVE;

      G.cells[pos] = null;
    },

    /**
     * Uses an instant token.
     * @param {number} at The position of the instant token.
     * @param {number} on The position on which to use the token.
     * @return A new game state after the instant token is used or INVALID_MOVE if
     *
     *      - the player already used the maximum number of tokens in the turn.
     */
    useInstantToken(G, ctx, at, on) {
      const playerState = G.players[ctx.currentPlayer];
      if (playerState.tokensUsedInTurn === HexUtils.CACHE_SIZE - 1)
        return INVALID_MOVE;

      const hex = G.cells[at];
      const func = InstantHandlerFactory.getHandler(hex.token.abilities[0].type);
      if (!func || !func(G, ctx, on))
        return INVALID_MOVE;

      playerState.tokensUsedInTurn++;
      G.cells[at] = null;
    },
  },

  flow: {
    startingPhase: "hqSetup",
    endPhase: false,
    endTurn: false,

    endTurnIf: (G, ctx) => {
      const player = Number(ctx.currentPlayer);
      console.log('endTurnIf() = ' + G.players[player].turnEnded);
      return G.players[player].turnEnded;
    },

    onTurnEnd: (G, ctx) => {
      console.log('onTurnEnd()');
      const player = Number(ctx.currentPlayer);
      const playerState = G.players[player];
      playerState.turnEnded = false;
      playerState.tokensUsedInTurn = 0;
    },

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
        turnOrder: TurnOrder.ONCE,
        next: 'normal',
        allowedMoves: [
          'endTurn',
          'moveToken',
          'rotateToken',
        ],

        onTurnBegin: (G, ctx) => {
          console.log('hqSetup.onTurnBegin()');
          const player = Number(ctx.currentPlayer);
          const playerState = G.players[player];

          /* TODO: Obtain the army from the lobby. */
          const deck = new Deck(
            ctx, parseInt(player) ? "borgo" : "moloch");
          playerState.deck = deck;

          let cachePos = player * HexUtils.CACHE_SIZE;
          let token;
          while ((token = deck.drawHq())) {
            G.cells[cachePos++] = new Hex(player, deck.army, token);
          }
        },

        onPhaseBegin: (G, ctx) => {
          console.log('hqSetup.onPhaseBegin()');
        },

        onPhaseEnd: (G, ctx) => {
          console.log('hqSetup.onPhaseEnd()');
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
        turnOrder: TurnOrder.DEFAULT,

        onTurnBegin: (G, ctx) => {
          console.log('normal.onTurnBegin()');
          const player = Number(ctx.currentPlayer);
          const playerState = G.players[player];
          let deck = playerState.deck;

          for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
            const pos = HexUtils.PlayerCachePos(player, i);
            let cell = G.cells[pos];

            if (cell)
              continue;

            let token = deck.draw();
            G.cells[pos] = new Hex(player, deck.army, token);
          }
        },

        onPhaseBegin: (G, ctx) => {
          console.log('normal.onPhaseBegin()');
          /*
           * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
           * Remove when the framework starts handling the first turn of the
           * next phase correctly.
           */
          ctx.events.endTurn();
        },

        onPhaseEnd: (G, ctx) => {
          console.log('normal.onPhaseEnd()');
        },
      },

      /**
       * The battle stage.
       *
       * One phase handles one initiative segment and one turn handles attack
       * of one unit. Once we finish initiative 0, we go back to the normal
       * phase.
       */
      battle: {
        next: 'battle',
        allowedMoves: [],
        endTurnIf: (G, ctx) => false,
        turnOrder: TurnOrder.CUSTOM_FROM('battleTurns'),

        /**
         * If starting a battle, find the highest initiative level on the board
         * and initialize the Battle object that stores the battle state. Once
         * we have the battle state, build the list of units attacking with
         * current initiative level. The list is used to schedule players turns
         * and execute the attacks.
         */
        onPhaseBegin: (G, ctx) => {
          console.log('battle.onPhaseBegin()');

          /*
           * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
           * Remove when the framework starts handling the first turn of the
           * next phase correctly.
           */
          ctx.events.endTurn();

          if (!G.battle) {
            let maxInitiative = 0;
            HexUtils.forEachHexOnBoard(G.cells, (hex, x, y) => {
              maxInitiative = Math.max(hex.initiative, maxInitiative);
            });
            G.battle = new Battle(maxInitiative, ctx.currentPlayer);
            console.log('Starting battle!');
          }

          console.log('Battle initiative ' + G.battle.initiative);

          G.battle.tokens = [];
          G.battleTurns = [];
          HexUtils.forEachHexOnBoard(G.cells, (hex, x, y) => {
            if (hex.initiative.includes(G.battle.initiative)) {
              G.battle.tokens.push( { x: x, y: y } );
              G.battleTurns.push(hex.player);
            }
          });

          console.log('Turns:');
          console.log(G.battleTurns);
          console.log('Tokens:');
          console.log(G.battle.tokens);

          if (!G.battleTurns.length) {
            G.battleTurns.push(0);
            ctx.events.endPhase( { next: G.battle.initiative ?
                                           'battle' : 'normal' } );
          }
        },

        /**
         * Execute current attack.
         */
        onTurnBegin: (G, ctx) => {
          console.log('battle.onTurnBegin()');

          /*
           * FIXME: We add a dummy turn for initiative phases without any
           * turns, because otherwise the framework freaks out. Skip such
           * a dummy turn here.
           */
          if (!G.battle.tokens.length) {
            return;
          }

          const token = G.battle.tokens.shift();
          //const pos = HexUtils.XyToPos(token.x, token.y);
          //const hex = G.cells[pos];
          console.log(`(${token.x}, ${token.y}) attacking`);

          if (!G.battle.tokens.length) {
            ctx.events.endPhase( { next: G.battle.initiative ?
                                           'battle' : 'normal' } );
            return;
          }
          ctx.events.endTurn();
        },

        /**
         * Execute the result of an interactive action.
         */
        onTurnEnd: (G, ctx) => {
          console.log('battle.onTurnEnd()');

          /* TODO: Things like The Clown or Sniper will be handled here. */
        },

        /**
         * Remove dead units from the board and decrement the initaitive level.
         * Clean up the battle state if it was the last initiative segment.
         */
        onPhaseEnd: (G, ctx) => {
          console.log('battle.onPhaseEnd()');

          HexUtils.forEachHexOnBoard(G.cells, (hex, x, y) => {
            const pos = HexUtils.XyToPos(x, y);
            if (hex.damage >= hex.health) {
              G.cells[pos] = null;
            }
          });

          if (!G.battle.initiative--) {
            G.battle = null;
          }
        },
      },
    },
  },
});
