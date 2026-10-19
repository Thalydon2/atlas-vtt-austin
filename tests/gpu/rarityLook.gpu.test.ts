import '../setup/obsidianDom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import css from '../../styles/main.scss?inline';
import { RarityToggles } from '../../src/app/react/components/loot/LootRollBar';
import { ItemRaritiesSection } from '../../src/app/react/components/collection-settings/random-tables/ItemRaritiesSection';
import { NO_RARITY_KEY } from '../../src/app/loot/lootRoller';

const RARITIES = [{ name: 'Common', tone: 'common' as const }, { name: 'Rare', tone: 'rare' as const }];

describe('rarities', () => {
  it('offers None beside the words in the roller, and the words found in the tables in settings', async () => {
    await page.viewport(560, 520);
    const style = document.createElement('style');
    style.textContent = 'body { background: #1e1e1e; color: #ddd; font: 13px sans-serif; --background-modifier-border: #444; --text-muted: #999; --radius-m: 8px; }' + css;
    document.head.append(style);
    const host = document.body.createDiv({ cls: 'atlas-vtt-plugin' });
    host.style.width = '520px';
    const roller = host.createDiv();
    const settings = host.createDiv();
    act(() => createRoot(roller).render(React.createElement(RarityToggles, {
      rarities: RARITIES, rarityCounts: new Map([['common', 4], ['rare', 1], [NO_RARITY_KEY, 3]]), excluded: new Set([NO_RARITY_KEY]), onExcludedChange: () => {},
    })));
    act(() => createRoot(settings).render(React.createElement(ItemRaritiesSection, {
      rarities: RARITIES, own: true, onChange: () => {}, onRevert: () => {}, found: ['Mythic', 'Junk'],
    })));
    const chips = [...roller.querySelectorAll('.atlas-loot-rarity')];
    expect(chips.map((chip) => chip.textContent)).toEqual(['Common4', 'Rare1', 'None3']);
    expect(chips[2]!.getAttribute('aria-pressed')).toBe('false');
    expect([...settings.querySelectorAll('.atlas-rt-found__chip')].map((chip) => chip.textContent)).toEqual(['Mythic', 'Junk']);
    style.remove();
  });
});
