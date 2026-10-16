import { describe, expect, it } from 'vitest';
import { emptyCharacterSheet, isNewerSheet, readCharacterSheet, sheetSummary } from '../../src/app/characterSheet/characterSheetData';
import {
  abilityModifier,
  heal,
  longRest,
  proficiencyBonus,
  signed,
  skillBonus,
  spellSaveDc,
  takeDamage,
  toggleSlot,
  withLevel,
} from '../../src/app/characterSheet/characterSheetRules';
import { lootAsGear, withGear } from '../../src/app/characterSheet/sheetLoot';
import { noteExcerpt } from '../../src/app/pixi/playerPins/noteExcerpt';

describe('character sheet data', () => {
  it('reads nothing as an empty sheet', () => {
    expect(readCharacterSheet(undefined)).toEqual(emptyCharacterSheet());
  });

  it('bounds what a file holds', () => {
    const sheet = readCharacterSheet({
      level: 99,
      abilities: { str: 50, dex: 'x' },
      hitPoints: { max: 20, current: 35 },
      skillProficiencies: { stealth: 2, arcana: 7 },
      hitDie: 7,
      spells: [{ name: 'Fire Bolt', level: 0 }, 'junk'],
    });
    expect(sheet.level).toBe(20);
    expect(sheet.abilities.str).toBe(30);
    expect(sheet.abilities.dex).toBe(10);
    expect(sheet.hitPoints).toEqual({ max: 20, current: 20, temporary: 0 });
    expect(sheet.skillProficiencies.stealth).toBe(2);
    expect(sheet.skillProficiencies.arcana).toBe(0);
    expect(sheet.hitDie).toBe(8);
    expect(sheet.spells).toHaveLength(1);
  });

  it('knows sheets of a newer format and sums a sheet up', () => {
    expect(isNewerSheet({ sheetVersion: 2 })).toBe(true);
    expect(isNewerSheet({ sheetVersion: 1 })).toBe(false);
    expect(sheetSummary({ ...emptyCharacterSheet(), race: 'Elf', className: 'Wizard', level: 5 })).toBe('Elf · Wizard 5');
    expect(sheetSummary(emptyCharacterSheet())).toBe('Level 1');
  });
});

describe('character sheet rules', () => {
  it('derives the 5e numbers', () => {
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(15)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(signed(-2)).toBe('−2');
    const sheet = { ...emptyCharacterSheet(), level: 5, abilities: { ...emptyCharacterSheet().abilities, dex: 16, int: 18 } };
    expect(skillBonus({ ...sheet, skillProficiencies: { ...sheet.skillProficiencies, stealth: 2 } }, 'stealth')).toBe(9);
    expect(spellSaveDc({ ...sheet, spellcastingAbility: 'int' })).toBe(15);
  });

  it('takes damage from temporary hit points first and heals from 0 clearing death saves', () => {
    const sheet = { ...emptyCharacterSheet(), hitPoints: { max: 10, current: 10, temporary: 3 } };
    expect(takeDamage(sheet, 5).hitPoints).toEqual({ max: 10, current: 8, temporary: 0 });
    const down = { ...sheet, hitPoints: { max: 10, current: 0, temporary: 0 }, deathSaves: { successes: 1, failures: 2 } };
    expect(heal(down, 4)).toMatchObject({ hitPoints: { current: 4 }, deathSaves: { successes: 0, failures: 0 } });
  });

  it('rests, levels and spends slots', () => {
    const sheet = { ...emptyCharacterSheet(), level: 6, hitDiceUsed: 5, hitPoints: { max: 30, current: 4, temporary: 2 } };
    expect(longRest(sheet)).toMatchObject({ hitDiceUsed: 2, hitPoints: { current: 30, temporary: 0 } });
    expect(withLevel(sheet, 3).hitDiceUsed).toBe(3);
    const caster = { ...sheet, spellSlots: { ...sheet.spellSlots, 1: { max: 3, used: 0 } } };
    expect(toggleSlot(caster, 1, 2).spellSlots[1].used).toBe(2);
    expect(toggleSlot(toggleSlot(caster, 1, 2), 1, 2).spellSlots[1].used).toBe(1);
  });
});

describe('loot given to a sheet', () => {
  const draw = { name: 'Potion', description: 'Heals', properties: [] };
  it('adds a line, then counts one more of the same item', () => {
    const once = withGear(emptyCharacterSheet(), lootAsGear(draw));
    expect(once?.inventory).toEqual([{ name: 'Potion', quantity: 1, equipped: false, notes: 'Heals' }]);
    expect(withGear(once!, lootAsGear(draw))?.inventory[0]?.quantity).toBe(2);
  });

  it('prefers an Entries property for the notes', () => {
    expect(lootAsGear({ ...draw, properties: [{ label: 'Entries', value: 'Text' }] }).notes).toBe('Text');
  });
});

describe('note excerpts shown to players', () => {
  it('drops frontmatter and Markdown, and reads one section', () => {
    const text = '---\ntags: x\n---\n# Inn\nThe **Prancing** [[Pony|pony]].\n## Cellar\nDark.';
    const headings = [{ heading: 'Inn', level: 1, line: 3 }, { heading: 'Cellar', level: 2, line: 5 }];
    expect(noteExcerpt(text, headings, undefined)).toBe('Inn\nThe Prancing pony.\nCellar\nDark.');
    expect(noteExcerpt(text, headings, 'Cellar')).toBe('Dark.');
  });
});
