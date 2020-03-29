/**
 * @fileoverview All the main boardgame.io game logic is located in
 * this file.
 */

import { ActivePlayers } from 'boardgame.io/core';
import { INVALID_MOVE } from 'boardgame.io/core';
import { TurnOrder } from 'boardgame.io/core';
import * as HexGameUtils from './HexGameUtils';
import * as HexUtils from './HexUtils';
import { Battle } from './Battle';
import { BoardState } from './BoardState';
import { Deck } from './Deck';
import { Hex } from './Hex';
import { HexGameState } from './HexGameState';
import { InstantHandlerFactory } from './InstantHandlerFactory';
import { Player } from './Player';

/**
 * Verifies end turn conditions and marks the turn as ended if all of them
 * are met.
 * @return A new game state with player's turn ended or INVALID_MOVE otherwise.
 */
function endTurn(G: HexGameState, ctx: any) {
  if (!HexGameUtils.isTurnValid(G, ctx))
    {console.trace(); return INVALID_MOVE;}
 
  ctx.events.endTurn();
  return undefined;
}

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
function moveToken(G: HexGameState, ctx: any, from: number, to: number) {
  const player = Number(ctx.currentPlayer);
  if (HexUtils.PosIsCache(to) &&
      HexUtils.CachePosToPlayer(to) !== player)
    return INVALID_MOVE;

  const hex = G.board.get(from);
  if (hex === null)
    return INVALID_MOVE;

  if (hex.player !== player)
    return INVALID_MOVE;

  if (hex.token.instant)
    return INVALID_MOVE;

  if (board.get(to) !== null)
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

  G.board.remove(from);
  G.board.put(to, hex);
  return undefined;
}

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
function rotateToken(G: HexGameState, ctx: any, pos: number, rotation: number) {
  const player = Number(ctx.currentPlayer);
  const hex = G.board.get(pos);
  if (hex === null)
    return INVALID_MOVE;

  if (hex.player !== player)
    return INVALID_MOVE;

  if (hex.token.instant)
    return INVALID_MOVE;

  hex.rotation = (hex.rotation + rotation) % 6;
  return undefined;
}

/**
 * Discards token(s) from the player's cache.
 * @param pos Position of the token to discard, null to discard all.
 * @return A new game state with the token removed from player's cache.
 */
function discardCache(G: HexGameState, ctx: any, pos: number) {
  const player = Number(ctx.currentPlayer);
  if (pos === null) {
    for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
      const pos = HexUtils.PlayerCachePos(player, i);
      G.board.remove(pos);
    }
    return;
  }

  if (!HexUtils.PosIsCache(pos))
    return INVALID_MOVE;

  if (HexUtils.CachePosToPlayer(pos) !== player)
    return INVALID_MOVE;

  G.board.remove(pos);
  return undefined;
}

/**
 * Uses an instant token.
 * @param at The position of the instant token.
 * @param on The position on which to use the token.
 * @return A new game state after the instant token is used or INVALID_MOVE if
 *
 *      - the player already used the maximum number of tokens in the turn.
 */
function useInstantToken(G: HexGameState, ctx: any, at: number, on: any) {
  const playerState = G.players[ctx.currentPlayer];
  if (playerState.tokensUsedInTurn === HexUtils.CACHE_SIZE - 1)
    return INVALID_MOVE;

  const hex = G.board.get(at);
  if (hex === null)
    return INVALID_MOVE;

  const abilities = hex.token.abilities;
  if (abilities === undefined || abilities.length !== 1)
    return INVALID_MOVE;

  const func = InstantHandlerFactory.getHandler(abilities[0].type);
  if (!func || !func(G, ctx, on))
    return INVALID_MOVE;

  playerState.tokensUsedInTurn++;
  G.board.remove(at);
  return undefined;
}

/**
 * boardgame.io Game object implementing all of the game logic.
 */
