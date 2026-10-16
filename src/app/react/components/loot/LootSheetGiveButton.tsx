import React, { useContext } from 'react';
import type { App } from 'obsidian';
import { Gift } from 'lucide-react';
import { Button } from '../../../packages/components/primitives/button';
import { LabelTooltip } from '../../../packages/components/primitives/tooltip';
import { openContextMenuGlobal } from '../../root/ContextMenuContext';
import type { ContextMenuEntry } from '../context-menu/AtlasContextMenu';
import { AtlasUIContext } from '../../root/AtlasUIContext';
import { useMapCollectionId } from '../../hooks/useMapCollectionId';
import { AssetService } from '../../../services/AssetService';
import { giveLootToSheet, type GiveOutcome } from '../../../characterSheet/sheetLoot';
import type { LootDraw } from '../../../loot/lootRoller';
import { runInBackground } from '../../../utils/backgroundTask';
import { showNotice } from '../../../ui/notice';
import { t, type MessageKey } from '../../../i18n';

const OUTCOME_TEXT: Record<GiveOutcome, MessageKey> = {
  given: 'loot.toSheet.done',
  full: 'loot.toSheet.full',
  readOnly: 'loot.toSheet.readOnly',
  missing: 'loot.toSheet.failed',
};

async function give(assets: AssetService, sheetId: string, character: string, draw: LootDraw): Promise<void> {
  const outcome = await giveLootToSheet(assets, sheetId, draw);
  showNotice(t(OUTCOME_TEXT[outcome], { item: draw.name, character }));
}

/** Lists the character sheets of the collection under the button; picking one adds the item to its gear. */
async function openSheetMenu(assets: AssetService, collectionId: string, draw: LootDraw, position: { x: number; y: number }): Promise<void> {
  const sheets = await assets.getAssets(collectionId, 'character');
  const entries: ContextMenuEntry[] = sheets.length === 0
    ? [{ type: 'item', label: t('loot.toSheet.none'), icon: 'user', disabled: true, onClick: () => {} }]
    : sheets.map((sheet) => ({
      type: 'item',
      label: sheet.name,
      icon: 'user',
      onClick: () => runInBackground(give(assets, sheet.id, sheet.name, draw), 'Giving loot to a character sheet', t('loot.toSheet.failed', { item: draw.name })),
    }));
  openContextMenuGlobal(entries, position);
}

function SheetGiveButton({ draw, app }: { draw: LootDraw; app: App }): React.ReactElement | null {
  const collectionId = useMapCollectionId();
  if (!collectionId) return null;
  return (
    <LabelTooltip label={t('loot.toSheet.label')}>
      <Button
        variant="ghost"
        size="icon"
        className="atlas-loot-card__action atlas-loot-card__give"
        aria-label={t('loot.toSheet.label')}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          runInBackground(
            openSheetMenu(AssetService.getInstance(app), collectionId, draw, { x: rect.left, y: rect.bottom + 4 }),
            'Listing character sheets',
            t('loot.toSheet.failed', { item: draw.name }),
          );
        }}
      >
        <Gift />
      </Button>
    </LabelTooltip>
  );
}

/** Adds a rolled item to the gear on one of the collection's character sheets; nothing outside a map's UI. */
export function LootSheetGiveButton({ draw }: { draw: LootDraw }): React.ReactElement | null {
  const app = useContext(AtlasUIContext)?.app;
  return app ? <SheetGiveButton draw={draw} app={app} /> : null;
}
