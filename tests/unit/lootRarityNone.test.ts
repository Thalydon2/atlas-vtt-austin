import { describe, expect, it } from 'vitest';
import { countByRarity, NO_RARITY_KEY, rollLoot, unlistedRarities } from '../../src/app/loot/lootRoller';
import type { LootItem } from '../../src/app/loot/lootItem';

const RARITIES = [{ name: 'Common', tone: 'common' as const }, { name: 'Rare', tone: 'rare' as const }];
const item = (id: string, rarity?: string): LootItem => ({ id, name: id, source: ['Items'], properties: [], ...(rarity && { rarity }) });
const ITEMS = [item('rope', 'Common'), item('ring', 'Rare'), item('rock'), item('relic', '**Mythic**')];

describe('items with no listed rarity', () => {
  it('are counted together as None', () => {
    expect(Object.fromEntries(countByRarity(ITEMS, RARITIES))).toEqual({ common: 1, rare: 1, [NO_RARITY_KEY]: 2 });
  });

  it('are left out of rolls while None is switched off, and only they are', () => {
    const drawn = rollLoot(ITEMS, { count: 50, rarity: { rarities: RARITIES, excluded: new Set([NO_RARITY_KEY]) } });
    expect(new Set(drawn.map((draw) => draw.notePath))).toEqual(new Set(['rope', 'ring']));
  });

  it('name the words a GM may add as rarities, once each, without emphasis', () => {
    expect(unlistedRarities([...ITEMS, item('crown', 'mythic'), item('sword', 'rare')], RARITIES)).toEqual(['Mythic']);
  });
});
