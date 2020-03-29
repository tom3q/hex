import { Hex } from './Hex';
import { Token } from './Token';

export class HexManager {
  hex: Hex;

  constructor(hex: Hex) {
    this.hex = hex;
  }

  static create(player: number, army: string, token: Readonly<Token>): Hex {
    return {
      army: army,
      attackedInBattle: false,
      damage: 0,
      damagedInBattle: false,
      health: token.health || 1,
      initiative: [ ...token.initiative ],
      player: player,
      rotation: 0,
      token: token,
      turnUsed: -1
    };
  }

  get(): Hex {
    return this.hex;
  }
}
