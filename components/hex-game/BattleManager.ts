import { Battle } from './Battle';

export class BattleManager {
  /**
   * Constructs a battle object.
   */
  static create(initiative: number, playerToResume: number): Battle {
    return {
      initiative: initiative,
      playerToResume: playerToResume,
      tokens: []
    };
  }
}
