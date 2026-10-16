import React, { useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  ARMOR_TRAINING,
  CURRENCIES,
  SHEET_LIMITS,
  WEAPON_PROFICIENCIES,
  type InventoryItem,
} from '../../../characterSheet/characterSheetTypes';
import { Button } from '../../../packages/components/primitives/button';
import { AttacksSection } from './AttacksSection';
import { CheckField, NumberField, TextField, type SheetPanelProps } from './SheetFields';
import { t } from '../../../i18n';

const NEW_ITEM: InventoryItem = { name: '', quantity: 1, equipped: false, notes: '' };

interface ItemRowProps {
  item: InventoryItem;
  readOnly: boolean;
  onChange: (change: Partial<InventoryItem>) => void;
  onRemove: () => void;
}

function ItemRow({ item, readOnly, onChange, onRemove }: ItemRowProps): React.JSX.Element {
  const nameId = useId();
  const descriptionId = useId();
  return (
    <li className="atlas-cs-item">
      <label className="atlas-cs-visually-hidden" htmlFor={nameId}>{t('characterSheet.inventory.name')}</label>
      <input id={nameId} type="text" className="atlas-cs-input" value={item.name} disabled={readOnly} onChange={(event) => onChange({ name: event.target.value })} />
      <NumberField label={t('characterSheet.inventory.quantity')} hideLabel value={item.quantity} min={0} max={99999} disabled={readOnly} onCommit={(quantity) => onChange({ quantity })} />
      <CheckField label={t('characterSheet.inventory.equipped')} checked={item.equipped} disabled={readOnly} onChange={(equipped) => onChange({ equipped })} />
      <Button variant="ghost" size="icon" disabled={readOnly} onClick={onRemove} aria-label={t('characterSheet.inventory.remove')}>
        <Trash2 />
      </Button>
      <label className="atlas-cs-visually-hidden" htmlFor={descriptionId}>{t('characterSheet.inventory.description')}</label>
      <textarea
        id={descriptionId}
        className="atlas-cs-input atlas-cs-item__description"
        rows={1}
        value={item.notes}
        placeholder={t('characterSheet.inventory.description')}
        disabled={readOnly}
        maxLength={SHEET_LIMITS.longText}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
    </li>
  );
}

function GearSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const full = sheet.inventory.length >= SHEET_LIMITS.entries;
  const change = (index: number, edit: Partial<InventoryItem>): void =>
    update((current) => ({ ...current, inventory: current.inventory.map((item, i) => (i === index ? { ...item, ...edit } : item)) }));
  const add = (): void => update((current) => (current.inventory.length >= SHEET_LIMITS.entries
    ? current
    : { ...current, inventory: [...current.inventory, { ...NEW_ITEM }] }));
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-section-head">
        <h4 className="atlas-cs-heading">{t('characterSheet.inventory.items')}</h4>
        <Button variant="outline" size="sm" disabled={readOnly || full} onClick={add}>
          <Plus />
          {t('characterSheet.inventory.add')}
        </Button>
      </div>
      {sheet.inventory.length === 0 ? (
        <p className="atlas-cs-help">{t('characterSheet.inventory.empty')}</p>
      ) : (
        <ul className="atlas-cs-list">
          {sheet.inventory.map((item, index) => (
            <ItemRow
              key={index}
              item={item}
              readOnly={readOnly}
              onChange={(edit) => change(index, edit)}
              onRemove={() => update((current) => ({ ...current, inventory: current.inventory.filter((_, i) => i !== index) }))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TrainingSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const { proficiencies } = sheet;
  const setProficiencies = (change: Partial<typeof proficiencies>): void =>
    update((current) => ({ ...current, proficiencies: { ...current.proficiencies, ...change } }));
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.training.title')}</h4>
      <div className="atlas-cs-field">
        <span className="atlas-cs-label">{t('characterSheet.training.armor')}</span>
        <div className="atlas-cs-checks">
          {ARMOR_TRAINING.map((kind) => (
            <CheckField
              key={kind}
              label={t(`characterSheet.training.armor.${kind}`)}
              checked={proficiencies.armor[kind]}
              disabled={readOnly}
              onChange={(checked) => update((current) => ({
                ...current,
                proficiencies: { ...current.proficiencies, armor: { ...current.proficiencies.armor, [kind]: checked } },
              }))}
            />
          ))}
        </div>
      </div>
      <div className="atlas-cs-field">
        <span className="atlas-cs-label">{t('characterSheet.training.weapons')}</span>
        <div className="atlas-cs-checks">
          {WEAPON_PROFICIENCIES.map((kind) => (
            <CheckField
              key={kind}
              label={t(`characterSheet.training.weapons.${kind}`)}
              checked={proficiencies.weapons[kind]}
              disabled={readOnly}
              onChange={(checked) => update((current) => ({
                ...current,
                proficiencies: { ...current.proficiencies, weapons: { ...current.proficiencies.weapons, [kind]: checked } },
              }))}
            />
          ))}
        </div>
      </div>
      <TextField label={t('characterSheet.training.otherWeapons')} value={proficiencies.otherWeapons} disabled={readOnly} onChange={(value) => setProficiencies({ otherWeapons: value.slice(0, SHEET_LIMITS.longText) })} />
      <TextField multiline label={t('characterSheet.training.tools')} value={proficiencies.tools} disabled={readOnly} onChange={(value) => setProficiencies({ tools: value.slice(0, SHEET_LIMITS.longText) })} />
    </section>
  );
}

function CurrencySection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.inventory.currency')}</h4>
      <div className="atlas-cs-currency">
        {CURRENCIES.map((coin) => (
          <NumberField
            key={coin}
            label={t(`characterSheet.currency.${coin}`)}
            value={sheet.currency[coin]}
            min={0}
            max={SHEET_LIMITS.maxCurrency}
            disabled={readOnly}
            onCommit={(value) => update((current) => ({ ...current, currency: { ...current.currency, [coin]: value } }))}
          />
        ))}
      </div>
    </section>
  );
}

export function InventoryTab(props: SheetPanelProps): React.JSX.Element {
  const { sheet, update, readOnly } = props;
  return (
    <>
      <AttacksSection {...props} />
      <GearSection {...props} />
      <TrainingSection {...props} />
      <CurrencySection {...props} />
      <section className="atlas-cs-section">
        <TextField multiline label={t('characterSheet.inventory.features')} value={sheet.features} disabled={readOnly} onChange={(value) => update((current) => ({ ...current, features: value.slice(0, SHEET_LIMITS.longText) }))} />
        <TextField multiline label={t('characterSheet.inventory.notes')} value={sheet.notes} disabled={readOnly} onChange={(value) => update((current) => ({ ...current, notes: value.slice(0, SHEET_LIMITS.longText) }))} />
      </section>
    </>
  );
}
