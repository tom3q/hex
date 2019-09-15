import * as army from './army.d';

export class TokenAbility {
  type: string;

  constructor(ability: any) {
    this.type = ability.type || 'unknown';
  }
}

export class TokenAttack {
  type: string;
  angle: number;
  damage: number;

  constructor(attack: any) {
    this.type = attack.type || 'unknown';
    this.angle = attack.angle || 0;
    this.damage = attack.damage || 1;
  }
}

export class TokenModifier {
  type: string;
  value: number;
  hostile: boolean;
  angle: number;

  constructor(modifier: any) {
    this.type = modifier.type || 'unknown';
    this.value = modifier.value || 1;
    this.hostile = modifier.hostile || false;
    this.angle = modifier.angle || 0;
  }
}

/**
 * Stores information about the token as parsed from the JSON files
 * and normalized to fill in default and optional values and unify
 * types (e.g. initiative). The meaning of the fields is exactly the
 * same as corresponding fields in the JSON description.
 */
export class Token {
  id: string;
  hq: boolean;
  instant: boolean;
  foundation: boolean;
  initiative: Array<number>;
  health: number;
  attacks: Array<TokenAttack>;
  abilities: Array<TokenAbility>;
  modifiers: Array<TokenModifier>;
  shields: Array<number>;

  constructor(token: army.Token) {
    this.id = token.id;
    this.hq = token.hq || false;
    this.instant = token.instant || false;
    this.foundation = token.foundation || false;
    this.health = token.health || 1;

    this.abilities = [];
    if (Array.isArray(token.abilities)) {
      this.abilities = token.abilities.map(a => new TokenAbility(a));
    }

    this.attacks = [];
    if (Array.isArray(token.attacks)) {
      for (let a of token.attacks) {
        if (a.angle !== -1) {
          this.attacks.push(new TokenAttack(a));
          continue;
        }

        for (let angle = 0; angle < 6; ++angle) {
          a.angle = angle;
          this.attacks.push(new TokenAttack(a));
        }
      }
    }

    this.modifiers = [];
    if (Array.isArray(token.modifiers)) {
      for (let m of token.modifiers) {
        if (m.angle !== -1) {
          this.modifiers.push(new TokenModifier(m));
          continue;
        }

        for (let angle = 0; angle < 6; ++angle) {
          m.angle = angle;
          this.modifiers.push(new TokenModifier(m));
        }
      }
    }

    if (Array.isArray(token.initiative)) {
      this.initiative = [ ...token.initiative ].sort((a, b) => b - a);
    } else if (token.initiative !== undefined) {
      this.initiative = [ token.initiative ];
    } else {
      this.initiative = [];
    }

    this.shields = [];
    if (Array.isArray(token.shields)) {
      this.shields = [ ...token.shields ];
    }
  }
};
