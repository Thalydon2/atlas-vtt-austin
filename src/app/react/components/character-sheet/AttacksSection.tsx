import React, { useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ATTACK_KINDS, SHEET_LIMITS, type Attack } from '../../../characterSheet/characterSheetTypes';
import { Button } from '../../../packages/components/primitives/button';
import { Select } from '../../../packages/components/primitives/Select';
import type { SheetPanelProps } from './SheetFields';
import { t } from '../../../i18n';

type AttackText = 'name' | 'bonus' | 'damage' | 'damageType' | 'notes';

interface AttackRowProps {
  attack: Attack;
  readOnly: boolean;
  onChange: (change: Partial<Attack>) => void;
  onRemove: () => void;
}

function AttackRow({ attack, readOnly, onChange, onRemove }: AttackRowProps): React.JSX.Element {
  const ids = { name: useId(), kind: useId(), bonus: useId(), damage: useId(), damageType: useId(), notes: useId() };
  const kinds = ATTACK_KINDS.map((kind) => ({ value: kind, label: t(`characterSheet.attacks.kind.${kind}`) }));
  const field = (key: AttackText, label: string, placeholder: string): React.JSX.Element => (
    <>
      <label className="atlas-cs-visually-hidden" htmlFor={ids[key]}>{label}</label>
      <input
        id={ids[key]}
        type="text"
        className="atlas-cs-input"
        value={attack[key]}
        disabled={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange({ [key]: event.target.value })}
      />
    </>
  );
  return (
    <li className="atlas-cs-attack">
      {field('name', t('characterSheet.attacks.name'), t('characterSheet.attacks.name'))}
      <span id={ids.kind} className="atlas-cs-visually-hidden">{t('characterSheet.attacks.kind')}</span>
      <Select
        value={attack.kind}
        options={kinds}
        labelledBy={ids.kind}
        disabled={readOnly}
        onChange={(value) => onChange({ kind: ATTACK_KINDS.find((kind) => kind === value) ?? 'weapon' })}
      />
      {field('bonus', t('characterSheet.attacks.bonus'), t('characterSheet.attacks.bonusPlaceholder'))}
      {field('damage', t('characterSheet.attacks.damage'), t('characterSheet.attacks.damage'))}
      {field('damageType', t('characterSheet.attacks.damageType'), t('characterSheet.attacks.damageType'))}
      <Button variant="ghost" size="icon" disabled={readOnly} onClick={onRemove} aria-label={t('characterSheet.attacks.remove')}>
        <Trash2 />
      </Button>
      <div className="atlas-cs-attack-notes">
        {field('notes', t('characterSheet.attacks.notes'), t('characterSheet.attacks.notes'))}
      </div>
    </li>
  );
}

const NEW_ATTACK: Attack = { name: '', kind: 'weapon', bonus: '', damage: '', damageType: '', notes: '' };

/** Weapons and damage cantrips, with what they hit for. */
export function AttacksSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const full = sheet.attacks.length >= SHEET_LIMITS.entries;
  const change = (index: number, edit: Partial<Attack>): void =>
    update((current) => ({ ...current, attacks: current.attacks.map((attack, i) => (i === index ? { ...attack, ...edit } : attack)) }));
  const add = (): void => update((current) => (current.attacks.length >= SHEET_LIMITS.entries
    ? current
    : { ...current, attacks: [...current.attacks, { ...NEW_ATTACK }] }));
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-section-head">
        <h4 className="atlas-cs-heading">{t('characterSheet.attacks.title')}</h4>
        <Button variant="outline" size="sm" disabled={readOnly || full} onClick={add}>
          <Plus />
          {t('characterSheet.attacks.add')}
        </Button>
      </div>
      {sheet.attacks.length === 0 ? (
        <p className="atlas-cs-help">{t('characterSheet.attacks.empty')}</p>
      ) : (
        <ul className="atlas-cs-list">
          {sheet.attacks.map((attack, index) => (
            <AttackRow
              key={index}
              attack={attack}
              readOnly={readOnly}
              onChange={(edit) => change(index, edit)}
              onRemove={() => update((current) => ({ ...current, attacks: current.attacks.filter((_, i) => i !== index) }))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
