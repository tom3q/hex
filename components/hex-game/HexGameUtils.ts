import { BoardStateManager } from './BoardStateManager';
import * as HexUtils from './HexUtils';
import { HexGameState } from './HexGameState';

/**
 * Validates whether the player made a valid combination of moves for the turn.
 * @param G boardgame.io game state
 * @param ctx boardgame.io game metadata
 * @return true if the the moves were valid and the turn can be ended, or false if
 *
 *      - there are any headquarter tokens in the cache (HQ setup phase), or
 *      - the player did not discard at least one of the tokens.
 */
export function isTurnValid(G: HexGameState, ctx: any): boolean {
  const player = Number(ctx.currentPlayer);

  let numTokensInCache = 0;
  for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
    const pos = HexUtils.PlayerCachePos(player, i);
    const board = new BoardStateManager(G.board);
    let hex = board.get(pos);
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
