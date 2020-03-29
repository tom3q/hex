import { Player } from './Player';

export class PlayerManager {
  /**
   * Construct a player object.
   */
  static create(): Player {
    return {
      deck: null,
      tokensUsedInTurn: 0,
      turnEnded: false
    };
  }
}
