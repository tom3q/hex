import { immerable } from 'immer';
import { Deck } from './Deck';

/**
 * Represents a player in the game.
 */
export class Player {
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
