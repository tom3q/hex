import { Deck } from './Deck';

/**
 * Represents a player in the game.
 */
export interface Player {
  /** Deck of the player. */
  deck: Deck | null;
  /** How many tokens the player used in current turn. */
  tokensUsedInTurn: number;
  /** Whether the player ended their turn. */
  turnEnded: boolean;
}
