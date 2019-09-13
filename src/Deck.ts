import * as HexUtils from './HexUtils';
import * as army from './army.d';

/**
 * Represents a deck of tokens of one player.
 */
export class Deck {
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
