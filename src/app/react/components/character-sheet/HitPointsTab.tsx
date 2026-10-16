import React, { useId, useState } from 'react';
import { HIT_DICE } from '../../../characterSheet/characterSheetTypes';
import {
  heal,
  hitDiceRemaining,
  longRest,
  pipCount,
  takeDamage,
  withCurrentHitPoints,
  withDeathSaves,
  withHitDiceUsed,
  withMaxHitPoints,
} from '../../../characterSheet/characterSheetRules';
import { Button } from '../../../packages/components/primitives/button';
import { Select } from '../../../packages/components/primitives/Select';
import { CheckField, NumberField, type SheetPanelProps } from './SheetFields';
import { t } from '../../../i18n';

const HIT_DIE_OPTIONS = HIT_DICE.map((die) => ({ value: String(die), label: `d${die}` }));

function HitPointsSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const [amount, setAmount] = useState(0);
  const { hitPoints } = sheet;
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.hp.title')}</h4>
      <div className="atlas-cs-grid">
        <NumberField label={t('characterSheet.hp.current')} value={hitPoints.current} min={0} max={hitPoints.max} disabled={readOnly} onCommit={(value) => update((current) => withCurrentHitPoints(current, value))} />
        <NumberField label={t('characterSheet.hp.max')} value={hitPoints.max} min={0} max={9999} disabled={readOnly} onCommit={(value) => update((current) => withMaxHitPoints(current, value))} />
        <NumberField
          label={t('characterSheet.hp.temporary')}
          value={hitPoints.temporary}
          min={0}
          max={9999}
          disabled={readOnly}
          onCommit={(value) => update((current) => ({ ...current, hitPoints: { ...current.hitPoints, temporary: value } }))}
        />
      </div>
      <div className="atlas-cs-row">
        <NumberField label={t('characterSheet.hp.amount')} value={amount} min={0} max={9999} disabled={readOnly} onCommit={setAmount} />
        <Button variant="outline" size="sm" disabled={readOnly || amount === 0} onClick={() => update((current) => takeDamage(current, amount))}>
          {t('characterSheet.hp.damage')}
        </Button>
        <Button variant="outline" size="sm" disabled={readOnly || amount === 0} onClick={() => update((current) => heal(current, amount))}>
          {t('characterSheet.hp.heal')}
        </Button>
      </div>
    </section>
  );
}

function HitDiceSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const dieLabelId = useId();
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-grid">
        <div className="atlas-cs-field">
          <span id={dieLabelId} className="atlas-cs-label">{t('characterSheet.hp.hitDie')}</span>
          <Select
            value={String(sheet.hitDie)}
            options={HIT_DIE_OPTIONS}
            labelledBy={dieLabelId}
            disabled={readOnly}
            onChange={(value) => update((current) => ({ ...current, hitDie: HIT_DICE.find((die) => String(die) === value) ?? current.hitDie }))}
          />
        </div>
        <NumberField label={t('characterSheet.hp.hitDiceUsed')} value={sheet.hitDiceUsed} min={0} max={sheet.level} disabled={readOnly} onCommit={(value) => update((current) => withHitDiceUsed(current, value))} />
      </div>
      <p className="atlas-cs-help">{t('characterSheet.hp.hitDiceRemaining', { remaining: hitDiceRemaining(sheet), total: sheet.level })}</p>
    </section>
  );
}

interface PipsProps {
  label: string;
  count: number;
  readOnly: boolean;
  onSet: (count: number) => void;
}

function DeathSavePips({ label, count, readOnly, onSet }: PipsProps): React.JSX.Element {
  return (
    <div className="atlas-cs-deathsaves">
      <span className="atlas-cs-label">{label}</span>
      {[1, 2, 3].map((pip) => (
        <button
          key={pip}
          type="button"
          className={`atlas-cs-pip ${count >= pip ? 'atlas-cs-pip-on' : ''}`}
          disabled={readOnly}
          aria-pressed={count >= pip}
          aria-label={`${label} ${pip}`}
          onClick={() => onSet(pipCount(count, pip))}
        />
      ))}
    </div>
  );
}

function DeathSavesSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.hp.deathSaves')}</h4>
      <DeathSavePips label={t('characterSheet.hp.successes')} count={sheet.deathSaves.successes} readOnly={readOnly} onSet={(count) => update((current) => withDeathSaves(current, 'successes', count))} />
      <DeathSavePips label={t('characterSheet.hp.failures')} count={sheet.deathSaves.failures} readOnly={readOnly} onSet={(count) => update((current) => withDeathSaves(current, 'failures', count))} />
      <CheckField label={t('characterSheet.hp.inspiration')} checked={sheet.inspiration} disabled={readOnly} onChange={(inspiration) => update((current) => ({ ...current, inspiration }))} />
    </section>
  );
}

export function HitPointsTab(props: SheetPanelProps): React.JSX.Element {
  return (
    <>
      <HitPointsSection {...props} />
      <HitDiceSection {...props} />
      <DeathSavesSection {...props} />
      <section className="atlas-cs-section">
        <div className="atlas-cs-row">
          <Button variant="outline" size="sm" disabled={props.readOnly} onClick={() => props.update(longRest)}>
            {t('characterSheet.hp.longRest')}
          </Button>
          <p className="atlas-cs-help">{t('characterSheet.hp.longRestHint')}</p>
        </div>
      </section>
    </>
  );
}
