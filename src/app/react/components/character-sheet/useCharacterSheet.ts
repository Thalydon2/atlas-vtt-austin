import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssetService } from '../../../services/AssetService';
import { isNewerSheet, readCharacterSheet } from '../../../characterSheet/characterSheetData';
import type { CharacterSheet } from '../../../characterSheet/characterSheetTypes';
import { showAtlasToast } from '../AtlasToast';
import { t } from '../../../i18n';

/** Edits are written this long after the last one. */
const SAVE_DELAY_MS = 400;
const MAX_NAME_LENGTH = 200;

interface LoadedSheet {
  name: string;
  sheet: CharacterSheet;
  /** Written by a newer Atlas: shown, never written. */
  readOnly: boolean;
}

export type CharacterSheetState = { status: 'loading' } | { status: 'missing' } | ({ status: 'ready' } & LoadedSheet);

export type SheetUpdate = (change: (sheet: CharacterSheet) => CharacterSheet) => void;

export interface CharacterSheetEditor {
  state: CharacterSheetState;
  setName: (name: string) => void;
  update: SheetUpdate;
  /** Writes a pending edit at once; resolves when every write so far has finished. */
  flush: () => Promise<void>;
}

/**
 * Loads a character asset's sheet and writes edits back, debounced, one write at a
 * time and in order. A pending edit is written when the editor unmounts.
 */
export function useCharacterSheet(assetService: AssetService | null | undefined, assetId: string): CharacterSheetEditor {
  const [state, setState] = useState<CharacterSheetState>({ status: 'loading' });
  const current = useRef<LoadedSheet | null>(null);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      const asset = await assetService?.getAssetById(assetId);
      if (cancelled) return;
      if (asset?.type !== 'character') {
        setState({ status: 'missing' });
        return;
      }
      const loaded = { name: asset.name, sheet: readCharacterSheet(asset.data), readOnly: isNewerSheet(asset.data) };
      current.current = loaded;
      setState({ status: 'ready', ...loaded });
    })();
    return () => { cancelled = true; };
  }, [assetService, assetId]);

  const flush = useCallback((): Promise<void> => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const loaded = current.current;
    if (!assetService || !loaded || loaded.readOnly || !dirty.current) return writes.current;
    dirty.current = false;
    const { name, sheet } = loaded;
    writes.current = writes.current
      .then(() => assetService.updateAsset(assetId, { name, data: { ...sheet } }))
      .then(() => undefined)
      .catch((error: unknown) => {
        dirty.current = true;
        showAtlasToast(t('characterSheet.saveFailed', { error: error instanceof Error ? error.message : String(error) }));
      });
    return writes.current;
  }, [assetService, assetId]);

  const change = useCallback((next: (loaded: LoadedSheet) => LoadedSheet): void => {
    const loaded = current.current;
    if (!loaded || loaded.readOnly) return;
    const changed = next(loaded);
    current.current = changed;
    dirty.current = true;
    setState({ status: 'ready', ...changed });
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void flush(); }, SAVE_DELAY_MS);
  }, [flush]);

  const setName = useCallback((name: string): void => {
    change((loaded) => ({ ...loaded, name: name.slice(0, MAX_NAME_LENGTH) }));
  }, [change]);

  const update = useCallback<SheetUpdate>((edit) => {
    change((loaded) => ({ ...loaded, sheet: edit(loaded.sheet) }));
  }, [change]);

  useEffect(() => () => { void flush(); }, [flush]);

  return { state, setName, update, flush };
}
