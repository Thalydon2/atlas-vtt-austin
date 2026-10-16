import type { AssetService, CharacterAsset } from '../services/AssetService';
import { emptyCharacterSheet } from './characterSheetData';
import { t } from '../i18n';

/** Adds an empty character sheet to a collection. */
export async function createCharacterSheet(assetService: AssetService, collection: string): Promise<CharacterAsset> {
  const asset = await assetService.addAsset({
    type: 'character',
    name: t('characterSheet.newName'),
    collection,
    tags: [],
    data: { ...emptyCharacterSheet() },
  });
  if (asset.type !== 'character') throw new Error(`Expected a character record, got ${asset.type}`);
  return asset;
}
