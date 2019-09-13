import { immerable } from 'immer';
import * as army from './army.d';

/**
 * Represents a hex token on the board.
 */
export class Hex {
  [immerable] = true

  /** Identifier of the army. */
  army: string;
  /** Damage received by the unit. */
  damage: number;
  /** Current health level of the unit. */
  health: number;
  /** The list of unit initiatives sorted descending. */
  initiative: Array<number>;
  /** Identifier of the player. */
  player: number;
  /** Rotation of the token, in units of 60 degrees. */
  rotation: number;
  /** Token description JSON object. */
  token: army.Token;
  /** The turn number the token was used. */
  turnUsed: number;

  /**
   * Constructs a hex object.
   * @param player Identifier of the player.
   * @param army Identifier of the army.
   * @param token Token description JSON object.
   */
  constructor(player: number, army: string, token: army.Token) {
    this.army = army;
    this.damage = 0;
    this.health = token.health || 1;
    this.initiative = [];
    this.player = player;
    this.rotation = 0;
    this.token = token;
    this.turnUsed = -1;

    if (Array.isArray(token.initiative)) {
      this.initiative = [ ...token.initiative ].sort((a, b) => b - a);
    } else if (token.initiative !== undefined) {
      this.initiative = [ token.initiative ];
    }
  }
}
