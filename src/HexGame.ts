/**
 * @fileoverview All the main boardgame.io game logic is located in
 * this file.
 */

import { Game } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import { TurnOrder } from 'boardgame.io/core';
import * as HexUtils from './HexUtils';
import { immerable } from "immer";
import * as army from './army.d';

/**
 * Represents a deck of tokens of one player.
 */
class Deck {
  /** @private @const Game context. */
  private ctx: any;
  /** @const Identifier of the army. */
  army: string;
  /** @private Remaining headquarter tokens. */
  private hqTokens: Array<army.Token>;
  /** @private Remaining playable tokens. */
  private tokens: Array<army.Token>;

  /**
   * Constructs a fresh deck with all cards of the army.
   * @param ctx boardgame.io game context.
   * @param army Identifier of the army.
   */
  constructor(ctx: any, army: string) {
    this.ctx = ctx;
    this.army = army;
    this.hqTokens = [];
    this.tokens = [];

    const armyInfo: army.Army = require(`./resources/armies/${army}.json`);
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
   * @return True if there are no headquarters tokens left.
   */
  allHqsDrawn() {
    return !this.hqTokens.length;
  }

  /**
   * Draws next headquarters token from the deck, in order.
   * @return Headquarters token drawn.
   */
  drawHq() {
    if (!this.hqTokens.length)
      return null;

    return this.hqTokens.pop();
  }

  /**
   * Draws next playable token from the deck randomly.
   * @return Token drawn.
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

  /** Identifier of the army. */
  army: string;
  /** Damage received by the unit. */
  damage: number;
  /** Current health level of the unit. */
  health: number;
  /** The list of unit initiatives sorted descending. */
  initiative: Array<number>;
  /** Identifier of the player. */
  player: number;
  /** Rotation of the token, in units of 60 degrees. */
  rotation: number;
  /** Token description JSON object. */
  token: army.Token;
  /** The turn number the token was used. */
  turnUsed: number;

  /**
   * Constructs a hex object.
   * @param player Identifier of the player.
   * @param army Identifier of the army.
   * @param token Token description JSON object.
   */
  constructor(player: number, army: string, token: army.Token) {
    this.army = army;
    this.damage = 0;
    this.health = token.health || 1;
    this.initiative = [];
    this.player = player;
    this.rotation = 0;
    this.token = token;
    this.turnUsed = -1;

    if (Array.isArray(token.initiative)) {
      this.initiative = [ ...token.initiative ].sort((a, b) => b - a);
    } else if (token.initiative !== undefined) {
      this.initiative = [ token.initiative ];
    }
  }
}

/**
 * Represents a player in the game.
 */
class Player {
  [immerable] = true

  /** Deck of the player. */
  deck: Deck | null;
  /** How many tokens the player used in current turn. */
  tokensUsedInTurn: number;
  /** Whether the player ended their turn. */
  turnEnded: boolean;

  /**
   * Construct a player object.
   */
  constructor() {
    this.deck = null;
    this.tokensUsedInTurn = 0;
    this.turnEnded = false;
  }
}

/*
 * Contains state of a battle.
 */
class Battle {
  [immerable] = true

  /** Current initiative segment. */
  initiative: number;
  /** The next player to give turn to after the battle. */
  playerToResume: number;
  /** The order of token actions in the current initiative. */
  tokens: Array<HexUtils.Coordinates>;

