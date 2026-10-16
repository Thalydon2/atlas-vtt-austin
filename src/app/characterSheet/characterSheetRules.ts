// The 5e numbers a sheet derives, and the edits that keep a sheet consistent.
import { SKILLS, SPELL_LEVELS, type Ability, type CharacterSheet, type ProficiencyLevel, type Skill, type SpellLevel, type SpellSlot } from './characterSheetTypes';

const MIN_LEVEL = 1;
const MAX_LEVEL = 20;

const clampLevel = (level: number): number => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.trunc(level)));

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((clampLevel(level) - 1) / 4);
}

export function savingThrowBonus(sheet: CharacterSheet, ability: Ability): number {
  return abilityModifier(sheet.abilities[ability]) + (sheet.saveProficiencies[ability] ? proficiencyBonus(sheet.level) : 0);
}

export function skillBonus(sheet: CharacterSheet, skill: Skill): number {
  const definition = SKILLS.find((entry) => entry.id === skill);
  if (!definition) return 0;
  return abilityModifier(sheet.abilities[definition.ability]) + sheet.skillProficiencies[skill] * proficiencyBonus(sheet.level);
}

export function passivePerception(sheet: CharacterSheet): number {
  return 10 + skillBonus(sheet, 'perception');
}

export function initiative(sheet: CharacterSheet): number {
  return abilityModifier(sheet.abilities.dex) + sheet.initiativeBonus;
}

/** Spell attack bonus; null without a spellcasting ability. */
export function spellAttackBonus(sheet: CharacterSheet): number | null {
  return sheet.spellcastingAbility
    ? abilityModifier(sheet.abilities[sheet.spellcastingAbility]) + proficiencyBonus(sheet.level)
    : null;
}

export function spellSaveDc(sheet: CharacterSheet): number | null {
  const bonus = spellAttackBonus(sheet);
  return bonus === null ? null : 8 + bonus;
}

export function hitDiceRemaining(sheet: CharacterSheet): number {
  return Math.max(0, sheet.level - sheet.hitDiceUsed);
}

/** "+3", "−1" (with a minus sign). */
export function signed(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : `+${value}`;
}

const amountOf = (value: number): number => (Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);
const whole = (value: number, fallback: number): number => (Number.isFinite(value) ? Math.trunc(value) : fallback);

/** Damage takes temporary hit points first. */
export function takeDamage(sheet: CharacterSheet, amount: number): CharacterSheet {
  const damage = amountOf(amount);
  const absorbed = Math.min(sheet.hitPoints.temporary, damage);
  const current = Math.max(0, sheet.hitPoints.current - (damage - absorbed));
  return { ...sheet, hitPoints: { ...sheet.hitPoints, temporary: sheet.hitPoints.temporary - absorbed, current } };
}

/** Healing up to the maximum; healing from 0 clears the death saves. */
export function heal(sheet: CharacterSheet, amount: number): CharacterSheet {
  const healing = amountOf(amount);
  if (healing === 0) return sheet;
  const current = Math.min(sheet.hitPoints.max, sheet.hitPoints.current + healing);
  const revived = sheet.hitPoints.current === 0 && current > 0;
  return {
    ...sheet,
    hitPoints: { ...sheet.hitPoints, current },
    deathSaves: revived ? { successes: 0, failures: 0 } : sheet.deathSaves,
  };
}

function hitDiceRegained(level: number): number {
  return Math.max(1, Math.floor(level / 2));
}

/** Full hit points, spell slots and half the hit dice back; temporary hit points and death saves cleared. */
export function longRest(sheet: CharacterSheet): CharacterSheet {
  const spellSlots = { ...sheet.spellSlots };
  for (const level of SPELL_LEVELS) spellSlots[level] = { ...sheet.spellSlots[level], used: 0 };
  return {
    ...sheet,
    hitPoints: { ...sheet.hitPoints, current: sheet.hitPoints.max, temporary: 0 },
    hitDiceUsed: Math.max(0, sheet.hitDiceUsed - hitDiceRegained(sheet.level)),
    deathSaves: { successes: 0, failures: 0 },
    spellSlots,
  };
}

/** Not proficient → proficient → expertise → not proficient. */
export function nextProficiency(level: ProficiencyLevel): ProficiencyLevel {
  return level === 0 ? 1 : level === 1 ? 2 : 0;
}

export function withLevel(sheet: CharacterSheet, value: number): CharacterSheet {
  const level = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, whole(value, sheet.level)));
  return { ...sheet, level, hitDiceUsed: Math.min(sheet.hitDiceUsed, level) };
}

export function withMaxHitPoints(sheet: CharacterSheet, value: number): CharacterSheet {
  const max = Math.max(0, whole(value, sheet.hitPoints.max));
  return { ...sheet, hitPoints: { ...sheet.hitPoints, max, current: Math.min(sheet.hitPoints.current, max) } };
}

export function withCurrentHitPoints(sheet: CharacterSheet, value: number): CharacterSheet {
  const current = Math.min(sheet.hitPoints.max, Math.max(0, whole(value, sheet.hitPoints.current)));
  return { ...sheet, hitPoints: { ...sheet.hitPoints, current } };
}

export function withHitDiceUsed(sheet: CharacterSheet, value: number): CharacterSheet {
  return { ...sheet, hitDiceUsed: Math.min(sheet.level, Math.max(0, whole(value, sheet.hitDiceUsed))) };
}

function withSlot(sheet: CharacterSheet, level: SpellLevel, slot: SpellSlot): CharacterSheet {
  return { ...sheet, spellSlots: { ...sheet.spellSlots, [level]: slot } };
}

export function withSlotMax(sheet: CharacterSheet, level: SpellLevel, value: number): CharacterSheet {
  const slot = sheet.spellSlots[level];
  if (!slot) return sheet;
  const max = Math.min(99, Math.max(0, whole(value, slot.max)));
  return withSlot(sheet, level, { max, used: Math.min(slot.used, max) });
}

/** Clicking slot `index` (1-based) spends up to it, or gives it back when it was the last spent. */
export function toggleSlot(sheet: CharacterSheet, level: SpellLevel, index: number): CharacterSheet {
  const slot = sheet.spellSlots[level];
  if (!slot || index < 1 || index > slot.max) return sheet;
  return withSlot(sheet, level, { ...slot, used: slot.used >= index ? index - 1 : index });
}

export function withDeathSaves(sheet: CharacterSheet, kind: 'successes' | 'failures', value: number): CharacterSheet {
  const count = Math.min(3, Math.max(0, whole(value, sheet.deathSaves[kind])));
  return { ...sheet, deathSaves: { ...sheet.deathSaves, [kind]: count } };
}

/** Clicking the last filled pip empties it; any other fills up to it. */
export function pipCount(current: number, clicked: number): number {
  return current === clicked ? clicked - 1 : clicked;
}
