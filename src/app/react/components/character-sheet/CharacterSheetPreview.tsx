import React, { useMemo } from 'react';
import type { App } from 'obsidian';
import { AssetService } from '../../../services/AssetService';
import { resourceUrl } from '../../../packages/components/asset-manager/utils/assetFormatters';
import { sheetSummary } from '../../../characterSheet/characterSheetData';
import { ABILITIES, ARMOR_TRAINING, SKILLS, SPELL_LEVELS, WEAPON_PROFICIENCIES, type CharacterSheet } from '../../../characterSheet/characterSheetTypes';
import {
  abilityModifier,
  initiative,
  passivePerception,
  proficiencyBonus,
  savingThrowBonus,
  signed,
  skillBonus,
  spellAttackBonus,
  spellSaveDc,
} from '../../../characterSheet/characterSheetRules';
import { StatTile } from './SheetFields';
import { useCharacterSheet, type SheetUpdate } from './useCharacterSheet';
import { t } from '../../../i18n';
import './character-sheet.scss';

function PreviewAbilities({ sheet }: { sheet: CharacterSheet }): React.JSX.Element {
  return (
    <div className="atlas-cs-preview-abilities">
      {ABILITIES.map((ability) => (
        <div key={ability} className="atlas-cs-preview-ability">
          <span className="atlas-cs-ability-name">{t(`characterSheet.abilityShort.${ability}`)}</span>
          <span className="atlas-cs-ability-modifier">{signed(abilityModifier(sheet.abilities[ability]))}</span>
          <span className="atlas-cs-ability-name">
            {sheet.abilities[ability]} · {sheet.saveProficiencies[ability] ? '●' : '○'} {signed(savingThrowBonus(sheet, ability))}
          </span>
        </div>
      ))}
    </div>
  );
}

function PreviewSpellcasting({ sheet }: { sheet: CharacterSheet }): React.JSX.Element | null {
  const saveDc = spellSaveDc(sheet);
  const attackBonus = spellAttackBonus(sheet);
  if (saveDc === null || attackBonus === null) return null;
  const levels = SPELL_LEVELS.filter((level) => (sheet.spellSlots[level]?.max ?? 0) > 0);
  return (
    <section className="atlas-cs-preview-section">
      <h5 className="atlas-cs-preview-heading">{t('characterSheet.preview.spellcasting')}</h5>
      <p className="atlas-cs-preview-line">
        {t('characterSheet.spells.saveDc')} {saveDc} · {t('characterSheet.spells.attackBonus')} {signed(attackBonus)}
      </p>
      {levels.length > 0 && (
        <p className="atlas-cs-preview-line">
          {levels.map((level) => {
            const slot = sheet.spellSlots[level] ?? { max: 0, used: 0 };
            return t('characterSheet.preview.slotsLeft', { level, left: slot.max - slot.used, max: slot.max });
          }).join('  ')}
        </p>
      )}
    </section>
  );
}

function PreviewTraining({ sheet }: { sheet: CharacterSheet }): React.JSX.Element | null {
  const { armor, weapons, otherWeapons, tools } = sheet.proficiencies;
  const armorNames = ARMOR_TRAINING.filter((kind) => armor[kind]).map((kind) => t(`characterSheet.training.armor.${kind}`));
  const weaponNames = [
    ...WEAPON_PROFICIENCIES.filter((kind) => weapons[kind]).map((kind) => t(`characterSheet.training.weapons.${kind}`)),
    ...(otherWeapons.trim() ? [otherWeapons.trim()] : []),
  ];
  const lines = [
    armorNames.length > 0 && `${t('characterSheet.training.armor')}: ${armorNames.join(', ')}`,
    weaponNames.length > 0 && `${t('characterSheet.training.weapons')}: ${weaponNames.join(', ')}`,
    tools.trim() && `${t('characterSheet.preview.tools')}: ${tools.trim()}`,
  ].filter((line): line is string => typeof line === 'string');
  if (lines.length === 0) return null;
  return (
    <section className="atlas-cs-preview-section">
      <h5 className="atlas-cs-preview-heading">{t('characterSheet.preview.training')}</h5>
      {lines.map((line) => <p key={line} className="atlas-cs-preview-line">{line}</p>)}
    </section>
  );
}

interface PreviewBodyProps {
  app: App;
  name: string;
  sheet: CharacterSheet;
  /** The hovered token's hit points, which follow the scene; the sheet's own without them. */
  hitPoints: { current: number; max: number } | undefined;
  tokenImagePath: string | undefined;
  /** Absent for a sheet that cannot be written. */
  onChange: SheetUpdate | undefined;
}