  /**
   * Constructs a battle object.
   */
  constructor(initiative: number, playerToResume: number) {
    this.initiative = initiative;
    this.playerToResume = playerToResume;
    this.tokens = [];
  }
}

interface HexGameState {
  battle: Battle | null;
  battleTurns: Array<number>;
  cells: Array<Hex | null>;
  players: Array<Player>;
}

/**
 * Validates whether the player made a valid combination of moves for the turn.
 * @param G boardgame.io game state
 * @param ctx boardgame.io game metadata
 * @return true if the the moves were valid and the turn can be ended, or false if
 *
 *      - there are any headquarter tokens in the cache (HQ setup phase), or
 *      - the player did not discard at least one of the tokens.
 */
function isTurnValid(G: HexGameState, ctx: any): boolean {
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
  handleAirstike_ = (G: HexGameState, ctx: any, on: number): boolean => {
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
  handleBattle_ = (G: HexGameState, ctx: any, on: number) => {
    if (!isTurnValid(G, ctx))
      return false;

    ctx.events.endPhase( { next: 'battle' } );
    G.players[ctx.currentPlayer].turnEnded = true;
    return true;
  }

  /**
   * Returns handler for given instant token type.
   * @param Instant token type identifier.
   * @return Handler function,
   *     or null if the type is invalid.
   */
  getHandler = (type: string) => {
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
  setup: (ctx: any) => ({
    /** State of the battle if in progress. */
    battle: null,
    /** Turn order for the battle phase. */
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
    endTurn(G: HexGameState, ctx: any) {
      if (!isTurnValid(G, ctx))
        return INVALID_MOVE;

      const player = Number(ctx.currentPlayer);
      const playerState = G.players[player];
      playerState.turnEnded = true;
    },

    /**
     * Moves a token to an empty cell.
     * @param from The position of the token to move.
     * @param to The position of the destination empty cell.
     * @return A new game state after the move or INVALID_MOVE if
     *
     *      - the token does not belong to the current player, or
     *      - the from position does not contain a token, or
     *      - the token is an instant token, or
     *      - the to position already contains a token, or
     *      - the player already used the maximum number of tokens in the turn, or
     *      - the to position is a cache of another player.
     */
    moveToken(G: HexGameState, ctx: any, from: number, to: number) {
      const player = Number(ctx.currentPlayer);
      if (HexUtils.PosIsCache(to) &&
          HexUtils.CachePosToPlayer(to) !== player)
        return INVALID_MOVE;

      const hex = G.cells[from];
      if (hex === null)
        return INVALID_MOVE;

      if (hex.player !== player)
        return INVALID_MOVE;

      if (hex.token.instant)
        return INVALID_MOVE;

      if (G.cells[to] !== null)
        return INVALID_MOVE;

      if (hex.turnUsed !== -1 && hex.turnUsed !== ctx.turn)
        return INVALID_MOVE;

      const playerState = G.players[player];
      if (!hex.token.hq) {
        if (HexUtils.PosIsCache(from)) {
          if (playerState.tokensUsedInTurn === HexUtils.CACHE_SIZE - 1) {
            return INVALID_MOVE;
          }
          playerState.tokensUsedInTurn++;
          hex.turnUsed = ctx.turn;
        }
        if (HexUtils.PosIsCache(to)) {
          playerState.tokensUsedInTurn--;
          hex.turnUsed = -1;
        }
      }

      G.cells[from] = null;
      G.cells[to] = hex;
    },

    /**
     * Rotates a token at pos by given number of rotation steps.
     * @param pos The position of the token to rotate.
     * @param rotation The number of rotation steps, with one
     *     step corresponding to 60 degrees rotation. Can be negative.
     * @return A new game state after the rotation or INVALID_MOVE if
     *
     *      - the token does not belong to the current player, or
     *      - the token is an instant token, or
     *      - the position does not contain a token.
     */
    rotateToken(G: HexGameState, ctx: any, pos: number, rotation: number) {
      const player = Number(ctx.currentPlayer);
      const hex = G.cells[pos];
      if (hex === null)
        return INVALID_MOVE;

      if (hex.player !== player)
        return INVALID_MOVE;

      if (hex.token.instant)
        return INVALID_MOVE;

      hex.rotation = (hex.rotation + rotation) % 6;
    },

    /**
     * Discards token(s) from the player's cache.
     * @param pos Position of the token to discard, null to discard all.
     * @return A new game state with the token removed from player's cache.
     */
    discardCache(G: HexGameState, ctx: any, pos: number) {
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
     * @param at The position of the instant token.
     * @param on The position on which to use the token.
     * @return A new game state after the instant token is used or INVALID_MOVE if
     *
     *      - the player already used the maximum number of tokens in the turn.
     */
    useInstantToken(G: HexGameState, ctx: any, at: number, on: any) {
      const playerState = G.players[ctx.currentPlayer];
      if (playerState.tokensUsedInTurn === HexUtils.CACHE_SIZE - 1)
        return INVALID_MOVE;

      const hex = G.cells[at];
      if (hex === null)
        return INVALID_MOVE;

      const abilities = hex.token.abilities;
      if (abilities === undefined || abilities.length !== 1)
        return INVALID_MOVE;

      const func = InstantHandlerFactory.getHandler(abilities[0].type);
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

    endTurnIf: (G: HexGameState, ctx: any) => {
      const player = Number(ctx.currentPlayer);
      console.log('endTurnIf() = ' + G.players[player].turnEnded);
      return G.players[player].turnEnded;
    },

    onTurnEnd: (G: HexGameState, ctx: any) => {
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

        onTurnBegin: (G: HexGameState, ctx: any) => {
          console.log('hqSetup.onTurnBegin()');
          const player = Number(ctx.currentPlayer);
          const playerState = G.players[player];

          /* TODO: Obtain the army from the lobby. */
          const deck = new Deck(
            ctx, player ? "borgo" : "moloch");
          playerState.deck = deck;

          let cachePos = player * HexUtils.CACHE_SIZE;
          let token;
          while ((token = deck.drawHq())) {
            G.cells[cachePos++] = new Hex(player, deck.army, token);
          }
        },

        onPhaseBegin: (G: HexGameState, ctx: any) => {
          console.log('hqSetup.onPhaseBegin()');
        },

        onPhaseEnd: (G: HexGameState, ctx: any) => {
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

        onTurnBegin: (G: HexGameState, ctx: any) => {
          console.log('normal.onTurnBegin()');
          const player = Number(ctx.currentPlayer);
          const playerState = G.players[player];
          let deck = playerState.deck;
          if (deck === null)
            throw "deck === null";

          for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
            const pos = HexUtils.PlayerCachePos(player, i);
            let cell = G.cells[pos];

            if (cell)
              continue;

            let token = deck.draw();
            if (token === null) {
              break;
            }
            G.cells[pos] = new Hex(player, deck.army, token);
          }
        },

        onPhaseBegin: (G: HexGameState, ctx: any) => {
          console.log('normal.onPhaseBegin()');
          /*
           * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
           * Remove when the framework starts handling the first turn of the
           * next phase correctly.
           */
          ctx.events.endTurn();
        },

        onPhaseEnd: (G: HexGameState, ctx: any) => {
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
        endTurnIf: (G: HexGameState, ctx: any) => false,
        turnOrder: TurnOrder.CUSTOM_FROM('battleTurns'),

        /**
         * If starting a battle, find the highest initiative level on the board
         * and initialize the Battle object that stores the battle state. Once
         * we have the battle state, build the list of units attacking with
         * current initiative level. The list is used to schedule players turns
         * and execute the attacks.
         */
        onPhaseBegin: (G: HexGameState, ctx: any) => {
          console.log('battle.onPhaseBegin()');

          /*
           * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
           * Remove when the framework starts handling the first turn of the
           * next phase correctly.
           */
          ctx.events.endTurn();

          if (!G.battle) {
            let maxInitiative = 0;
            HexUtils.forEachHexOnBoard(G.cells, (hex: Hex, x, y) => {
              maxInitiative = Math.max(maxInitiative, ...hex.initiative);
            });
            G.battle = new Battle(maxInitiative, ctx.currentPlayer);
            console.log('Starting battle!');
          }
          const battle = G.battle;

          console.log('Battle initiative ' + G.battle.initiative);

          battle.tokens = [];
          G.battleTurns = [];
          HexUtils.forEachHexOnBoard(G.cells, (hex, x, y) => {
            if (hex.initiative.includes(battle.initiative)) {
              battle.tokens.push( { x: x, y: y } );
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
        onTurnBegin: (G: HexGameState, ctx: any) => {
          console.log('battle.onTurnBegin()');

          /*
           * FIXME: We add a dummy turn for initiative phases without any
           * turns, because otherwise the framework freaks out. Skip such
           * a dummy turn here.
           */
          if (G.battle === null || !G.battle.tokens.length) {
            return;
          }

          const token = G.battle.tokens.shift();
          if (token === undefined)
            throw "token === undefined";
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
        onTurnEnd: (G: HexGameState, ctx: any) => {
          console.log('battle.onTurnEnd()');

          /* TODO: Things like The Clown or Sniper will be handled here. */
        },

        /**
         * Remove dead units from the board and decrement the initaitive level.
         * Clean up the battle state if it was the last initiative segment.
         */
        onPhaseEnd: (G: HexGameState, ctx: any) => {
          console.log('battle.onPhaseEnd()');

          HexUtils.forEachHexOnBoard(G.cells, (hex, x, y) => {
            const pos = HexUtils.XyToPos(x, y);
            if (hex.damage >= hex.health) {
              G.cells[pos] = null;
            }
          });

          if (G.battle !== null && !G.battle.initiative--) {
            G.battle = null;
          }
        },
      },
    },
  },
});
