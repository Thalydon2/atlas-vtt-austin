import '../setup/obsidianDom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { TFile, type App } from 'obsidian';
import css from '../../styles/main.scss?inline';
import { LootItemContent } from '../../src/app/react/components/loot/LootItemContent';
import { setLootImageApp } from '../../src/app/loot/lootImage';
import type { LootDraw } from '../../src/app/loot/lootRoller';

const PICTURE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#a33"/><circle cx="100" cy="60" r="40" fill="#fc6"/></svg>')}`;

function appWithPicture(): App {
  const file = Object.assign(new TFile(), { path: 'Art/Sword.png', extension: 'png', name: 'Sword.png' });
  return {
    vault: { getAbstractFileByPath: () => null, getResourcePath: () => PICTURE },
    metadataCache: { getFirstLinkpathDest: () => file, getFileCache: () => null },
  } as unknown as App;
}

const DRAW: LootDraw = {
  id: 'd', notePath: 'Items/Sword.md', name: 'Flame Tongue', source: ['Items'], rarity: 'rare', type: 'Weapon',
  price: '5,000 gp', image: '[[Sword.png]]', description: 'A sword wreathed in fire.', properties: [{ label: 'Damage', value: '2d6 fire' }],
};

describe('a loot card with a picture', () => {
  afterEach(() => setLootImageApp(null));

  it('shows a thumbnail beside the name that a click enlarges across the card', async () => {
    await page.viewport(500, 500);
    const style = document.createElement('style');
    style.textContent = 'body { background: #1e1e1e; color: #ddd; font: 13px sans-serif; --background-secondary: #262626; --background-primary: #1e1e1e; --background-modifier-border: #444; --radius-m: 8px; }' + css;
    document.head.append(style);
    setLootImageApp(appWithPicture());
    const host = document.body.createDiv({ cls: 'atlas-vtt-plugin' });
    host.style.width = '360px';
    const card = host.createEl('li', { cls: 'atlas-loot-card' });
    act(() => createRoot(card).render(React.createElement(LootItemContent, { draw: DRAW })));
    const button = await expect.poll(() => card.querySelector<HTMLButtonElement>('.atlas-loot-card__image')).toBeTruthy().then(() => card.querySelector<HTMLButtonElement>('.atlas-loot-card__image')!);
    const name = card.querySelector('.atlas-loot-card__name')!.getBoundingClientRect();
    const thumb = button.getBoundingClientRect();
    expect(Math.round(thumb.width)).toBe(44);
    expect(thumb.right).toBeLessThanOrEqual(name.left);
    act(() => button.click());
    const big = button.getBoundingClientRect();
    expect(big.width).toBeGreaterThan(300);
    expect(big.top).toBeGreaterThan(name.bottom - 1);
    style.remove();
  });
});
