import * as HexUtils from './HexUtils';
import * as Army from './army.d';
import { Deck } from './Deck';
import { Token } from './Token';
import { TokenFactory } from './TokenFactory';

export class DeckManager {
  private deck: Deck;

  constructor(deck: Deck) {
    this.deck = deck;
  }
  /**
   * Constructs a fresh deck with all cards of the army.
   * @param ctx boardgame.io game context.
   * @param army Identifier of the army.
   */
  static create(ctx: any, army: string): Deck {
    let deck: Deck = {
      ctx: ctx,
      army: army,
      hqTokens: [],
      tokens: []
    };

    const armyInfo: Army.Army = require(`hex-resources/resources/armies/${army}.json`);
    for (let jsonToken of armyInfo.tokens) {
      const token = TokenFactory.create(jsonToken);
      for (let i = 0; i < (jsonToken.count || 1); ++i) {
        if (token.hq) {
          /** TODO: Take deck from game settings. */
          token.health = 20;
          if (deck.hqTokens.length < HexUtils.CACHE_SIZE) {
            deck.hqTokens.push(token);
          }
        } else {
          deck.tokens.push(token);
        }
      }
    }

    return deck;
  }

  /**
   * Checks whether there are no headquarters tokens left in the deck.
   * @return True if there are no headquarters tokens left.
   */
  allHqsDrawn(): boolean {
    return !this.deck.hqTokens.length;
  }

  /**
   * Draws next headquarters token from the deck, in order.
   * @return Headquarters token drawn.
   */
  drawHq(): Token | undefined {
    if (!this.deck.hqTokens.length)
      return;

    return this.deck.hqTokens.pop();
  }

  /**
   * Draws next playable token from the deck randomly.
   * @return Token drawn.
   */
  draw(): Token | undefined {
    let idx = 0;

    if (!this.deck.tokens.length)
      return;

    do {
      idx = Math.floor(this.deck.ctx.random.Number() * this.deck.tokens.length);
    } while (idx === this.deck.tokens.length);

    let token = this.deck.tokens[idx];
    this.deck.tokens[idx] = this.deck.tokens[this.deck.tokens.length - 1];
    this.deck.tokens.pop();

    return token;
  }

  get(): Readonly<Deck> {
    return this.deck;
  }
}
