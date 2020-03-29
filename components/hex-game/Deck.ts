import { Token } from './Token';

/**
 * Represents a deck of tokens of one player.
 */
export interface Deck {
  /** @private @const Game context. */
  ctx: any;
  /** @const Identifier of the army. */
  army: string;
  /** @private Remaining headquarter tokens. */
  hqTokens: Array<Token>;
  /** @private Remaining playable tokens. */
  tokens: Array<Token>;
}
