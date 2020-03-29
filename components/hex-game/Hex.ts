import { Token } from './Token';

/**
 * Represents a hex token on the board.
 */
export interface Hex {
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
}
