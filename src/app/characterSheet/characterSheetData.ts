import { isFiniteNumber, isRecord } from '../utils/guards';
import {
  ABILITIES,
  ARMOR_TRAINING,
  ATTACK_KINDS,
  CURRENCIES,
  HIT_DICE,
  SHEET_LIMITS,
  SHEET_VERSION,
  SKILLS,
  SPELL_LEVELS,
  WEAPON_PROFICIENCIES,
  type Attack,
  type CharacterSheet,
  type HitDie,
  type InventoryItem,
  type ProficiencyLevel,
  type Proficiencies,
  type Spell,
  type SpellLevel,
  type SpellSlot,
} from './characterSheetTypes';

function fill<K extends string | number, V>(keys: readonly K[], value: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, value(key)])) as Record<K, V>;
}

/** A new, empty sheet. */
export function emptyCharacterSheet(): CharacterSheet {
  return {
    sheetVersion: SHEET_VERSION,
    playerName: '',
    race: '',
    background: '',
    alignment: '',
    className: '',
    subclass: '',
    level: 1,
    experience: 0,
    abilities: fill(ABILITIES, () => 10),
    saveProficiencies: fill(ABILITIES, () => false),
    skillProficiencies: fill(SKILLS.map((skill) => skill.id), (): ProficiencyLevel => 0),
    armorClass: 10,
    speed: 30,
    initiativeBonus: 0,
    inspiration: false,
    hitPoints: { max: 10, current: 10, temporary: 0 },
    hitDie: 8,
    hitDiceUsed: 0,
    deathSaves: { successes: 0, failures: 0 },
    spellcastingAbility: null,
    spellSlots: fill(SPELL_LEVELS, (): SpellSlot => ({ max: 0, used: 0 })),
    spells: [],
    attacks: [],
    inventory: [],
    proficiencies: {
      armor: fill(ARMOR_TRAINING, () => false),
      weapons: fill(WEAPON_PROFICIENCIES, () => false),
      otherWeapons: '',
      tools: '',
    },
    portraitPath: '',
    currency: fill(CURRENCIES, () => 0),
    features: '',
    notes: '',
  };
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return isFiniteNumber(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : fallback;
}

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function entries(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.slice(0, SHEET_LIMITS.entries).filter(isRecord) : [];
}

function readSpells(value: unknown): Spell[] {
  return entries(value).map((entry) => ({
    name: text(entry.name, SHEET_LIMITS.shortText),
    level: integer(entry.level, 0, 0, 9),
    prepared: entry.prepared === true,
    notes: text(entry.notes, SHEET_LIMITS.longText),
  }));
}

function readInventory(value: unknown): InventoryItem[] {
  return entries(value).map((entry) => ({
    name: text(entry.name, SHEET_LIMITS.shortText),
    quantity: integer(entry.quantity, 1, 0, 99999),
    equipped: entry.equipped === true,
    notes: text(entry.notes, SHEET_LIMITS.longText),
  }));
}

function readAttacks(value: unknown): Attack[] {
  return entries(value).map((entry) => ({
    name: text(entry.name, SHEET_LIMITS.shortText),
    kind: ATTACK_KINDS.find((kind) => kind === entry.kind) ?? 'weapon',
    bonus: text(entry.bonus, SHEET_LIMITS.shortText),
    damage: text(entry.damage, SHEET_LIMITS.shortText),
    damageType: text(entry.damageType, SHEET_LIMITS.shortText),
    notes: text(entry.notes, SHEET_LIMITS.longText),
  }));
}

function readProficiencies(value: unknown, into: Proficiencies): void {
  const stored = record(value);
  const armor = record(stored.armor);
  const weapons = record(stored.weapons);
  for (const kind of ARMOR_TRAINING) into.armor[kind] = armor[kind] === true;
  for (const kind of WEAPON_PROFICIENCIES) into.weapons[kind] = weapons[kind] === true;
  into.otherWeapons = text(stored.otherWeapons, SHEET_LIMITS.longText);
  into.tools = text(stored.tools, SHEET_LIMITS.longText);
}

function readSpellSlots(value: unknown, into: Record<SpellLevel, SpellSlot>): void {
  const stored = record(value);
  for (const level of SPELL_LEVELS) {
    const slot = record(stored[String(level)]);
    const max = integer(slot.max, 0, 0, 99);
    into[level] = { max, used: integer(slot.used, 0, 0, max) };
  }
}

function readProficiency(value: unknown): ProficiencyLevel {
  return value === 1 || value === 2 ? value : 0;
}

function readHitDie(value: unknown, fallback: HitDie): HitDie {
  return HIT_DICE.find((die) => die === value) ?? fallback;
}

/** The sheet a character asset's data holds, every field checked and bounded; missing fields take their defaults. */
export function readCharacterSheet(data: unknown): CharacterSheet {
  const sheet = emptyCharacterSheet();
  const stored = record(data);
  sheet.playerName = text(stored.playerName, SHEET_LIMITS.shortText);
  sheet.race = text(stored.race, SHEET_LIMITS.shortText);
  sheet.background = text(stored.background, SHEET_LIMITS.shortText);
  sheet.alignment = text(stored.alignment, SHEET_LIMITS.shortText);
  sheet.className = text(stored.className, SHEET_LIMITS.shortText);
  sheet.subclass = text(stored.subclass, SHEET_LIMITS.shortText);
  sheet.level = integer(stored.level, sheet.level, 1, 20);
  sheet.experience = integer(stored.experience, 0, 0, 99999999);

  const abilities = record(stored.abilities);
  const saves = record(stored.saveProficiencies);
  for (const ability of ABILITIES) {
    sheet.abilities[ability] = integer(abilities[ability], 10, 1, 30);
    sheet.saveProficiencies[ability] = saves[ability] === true;
  }
  const skills = record(stored.skillProficiencies);
  for (const skill of SKILLS) sheet.skillProficiencies[skill.id] = readProficiency(skills[skill.id]);

  sheet.armorClass = integer(stored.armorClass, sheet.armorClass, 0, 99);
  sheet.speed = integer(stored.speed, sheet.speed, 0, 999);
  sheet.initiativeBonus = integer(stored.initiativeBonus, 0, -20, 20);
  sheet.inspiration = stored.inspiration === true;

  const hitPoints = record(stored.hitPoints);
  const max = integer(hitPoints.max, sheet.hitPoints.max, 0, 9999);
  sheet.hitPoints = { max, current: integer(hitPoints.current, max, 0, max), temporary: integer(hitPoints.temporary, 0, 0, 9999) };
  sheet.hitDie = readHitDie(stored.hitDie, sheet.hitDie);
  sheet.hitDiceUsed = integer(stored.hitDiceUsed, 0, 0, sheet.level);
  const deathSaves = record(stored.deathSaves);
  sheet.deathSaves = { successes: integer(deathSaves.successes, 0, 0, 3), failures: integer(deathSaves.failures, 0, 0, 3) };

  sheet.spellcastingAbility = ABILITIES.find((ability) => ability === stored.spellcastingAbility) ?? null;
  readSpellSlots(stored.spellSlots, sheet.spellSlots);
  sheet.spells = readSpells(stored.spells);
  sheet.attacks = readAttacks(stored.attacks);
  sheet.inventory = readInventory(stored.inventory);
  readProficiencies(stored.proficiencies, sheet.proficiencies);
  sheet.portraitPath = text(stored.portraitPath, SHEET_LIMITS.path);

  const currency = record(stored.currency);
  for (const coin of CURRENCIES) sheet.currency[coin] = integer(currency[coin], 0, 0, SHEET_LIMITS.maxCurrency);
  sheet.features = text(stored.features, SHEET_LIMITS.longText);
  sheet.notes = text(stored.notes, SHEET_LIMITS.longText);
  return sheet;
}

/** True when the data was written by a newer Atlas; such a sheet is shown and never written. */
export function isNewerSheet(data: unknown): boolean {
  return isRecord(data) && isFiniteNumber(data.sheetVersion) && data.sheetVersion > SHEET_VERSION;
}

/** One line for cards and previews: "Elf · Wizard 5". */
export function sheetSummary(sheet: CharacterSheet): string {
  const className = sheet.className.trim();
  const classLine = className ? `${className} ${sheet.level}` : `Level ${sheet.level}`;
  return [sheet.race.trim(), classLine].filter(Boolean).join(' · ');
}
