import '../setup/obsidianDom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import css from '../../styles/main.scss?inline';
import { CharacterSheetWindow } from '../../src/app/react/components/character-sheet/CharacterSheetWindow';
import { emptyCharacterSheet } from '../../src/app/characterSheet/characterSheetData';
import type { AssetService } from '../../src/app/services/AssetService';
import { createInMemoryApp } from '../mocks/inMemoryVault';

const THEME = `
  body { margin: 0; background: #111; font: 13px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; --background-primary: #1e1e1e; --background-secondary: #262626; --background-modifier-border: #363636;
    --background-modifier-form-field: #2a2a2a; --divider-color: #363636; --mono-100: #fff; --mono-0: #000;
    --text-normal: #dadada; --text-muted: #b3b3b3; --text-faint: #888; --interactive-accent: #7f6df2; --radius-s: 4px; --radius-m: 8px; --radius-l: 12px; --radius-xl: 16px;
    --font-ui-smaller: 12px; --font-ui-small: 13px; --font-ui-medium: 15px; --font-ui-large: 20px; --input-height: 30px; --line-height-tight: 1.3; --font-semibold: 600; }
  button, input { font: inherit; }
`;

describe('the character sheet', () => {
  it('opens on its core tab with every ability and skill, and switches tabs', async () => {
    await page.viewport(1000, 900);
    const style = document.createElement('style');
    style.textContent = THEME + css;
    document.head.append(style);
    const { app } = createInMemoryApp({ files: {} });
    const sheet = { ...emptyCharacterSheet(), race: 'Elf', className: 'Wizard', level: 5, abilities: { str: 8, dex: 14, con: 12, int: 18, wis: 10, cha: 11 } };
    const assets = {
      getAssetById: async () => ({ id: 's', type: 'character', name: 'Raven', collection: 'c', tags: [], createdAt: 0, modifiedAt: 0, data: sheet }),
      updateAsset: async () => undefined,
    } as unknown as AssetService;
    const host = document.body.createDiv({ cls: 'atlas-vtt-plugin' });
    act(() => createRoot(host).render(React.createElement(CharacterSheetWindow, { assetId: 's', assetService: assets, app, onClose: () => {} })));
    await expect.poll(() => document.querySelectorAll('.atlas-cs-ability').length).toBe(6);
    expect(document.querySelectorAll('.atlas-cs-skill').length).toBe(18);
    for (const label of ['Hit points', 'Spells', 'Inventory & notes']) {
      act(() => [...document.querySelectorAll<HTMLButtonElement>('.atlas-cs-tab')].find((tab) => tab.textContent === label)!.click());
      expect(document.querySelector('.atlas-cs-tab.atlas-active')?.textContent).toBe(label);
    }
    // The sheet scrolls inside its window, which stays within the screen.
    expect(document.querySelector('.atlas-cs-window')!.getBoundingClientRect().bottom).toBeLessThanOrEqual(900);
    style.remove();
  });
});