function PreviewBody({ app, name, sheet, hitPoints, tokenImagePath, onChange }: PreviewBodyProps): React.JSX.Element {
  const shownHitPoints = hitPoints ?? sheet.hitPoints;
  const portrait = resourceUrl(app, sheet.portraitPath) || resourceUrl(app, tokenImagePath);
  const skills = SKILLS.filter((skill) => sheet.skillProficiencies[skill.id] > 0);
  return (
    <>
      <header className="atlas-cs-preview-header">
        {portrait && <img className="atlas-cs-preview-portrait" src={portrait} alt="" draggable={false} />}
        <div>
          <h4 className="atlas-cs-preview-name">{name}</h4>
          <p className="atlas-cs-preview-line">{sheetSummary(sheet)}</p>
        </div>
      </header>
      <div className="atlas-cs-tiles">
        <StatTile label={t('characterSheet.field.armorClass')} value={String(sheet.armorClass)} />
        <StatTile label={t('characterSheet.preview.hp')} value={`${shownHitPoints.current}/${shownHitPoints.max}`} />
        <StatTile label={t('characterSheet.field.speed')} value={String(sheet.speed)} />
      </div>
      <label className="atlas-cs-check atlas-cs-preview-inspiration">
        <input
          type="checkbox"
          checked={sheet.inspiration}
          disabled={!onChange}
          onChange={(event) => onChange?.((current) => ({ ...current, inspiration: event.target.checked }))}
        />
        <span>{t('characterSheet.hp.inspiration')}</span>
      </label>
      {sheet.hitPoints.temporary > 0 && (
        <p className="atlas-cs-preview-line">{t('characterSheet.preview.tempHp', { temporary: sheet.hitPoints.temporary })}</p>
      )}
      <p className="atlas-cs-preview-line">
        {t('characterSheet.derived.initiative')} {signed(initiative(sheet))} · {t('characterSheet.derived.proficiencyBonus')} {signed(proficiencyBonus(sheet.level))} · {t('characterSheet.derived.passivePerception')} {passivePerception(sheet)}
      </p>
      <PreviewAbilities sheet={sheet} />
      {skills.length > 0 && (
        <section className="atlas-cs-preview-section">
          <h5 className="atlas-cs-preview-heading">{t('characterSheet.preview.skills')}</h5>
          <p className="atlas-cs-preview-line">
            {skills.map((skill) => `${t(`characterSheet.skill.${skill.id}`)} ${signed(skillBonus(sheet, skill.id))}`).join(', ')}
          </p>
        </section>
      )}
      {sheet.attacks.length > 0 && (
        <section className="atlas-cs-preview-section">
          <h5 className="atlas-cs-preview-heading">{t('characterSheet.preview.attacks')}</h5>
          {sheet.attacks.map((attack, index) => (
            <p key={index} className="atlas-cs-preview-line">
              <strong>{attack.name || '—'}</strong>
              {[attack.bonus, [attack.damage, attack.damageType].filter(Boolean).join(' ')].filter(Boolean).map((part) => ` · ${part}`).join('')}
            </p>
          ))}
        </section>
      )}
      <PreviewSpellcasting sheet={sheet} />
      <PreviewTraining sheet={sheet} />
    </>
  );
}

export interface CharacterSheetPreviewProps {
  app: App;
  sheetId: string;
  hitPoints: { current: number; max: number } | undefined;
  tokenImagePath: string | undefined;
}

/** A character sheet at a glance, for a hovered token placed from it. Inspiration can be ticked here. */
export function CharacterSheetPreview({ app, sheetId, hitPoints, tokenImagePath }: CharacterSheetPreviewProps): React.JSX.Element {
  const assetService = useMemo(() => AssetService.getInstance(app), [app]);
  const { state, update } = useCharacterSheet(assetService, sheetId);
  return (
    <div className="atlas-cs-preview">
      {state.status === 'loading' && <p className="atlas-cs-preview-line">{t('characterSheet.preview.loading')}</p>}
      {state.status === 'missing' && <p className="atlas-cs-preview-line">{t('characterSheet.preview.missing')}</p>}
      {state.status === 'ready' && (
        <PreviewBody
          app={app}
          name={state.name}
          sheet={state.sheet}
          hitPoints={hitPoints}
          tokenImagePath={tokenImagePath}
          onChange={state.readOnly ? undefined : update}
        />
      )}
    </div>
  );
}
