import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { App } from 'obsidian';
import { motion } from 'framer-motion';
import type { AssetService } from '../../../services/AssetService';
import { CloseButton } from '../../../packages/components/primitives/CloseButton';
import { dialogOverlayMotion, useDialogWindowVariants } from '../../../packages/components/primitives/dialogMotion';
import { useCharacterSheet } from './useCharacterSheet';
import { CharacterPortrait } from './CharacterPortrait';
import { CoreTab } from './CoreTab';
import { HitPointsTab } from './HitPointsTab';
import { SpellsTab } from './SpellsTab';
import { InventoryTab } from './InventoryTab';
import type { SheetPanelProps } from './SheetFields';
import { t, type MessageKey } from '../../../i18n';
import './character-sheet.scss';

type SheetTab = 'core' | 'hitPoints' | 'spells' | 'inventory';

const TABS: readonly { id: SheetTab; label: MessageKey; Panel: (props: SheetPanelProps) => React.JSX.Element }[] = [
  { id: 'core', label: 'characterSheet.tab.core', Panel: CoreTab },
  { id: 'hitPoints', label: 'characterSheet.tab.hitPoints', Panel: HitPointsTab },
  { id: 'spells', label: 'characterSheet.tab.spells', Panel: SpellsTab },
  { id: 'inventory', label: 'characterSheet.tab.inventory', Panel: InventoryTab },
];

interface CharacterSheetWindowProps {
  assetId: string;
  assetService: AssetService | null | undefined;
  app: App | null | undefined;
  /** Called once pending edits are written. */
  onClose: () => void;
}

/** The editor of a character sheet, over the asset manager; edits save as they are made. */
export function CharacterSheetWindow({ assetId, assetService, app, onClose }: CharacterSheetWindowProps): React.JSX.Element {
  const editor = useCharacterSheet(assetService, assetId);
  const [tab, setTab] = useState<SheetTab>('core');
  const windowVariants = useDialogWindowVariants();
  const windowRef = useRef<HTMLDivElement>(null);
  const tabsId = useId();
  const nameId = useId();
  const close = useCallback((): void => { void editor.flush().then(onClose); }, [editor, onClose]);

  useEffect(() => { windowRef.current?.focus(); }, []);

  const { state } = editor;
  const Panel = TABS.find((entry) => entry.id === tab)?.Panel ?? CoreTab;

  return (
    <motion.div
      {...dialogOverlayMotion}
      className="atlas-vtt-root atlas-cs-modal"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) close();
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <motion.div
        ref={windowRef}
        className="atlas-cs-window"
        role="dialog"
        aria-modal="true"
        aria-label={t('characterSheet.title')}
        tabIndex={-1}
        variants={windowVariants}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape' && !event.defaultPrevented) close();
        }}
      >
        <div className="atlas-cs-header">
          {state.status === 'ready' && (
            <CharacterPortrait
              app={app}
              path={state.sheet.portraitPath}
              characterName={state.name}
              disabled={state.readOnly}
              onChange={(portraitPath) => editor.update((sheet) => ({ ...sheet, portraitPath }))}
            />
          )}
          <label className="atlas-cs-visually-hidden" htmlFor={nameId}>{t('characterSheet.name')}</label>
          <input
            id={nameId}
            type="text"
            className="atlas-cs-name"
            value={state.status === 'ready' ? state.name : ''}
            disabled={state.status !== 'ready' || state.readOnly}
            placeholder={t('characterSheet.newName')}
            onChange={(event) => editor.setName(event.target.value)}
          />
          <CloseButton onClick={close} />
        </div>
        {state.status === 'loading' && <p className="atlas-cs-message">{t('characterSheet.loading')}</p>}
        {state.status === 'missing' && <p className="atlas-cs-message">{t('characterSheet.missing')}</p>}
        {state.status === 'ready' && (
          <>
            {state.readOnly && <p className="atlas-cs-banner" role="status">{t('characterSheet.newerFormat')}</p>}
            <div className="atlas-cs-tabs" role="tablist" aria-label={t('characterSheet.tabs')} id={tabsId}>
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${entry.id}`}
                  aria-selected={tab === entry.id}
                  aria-controls={`${tabsId}-panel`}
                  className={`atlas-cs-tab ${tab === entry.id ? 'atlas-active' : ''}`}
                  onClick={() => setTab(entry.id)}
                >
                  {t(entry.label)}
                </button>
              ))}
            </div>
            <div className="atlas-cs-body" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
              <Panel sheet={state.sheet} update={editor.update} readOnly={state.readOnly} />
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