export const HexGame = {
  name: "Hex",

  setup: (ctx: any) => ({
    /** State of the battle if in progress. */
    battle: null,
    /** Turn order for the battle phase. */
    battleTurns: [],
    /** State of the board. */
    board: new BoardState(),
    /** All players participating in the game. */
    players: Array.from({ length: ctx.numPlayers }, () => new Player())
  }),

  events: {
    endPhase: false,
    endTurn: false,
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
      start: true,
      next: 'normal',

      moves: {
        moveToken,
        rotateToken,
        endTurn,
      },

      turn: {
        order: TurnOrder.ONCE,
        activePlayers: ActivePlayers.ALL_ONCE,

        onBegin: (G: HexGameState, ctx: any) => {
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
            G.board.put(cachePos++, new Hex(player, deck.army, token));
          }
        },
      },

      onBegin: (G: HexGameState, ctx: any) => {
        console.log('hqSetup.onBegin()');
      },

      onEnd: (G: HexGameState, ctx: any) => {
        console.log('hqSetup.onEnd()');
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
      moves: {
        moveToken,
        rotateToken,
        discardCache,
        useInstantToken,
        endTurn,
      },

      turn: {
        order: TurnOrder.DEFAULT,
        
        onBegin: (G: HexGameState, ctx: any) => {
          console.log('normal.onTurnBegin()');
          const player = Number(ctx.currentPlayer);
          const playerState = G.players[player];
          let deck = playerState.deck;
          if (deck === null)
            throw new Error('deck === null');
  
          for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
            const pos = HexUtils.PlayerCachePos(player, i);
            let cell = G.board.get(pos);
  
            if (cell)
              continue;
  
            let token = deck.draw();
            if (token === null) {
              break;
            }
            G.board.put(pos, new Hex(player, deck.army, token));
          }
        },

        onEnd: (G: HexGameState, ctx: any) => {
          console.log('onTurnEnd()');
          const player = Number(ctx.currentPlayer);
          const playerState = G.players[player];
          playerState.tokensUsedInTurn = 0;
        },
      },

      onBegin: (G: HexGameState, ctx: any) => {
        console.log('normal.onBegin()');
        /*
         * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
         * Remove when the framework starts handling the first turn of the
         * next phase correctly.
         */
        ctx.events.endTurn();
      },

      onEnd: (G: HexGameState, ctx: any) => {
        console.log('normal.onEnd()');
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

      turn: {
        endIf: (G: HexGameState, ctx: any) => false,
        order: TurnOrder.CUSTOM_FROM('battleTurns'),

        /**
         * Execute current attack.
         */
        onBegin: (G: HexGameState, ctx: any) => {
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
            throw new Error('token === undefined');
          //const pos = HexUtils.XyToPos(token.x, token.y);
          //const hex = G.board.get(pos);
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
        onEnd: (G: HexGameState, ctx: any) => {
          console.log('battle.onTurnEnd()');
  
          /* TODO: Things like The Clown or Sniper will be handled here. */
        },

      },

      /**
       * If starting a battle, find the highest initiative level on the board
       * and initialize the Battle object that stores the battle state. Once
       * we have the battle state, build the list of units attacking with
       * current initiative level. The list is used to schedule players turns
       * and execute the attacks.
       */
      onBegin: (G: HexGameState, ctx: any) => {
        console.log('battle.onBegin()');

        /*
         * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
         * Remove when the framework starts handling the first turn of the
         * next phase correctly.
         */
        ctx.events.endTurn();

        if (!G.battle) {
          let maxInitiative = 0;
          G.board.forEachHex((hex: Hex, coords: HexUtils.Coordinates) => {
            maxInitiative = Math.max(maxInitiative, ...hex.initiative);
          });
          G.battle = new Battle(maxInitiative, ctx.currentPlayer);
          console.log('Starting battle!');
        }
        const battle = G.battle;

        console.log('Battle initiative ' + G.battle.initiative);

        battle.tokens = [];
        G.battleTurns = [];
        G.board.forEachHex((hex: Hex, coords: HexUtils.Coordinates) => {
          if (hex.initiative.includes(battle.initiative)) {
            battle.tokens.push(coords);
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
       * Remove dead units from the board and decrement the initaitive level.
       * Clean up the battle state if it was the last initiative segment.
       */
      onEnd: (G: HexGameState, ctx: any) => {
        console.log('battle.onEnd()');

        G.board.forEachHex((hex: Hex, coords: HexUtils.Coordinates) => {
          if (hex.damage >= hex.health) {
            G.board.remove(coords.toPos());
          }
        });

        if (G.battle !== null && !G.battle.initiative--) {
          G.battle = null;
        }
      },
    },
  },
};
