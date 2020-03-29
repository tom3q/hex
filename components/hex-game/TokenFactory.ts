import * as army from './army.d';
import { TokenAbility, TokenAttack, TokenModifier, Token } from './Token';

export class TokenFactory {
  static createAttack(attack: any): TokenAttack {
    return {
      type: attack.type || 'unknown',
      angle: attack.angle || 0,
      damage: attack.damage || 1
    };
  }

  static createModifier(modifier: any): TokenModifier {
    return {
      type: modifier.type || 'unknown',
      value: modifier.value || 1,
      hostile: modifier.hostile || false,
      angle: modifier.angle || 0
    };
  }

  static createAbility(ability: any): TokenAbility {
    return {
      type: ability.type || 'unknown'
    }
  }

  static create(token: army.Token): Token {
    let t: Token = {
      id: token.id,
      hq: token.hq || false,
      instant: token.instant || false,
      foundation: token.foundation || false,
      health: token.health || 1,
      abilities: [],
      attacks: [],
      modifiers: [],
      initiative: [],
      shields: []
    };

    if (Array.isArray(token.abilities)) {
      t.abilities = token.abilities.map(a => TokenFactory.createAbility(a));
    }

    if (Array.isArray(token.attacks)) {
      for (let a of token.attacks) {
        if (a.angle !== -1) {
          t.attacks.push(TokenFactory.createAttack(a));
          continue;
        }

        for (let angle = 0; angle < 6; ++angle) {
          a.angle = angle;
          t.attacks.push(TokenFactory.createAttack(a));
        }
      }
    }

    if (Array.isArray(token.modifiers)) {
      for (let m of token.modifiers) {
        if (m.angle !== -1) {
          t.modifiers.push(TokenFactory.createModifier(m));
          continue;
        }

        for (let angle = 0; angle < 6; ++angle) {
          m.angle = angle;
          t.modifiers.push(TokenFactory.createModifier(m));
        }
      }
    }

    if (Array.isArray(token.initiative)) {
      t.initiative = [ ...token.initiative ].sort((a, b) => b - a);
    } else if (token.initiative !== undefined) {
      t.initiative = [ token.initiative ];
    }

    t.shields = [];
    if (Array.isArray(token.shields)) {
      t.shields = [ ...token.shields ];
    }

    return t;
  }
}
