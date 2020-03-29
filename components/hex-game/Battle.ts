/*
 * Contains state of a battle.
 */
export interface Battle {
  /** Current initiative segment. */
  initiative: number;
  /** The next player to give turn to after the battle. */
  playerToResume: number;
  /** The order of token actions in the current initiative. */
  tokens: Array<number>;
}
