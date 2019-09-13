import { immerable } from 'immer';
import * as HexUtils from './HexUtils';

/*
 * Contains state of a battle.
 */
export class Battle {
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
