/**
 * @fileoverview All the main boardgame.io game logic is located in
 * this file.
 */

import { Game } from 'boardgame.io/core';
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
 * boardgame.io Game object implementing all of the game logic.
 */
export const HexGame = Game({
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

  moves: {
    /**
     * Verifies end turn conditions and marks the turn as ended if all of them
     * are met.
     * @return A new game state with player's turn ended or INVALID_MOVE otherwise.
     */
    endTurn(G: HexGameState, ctx: any) {
      if (!HexGameUtils.isTurnValid(G, ctx))
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

      const hex = G.board.get(from);
      if (hex === null)
        return INVALID_MOVE;

      if (hex.player !== player)
        return INVALID_MOVE;

      if (hex.token.instant)
        return INVALID_MOVE;

      if (G.board.get(to) !== null)
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
      const hex = G.board.get(pos);
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
          G.board.remove(pos);
        }
        return;
      }

      if (!HexUtils.PosIsCache(pos))
        return INVALID_MOVE;

      if (HexUtils.CachePosToPlayer(pos) !== player)
        return INVALID_MOVE;

      G.board.remove(pos);
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
    },

    battlePreAction(G: HexGameState, ctx: any, at: number, on?: number) {
      const player = Number(ctx.currentPlayer);
      G.players[player].turnEnded = true;
    },

    battlePostAction(G: HexGameState, ctx: any, at: number, on?: number) {
      const player = Number(ctx.currentPlayer);
      G.players[player].turnEnded = true;
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
      console.log(`onTurnEnd(${ctx.currentPlayer})`);
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
          console.log(`hqSetup.onTurnBegin(${ctx.currentPlayer})`);
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
          console.log(`normal.onTurnBegin(${ctx.currentPlayer})`);
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
       */
      battle: {
        next: 'postBattle',
        allowedMoves: [ 'battlePreAction' ],
        turnOrder: TurnOrder.ONCE,

        onPhaseBegin: (G: HexGameState, ctx: any) => {
          console.log('battle.onPhaseBegin()');

          if (!G.battle) {
            console.log('Starting battle!');
            G.battle = new Battle(ctx.currentPlayer);
            G.battle.start(G);
          }

          if (!G.battle.prepareSegment(G)) {
            ctx.events.endTurn( { next: G.battle.initiator } );
            ctx.events.endPhase( { next: 'normal' } );
            G.battle = null;
            console.log('Battle ended!');
            return;
          }

          console.log('Battle initiative ' + G.battle.initiative);

          ctx.events.endTurn( { next: '0' } );
        },

        onTurnBegin: (G: HexGameState, ctx: any) => {
          console.log(`battle.onTurnBegin(${ctx.currentPlayer})`);

          if (!G.battle) {
            return;
          }

          const player = Number(ctx.currentPlayer);
          if (!G.battle.runPreActions(G, player)) {
            ctx.events.endTurn();
          }
        },

        onPhaseEnd: (G: HexGameState, ctx: any) => {
          console.log('battle.onPhaseEnd()');

          if (!G.battle) {
            return;
          }

          G.battle.runSegment(G);
        },
      },

      postBattle: {
        next: 'battle',
        allowedMoves: [ 'battlePostAction' ],
        turnOrder: TurnOrder.ONCE,

        onPhaseBegin: (G: HexGameState, ctx: any) => {
          console.log('postBattle.onPhaseBegin()');

          /*
           * TODO(https://github.com/nicolodavis/boardgame.io/issues/394))
           * Remove when the framework starts handling the first turn of the
           * next phase correctly.
           */
          ctx.events.endTurn( { next: '0' } );
        },

        onTurnBegin: (G: HexGameState, ctx: any) => {
          console.log(`postBattle.onTurnBegin(${ctx.currentPlayer})`);

          if (!G.battle) {
            return;
          }

          const player = Number(ctx.currentPlayer);
          if (!G.battle.runPostActions(G, player)) {
            ctx.events.endTurn();
          }
        },

        /**
         * Remove dead units from the board and decrement the initaitive level.
         * Clean up the battle state if it was the last initiative segment.
         */
        onPhaseEnd: (G: HexGameState, ctx: any) => {
          console.log('postBattle.onPhaseEnd()');

          if (!G.battle) {
            return;
          }

          G.battle.finishSegment(G);
        },
      },
    },
  },
});
