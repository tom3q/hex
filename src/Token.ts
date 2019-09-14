import * as army from './army.d';

export class TokenAbility {
  type: string = '';
}

export class TokenAttack {
  type: string = '';
  angle: number = 0;
  damage: number = 0;
}

export class TokenModifier {
  type: string = '';
  value: number = 1;
  hostile: boolean = false;
  angle: number = 0;
}

/**
 * Stores information about the token as parsed from the JSON files
 * and normalized to fill in default and optional values and unify
 * types (e.g. initiative). The meaning of the fields is exactly the
 * same as corresponding fields in the JSON description.
 */
export class Token {
  id: string = '';
  hq: boolean = false;
  instant: boolean = false;
  foundation: boolean = false;
  initiative: Array<number> = [];
  health: number = 1;
  attacks: Array<TokenAttack> = [];
  abilities: Array<TokenAbility> = [];
  modifiers: Array<TokenModifier> = [];
  shields: Array<number> = [];

  constructor(init?: army.Token) {
    Object.assign(this, init);

    if (!Array.isArray(this.initiative)) {
      this.initiative = [ this.initiative ];
    }
    this.initiative = this.initiative.sort((a, b) => b - a);
  }
};
