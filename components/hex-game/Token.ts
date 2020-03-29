export interface TokenAbility {
  type: string;
}

export interface TokenAttack {
  type: string;
  angle: number;
  damage: number;
}

export interface TokenModifier {
  type: string;
  value: number;
  hostile: boolean;
  angle: number;
}

/**
 * Stores information about the token as parsed from the JSON files
 * and normalized to fill in default and optional values and unify
 * types (e.g. initiative). The meaning of the fields is exactly the
 * same as corresponding fields in the JSON description.
 */
export interface Token {
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
}
