import * as army from './army.d';
import * as HexUtils from './HexUtils';
import { HexGameState } from './HexGameState';

/**
 * @callback
 * @param hex A hex object.
 * @param x The horizontal coordinate of the hex.
 * @param y The vertical coordinate of the hex.
 */
type TokenActionHandler = (G: HexGameState, on: number) => boolean;

export class TokenAction {
  handler: TokenActionHandler;
  prompt?: string;

  constructor(handler: TokenActionHandler, prompt?: string) {
    this.handler = handler;
    this.prompt = prompt;
  }
}

export class TokenAbility {
  type: string;

  constructor(ability: any) {
    this.type = ability.type || 'unknown';
  }

  /**
   * @private Handle airstrike ability.
   *
   * Inflicts 1 damage on surrounding ones and dies.
   */
  private handleAirstike = (G: HexGameState, on: number): boolean => {
    const offsets = [
                        { x: 0, y: -2 },
      { x: -1, y: -1 },                  { x: 1, y: -1 },
                        { x: 0, y:  0 },
      { x: -1, y:  1 },                  { x: 1, y:  1 },
                        { x: 0, y:  2 },
    ];

    let target = HexUtils.Coordinates.fromPos(on);
    if (!target) return false;

    let offset;
    for (offset of offsets) {
      const x = target.x + offset.x;
      const y = target.y + offset.y;
      if (!HexUtils.XyIsValid(x, y)) continue;

      const pos = HexUtils.XyToPos(x, y);
      const hex = G.board.get(pos);
      if (hex && !hex.token.hq) {
        ++hex.damage;
      }
    }
    G.board.remove(on);
    return true;
  }

  getBattlePreAction(token: Token): TokenAction | null {
    switch(this.type) {
      case 'airstrike':
        /* FIXME: Use a printable name rather than the ID. */
        return new TokenAction(this.handleAirstike,
          `Do you want to detonate ${token.id} in this initiative segment?`);

      default:
        return null;
    }
  }

  getBattleAction(token: Token): TokenAction | null {
    switch(this.type) {
      default:
        return null;
    }
  }

  getBattlePostAction(token: Token): TokenAction | null {
    switch(this.type) {
      default:
        return null;
    }
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

  private handleCannon = (G: HexGameState, pos: number): boolean => {
    return true;
  }

  private handleMelee = (G: HexGameState, pos: number): boolean => {
    const offsets = [
      { x: 0, y: -2 }, { x: 1, y: -1 }, { x: 1, y:  1 },
      { x: 0, y:  2 }, { x: -1, y: -1 }, { x: -1, y:  1 },
    ];

    let coords = HexUtils.Coordinates.fromPos(pos);
    if (!coords) return false;

    const x = coords.x + offsets[this.angle].x;
    const y = coords.y + offsets[this.angle].y;
    const targetPos = HexUtils.XyToPos(x, y);
    const targetHex = G.board.get(targetPos);
    if (!targetHex) return false;

    targetHex.damage += this.damage;
    return true;
  }

  private handleRiffle = (G: HexGameState, pos: number): boolean => {
    return true;
  }

  getBattlePreAction(token: Token): TokenAction | null {
    switch(this.type) {
      default:
        return null;
    }
  }

  getBattleAction(token: Token): TokenAction | null {
    switch(this.type) {
      case 'cannon':
        return new TokenAction(this.handleCannon);
      case 'melee':
        return new TokenAction(this.handleMelee);
      case 'riffle':
        return new TokenAction(this.handleRiffle);
      default:
        return null;
    }
  }

  getBattlePostAction(token: Token): TokenAction | null {
    switch(this.type) {
      default:
        return null;
    }
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

  handleMedic = (G: HexGameState, pos: number): boolean => {
    return true;
  }

  getBattlePreAction(token: Token): TokenAction | null {
    switch(this.type) {
      default:
        return null;
    }
  }

  getBattleAction(token: Token): TokenAction | null {
    switch(this.type) {
      default:
        return null;
    }
  }

  getBattlePostAction(token: Token): TokenAction | null {
    switch(this.type) {
      case 'medic':
        return new TokenAction(this.handleMedic,
          `Select the attack for ${token.id} to take over.`);
      default:
        return null;
    }
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

  getBattlePreActions(): Array<TokenAction> {
    let actions = [];
    for (let ability of this.abilities) {
      let action = ability.getBattlePreAction(this);
      if (action) {
        actions.push(action);
      }
    }
    for (let attack of this.attacks) {
      let action = attack.getBattlePreAction(this);
      if (action) {
        actions.push(action);
      }
    }
    for (let modifier of this.modifiers) {
      let action = modifier.getBattlePreAction(this);
      if (action) {
        actions.push(action);
      }
    }
    return actions;
  }

  getBattleActions(): Array<TokenAction> {
    let actions = [];
    for (let ability of this.abilities) {
      let action = ability.getBattleAction(this);
      if (action) {
        actions.push(action);
      }
    }
    for (let attack of this.attacks) {
      let action = attack.getBattleAction(this);
      if (action) {
        actions.push(action);
      }
    }
    for (let modifier of this.modifiers) {
      let action = modifier.getBattleAction(this);
      if (action) {
        actions.push(action);
      }
    }
    return actions;
  }

  getBattlePostActions(): Array<TokenAction> {
    let actions = [];
    for (let ability of this.abilities) {
      let action = ability.getBattlePostAction(this);
      if (action) {
        actions.push(action);
      }
    }
    for (let attack of this.attacks) {
      let action = attack.getBattlePostAction(this);
      if (action) {
        actions.push(action);
      }
    }
    for (let modifier of this.modifiers) {
      let action = modifier.getBattlePostAction(this);
      if (action) {
        actions.push(action);
      }
    }
    return actions;
  }
};
