import type { AssetService } from '../services/AssetService';
import type { LootDraw } from '../loot/lootRoller';
import { isNewerSheet, readCharacterSheet } from './characterSheetData';
import { SHEET_LIMITS, type CharacterSheet, type InventoryItem } from './characterSheetTypes';

/** A property named like this holds an item's text (Daggerheart bases call it "Entries"). */
const ENTRIES = /^entries$/i;
const MAX_QUANTITY = 99999;

/** A rolled item as a line of gear: its name, and its entries or description as notes. */
export function lootAsGear(draw: Pick<LootDraw, 'name' | 'description' | 'properties'>): InventoryItem {
  const entries = draw.properties.find((property) => ENTRIES.test(property.label.trim()))?.value;
  return {
    name: draw.name.slice(0, SHEET_LIMITS.shortText),
    quantity: 1,
    equipped: false,
    notes: (entries ?? draw.description ?? '').slice(0, SHEET_LIMITS.longText),
  };
}

/** The sheet with the item added: one more of a line with the same name and notes, else a new line; null when the gear is full. */
export function withGear(sheet: CharacterSheet, item: InventoryItem): CharacterSheet | null {
  const same = sheet.inventory.findIndex((entry) => entry.name === item.name && entry.notes === item.notes);
  if (same >= 0) {
    return {
      ...sheet,
      inventory: sheet.inventory.map((entry, index) => (index === same ? { ...entry, quantity: Math.min(MAX_QUANTITY, entry.quantity + item.quantity) } : entry)),
    };
  }
  if (sheet.inventory.length >= SHEET_LIMITS.entries) return null;
  return { ...sheet, inventory: [...sheet.inventory, item] };
}

export type GiveOutcome = 'given' | 'full' | 'readOnly' | 'missing';

/** Adds a rolled item to the gear of the character sheet `sheetId`. */
export async function giveLootToSheet(assetService: AssetService, sheetId: string, draw: LootDraw): Promise<GiveOutcome> {
  const asset = await assetService.getAssetById(sheetId);
  if (asset?.type !== 'character') return 'missing';
  if (isNewerSheet(asset.data)) return 'readOnly';
  const sheet = withGear(readCharacterSheet(asset.data), lootAsGear(draw));
  if (!sheet) return 'full';
  await assetService.updateAsset(sheetId, { data: { ...sheet } });
  return 'given';
}
