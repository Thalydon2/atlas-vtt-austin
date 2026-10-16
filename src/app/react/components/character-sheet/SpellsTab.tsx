import React, { useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ABILITIES, SPELL_LEVELS, type Spell } from '../../../characterSheet/characterSheetTypes';
import { signed, spellAttackBonus, spellSaveDc, toggleSlot, withSlotMax } from '../../../characterSheet/characterSheetRules';
import { Button } from '../../../packages/components/primitives/button';
import { Select } from '../../../packages/components/primitives/Select';
import { CheckField, NumberField, StatTile, type SheetPanelProps } from './SheetFields';
import { t } from '../../../i18n';

const MAX_SPELLS = 500;
const NO_ABILITY = 'none';
const SPELL_LEVEL_VALUES = ['0', ...SPELL_LEVELS.map(String)];

function SpellcastingSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const labelId = useId();
  const options = [
    { value: NO_ABILITY, label: t('characterSheet.spells.none') },
    ...ABILITIES.map((ability) => ({ value: ability, label: t(`characterSheet.ability.${ability}`) })),
  ];
  const saveDc = spellSaveDc(sheet);
  const attackBonus = spellAttackBonus(sheet);
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-grid">
        <div className="atlas-cs-field">
          <span id={labelId} className="atlas-cs-label">{t('characterSheet.spells.ability')}</span>
          <Select
            value={sheet.spellcastingAbility ?? NO_ABILITY}
            options={options}
            labelledBy={labelId}
            disabled={readOnly}
            onChange={(value) => update((current) => ({ ...current, spellcastingAbility: ABILITIES.find((ability) => ability === value) ?? null }))}
          />
        </div>
      </div>
      {saveDc !== null && attackBonus !== null && (
        <div className="atlas-cs-tiles">
          <StatTile label={t('characterSheet.spells.saveDc')} value={String(saveDc)} />
          <StatTile label={t('characterSheet.spells.attackBonus')} value={signed(attackBonus)} />
        </div>
      )}
    </section>
  );
}

function SpellSlotsSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.spells.slots')}</h4>
      <div className="atlas-cs-slots">
        {SPELL_LEVELS.map((level) => {
          const slot = sheet.spellSlots[level] ?? { max: 0, used: 0 };
          return (
            <div key={level} className="atlas-cs-slot-row">
              <NumberField label={t('characterSheet.spells.slotMax', { level })} hideLabel value={slot.max} min={0} max={99} disabled={readOnly} onCommit={(value) => update((current) => withSlotMax(current, level, value))} />
              <span className="atlas-cs-slot-level">{t('characterSheet.spells.slotLevel', { level })}</span>
              <span className="atlas-cs-pips">
                {Array.from({ length: slot.max }, (_, index) => {
                  const spent = slot.used >= index + 1;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`atlas-cs-pip ${spent ? '' : 'atlas-cs-pip-on'}`}
                      disabled={readOnly}
                      aria-pressed={spent}
                      aria-label={t('characterSheet.spells.slotUsed', {
                        index: index + 1,
                        level,
                        state: t(spent ? 'characterSheet.spells.slotSpent' : 'characterSheet.spells.slotAvailable'),
                      })}
                      onClick={() => update((current) => toggleSlot(current, level, index + 1))}
                    />
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface SpellRowProps {
  spell: Spell;
  readOnly: boolean;
  onChange: (change: Partial<Spell>) => void;
  onRemove: () => void;
}

function SpellRow({ spell, readOnly, onChange, onRemove }: SpellRowProps): React.JSX.Element {
  const nameId = useId();
  const levelId = useId();
  const notesId = useId();
  const levels = SPELL_LEVEL_VALUES.map((value) => ({
    value,
    label: value === '0' ? t('characterSheet.spells.cantrip') : t('characterSheet.spells.slotLevel', { level: value }),
  }));
  return (
    <li className="atlas-cs-spell">
      <label className="atlas-cs-visually-hidden" htmlFor={nameId}>{t('characterSheet.spells.name')}</label>
      <input id={nameId} type="text" className="atlas-cs-input" value={spell.name} disabled={readOnly} onChange={(event) => onChange({ name: event.target.value })} />
      <span id={levelId} className="atlas-cs-visually-hidden">{t('characterSheet.spells.level')}</span>
      <Select value={String(spell.level)} options={levels} labelledBy={levelId} disabled={readOnly} onChange={(value) => onChange({ level: Number(value) })} />
      <CheckField label={t('characterSheet.spells.prepared')} checked={spell.prepared} disabled={readOnly} onChange={(prepared) => onChange({ prepared })} />
      <label className="atlas-cs-visually-hidden" htmlFor={notesId}>{t('characterSheet.spells.notes')}</label>
      <input
        id={notesId}
        type="text"
        className="atlas-cs-input atlas-cs-spell-notes"
        value={spell.notes}
        disabled={readOnly}
        placeholder={t('characterSheet.spells.notes')}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
      <Button variant="ghost" size="icon" disabled={readOnly} onClick={onRemove} aria-label={t('characterSheet.spells.remove')}>
        <Trash2 />
      </Button>
    </li>
  );
}

function SpellListSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const change = (index: number, edit: Partial<Spell>): void =>
    update((current) => ({ ...current, spells: current.spells.map((spell, i) => (i === index ? { ...spell, ...edit } : spell)) }));
  const add = (): void => update((current) => (current.spells.length >= MAX_SPELLS
    ? current
    : { ...current, spells: [...current.spells, { name: '', level: 0, prepared: false, notes: '' }] }));
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-section-head">
        <h4 className="atlas-cs-heading">{t('characterSheet.spells.list')}</h4>
        <Button variant="outline" size="sm" disabled={readOnly || sheet.spells.length >= MAX_SPELLS} onClick={add}>
          <Plus />
          {t('characterSheet.spells.add')}
        </Button>
      </div>
      {sheet.spells.length === 0 ? (
        <p className="atlas-cs-help">{t('characterSheet.spells.empty')}</p>
      ) : (
        <ul className="atlas-cs-list">
          {sheet.spells.map((spell, index) => (
            <SpellRow
              key={index}
              spell={spell}
              readOnly={readOnly}
              onChange={(edit) => change(index, edit)}
              onRemove={() => update((current) => ({ ...current, spells: current.spells.filter((_, i) => i !== index) }))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function SpellsTab(props: SheetPanelProps): React.JSX.Element {
  return (
    <>
      <SpellcastingSection {...props} />
      <SpellSlotsSection {...props} />
      <SpellListSection {...props} />
    </>
  );
}
