// A D&D 5e character sheet, stored as the `data` of a `character` asset.

/** Format of the sheets this version writes; a sheet with a higher format is shown read-only. */
export const SHEET_VERSION = 1;

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type Ability = (typeof ABILITIES)[number];

export const SKILLS = [
  { id: 'acrobatics', ability: 'dex' },
  { id: 'animalHandling', ability: 'wis' },
  { id: 'arcana', ability: 'int' },
  { id: 'athletics', ability: 'str' },
  { id: 'deception', ability: 'cha' },
  { id: 'history', ability: 'int' },
  { id: 'insight', ability: 'wis' },
  { id: 'intimidation', ability: 'cha' },
  { id: 'investigation', ability: 'int' },
  { id: 'medicine', ability: 'wis' },
  { id: 'nature', ability: 'int' },
  { id: 'perception', ability: 'wis' },
  { id: 'performance', ability: 'cha' },
  { id: 'persuasion', ability: 'cha' },
  { id: 'religion', ability: 'int' },
  { id: 'sleightOfHand', ability: 'dex' },
  { id: 'stealth', ability: 'dex' },
  { id: 'survival', ability: 'wis' },
] as const satisfies readonly { id: string; ability: Ability }[];
export type Skill = (typeof SKILLS)[number]['id'];

export const HIT_DICE = [6, 8, 10, 12] as const;
export type HitDie = (typeof HIT_DICE)[number];

export const CURRENCIES = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type SpellLevel = (typeof SPELL_LEVELS)[number];

export const ATTACK_KINDS = ['weapon', 'cantrip'] as const;
export type AttackKind = (typeof ATTACK_KINDS)[number];

export const ARMOR_TRAINING = ['light', 'medium', 'heavy', 'shields'] as const;
export type ArmorTraining = (typeof ARMOR_TRAINING)[number];

export const WEAPON_PROFICIENCIES = ['simple', 'martial'] as const;
export type WeaponProficiency = (typeof WEAPON_PROFICIENCIES)[number];

/** 0 not proficient, 1 proficient, 2 expertise. */
export type ProficiencyLevel = 0 | 1 | 2;

export interface SpellSlot {
  max: number;
  used: number;
}

export interface Spell {
  name: string;
  /** 0 is a cantrip. */
  level: number;
  prepared: boolean;
  notes: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  equipped: boolean;
  notes: string;
}

export interface Attack {
  name: string;
  kind: AttackKind;
  /** Attack bonus or save DC as written ("+5", "DC 14"). */
  bonus: string;
  damage: string;
  damageType: string;
  notes: string;
}

export interface Proficiencies {
  armor: Record<ArmorTraining, boolean>;
  weapons: Record<WeaponProficiency, boolean>;
  otherWeapons: string;
  tools: string;
}

export interface CharacterSheet {
  sheetVersion: number;
  playerName: string;
  race: string;
  background: string;
  alignment: string;
  className: string;
  subclass: string;
  level: number;
  experience: number;
  abilities: Record<Ability, number>;
  saveProficiencies: Record<Ability, boolean>;
  skillProficiencies: Record<Skill, ProficiencyLevel>;
  armorClass: number;
  speed: number;
  initiativeBonus: number;
  inspiration: boolean;
  hitPoints: { max: number; current: number; temporary: number };
  hitDie: HitDie;
  hitDiceUsed: number;
  deathSaves: { successes: number; failures: number };
  spellcastingAbility: Ability | null;
  spellSlots: Record<SpellLevel, SpellSlot>;
  spells: Spell[];
  attacks: Attack[];
  inventory: InventoryItem[];
  proficiencies: Proficiencies;
  /** Vault path of the portrait, which is also the art of the sheet's tokens. */
  portraitPath: string;
  currency: Record<Currency, number>;
  features: string;
  notes: string;
}

/** Bounds a sheet read from a file is held to. */
export const SHEET_LIMITS = {
  shortText: 200,
  longText: 20000,
  entries: 500,
  maxCurrency: 9999999,
  path: 1024,
} as const;
