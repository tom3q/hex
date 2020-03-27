import { immerable } from 'immer';
import { Token } from './Token';

/**
 * Represents a hex token on the board.
 */
export class Hex {
  [immerable] = true

  /** Identifier of the army. */
  army: string;
  /** Whether the unit attacked in current battle. */
  attackedInBattle: boolean;
  /** Damage received by the unit. */
  damage: number;
  /** Whether the unit was damaged in current battle. */
  damagedInBattle: boolean;
  /** Current health level of the unit. */
  health: number;
  /** The list of unit initiatives sorted descending. */
  initiative: Array<number>;
  /** Identifier of the player. */
  player: number;
  /** Rotation of the token, in units of 60 degrees. */
  rotation: number;
  /** Token description. */
  token: Readonly<Token>;
  /** The turn number the token was used. */
  turnUsed: number;

  /**
   * Constructs a hex object.
   * @param player Identifier of the player.
   * @param army Identifier of the army.
   * @param token Token description JSON object.
   */
  constructor(player: number, army: string, token: Readonly<Token>) {
    this.army = army;
    this.attackedInBattle = false;
    this.damage = 0;
    this.damagedInBattle = false;
    this.health = token.health || 1;
    this.initiative = [ ...token.initiative ];
    this.player = player;
    this.rotation = 0;
    this.token = token;
    this.turnUsed = -1;
  }
}
