import React from 'react';
import { Dices, Minus, Plus } from 'lucide-react';
import { Button } from '../../../packages/components/primitives/button';
import { LabelTooltip } from '../../../packages/components/primitives/tooltip';
import { NO_RARITY_KEY, rarityKey } from '../../../loot/lootRoller';
import type { RarityOption } from '../../../types/randomTableTypes';
import { LOOT_MAX_COUNT } from '../../../stores/lootRollerSlice';
import { t } from '../../../i18n';

interface RarityTogglesProps {
  /** The collection's rarity words, in their order. */
  rarities: readonly RarityOption[];
  /** Items of each word (`rarityKey`) in the ticked views, and of none (`NO_RARITY_KEY`). */
  rarityCounts: ReadonlyMap<string, number>;
  excluded: ReadonlySet<string>;
  onExcludedChange: (excluded: string[]) => void;
}

interface RarityToggleProps {
  label: string;
  /** The ladder tone it is painted in; none for no tone. */
  tone: string | undefined;
  count: number;
  on: boolean;
  onToggle: () => void;
}

function RarityToggle({ label, tone, count, on, onToggle }: RarityToggleProps): React.ReactElement {
  const values = { count, rarity: label };
  return (
    <LabelTooltip describe label={on ? t('loot.rarityOn', values) : t('loot.rarityOff', values)}>
      <button type="button" className={`atlas-loot-rarity${on ? ' is-on' : ''}`} data-rarity={tone} aria-pressed={on} onClick={onToggle}>
        <span className="atlas-loot-rarity__gem" />
        <span className="atlas-loot-rarity__label">{label}</span>
        <span className="atlas-loot-rarity__count">{count}</span>
      </button>
    </LabelTooltip>
  );
}

/**
 * A toggle per rarity word of the collection, in its tone, and one for the items that name none
 * of them: switched-off rarities are never rolled. Nothing while no item names one of the words.
 */
export function RarityToggles({ rarities, rarityCounts, excluded, onExcludedChange }: RarityTogglesProps): React.ReactElement | null {
  if (rarities.length === 0 || !rarities.some((option) => (rarityCounts.get(rarityKey(option)) ?? 0) > 0)) return null;
  const toggle = (key: string): void => {
    const next = new Set(excluded);
    if (!next.delete(key)) next.add(key);
    onExcludedChange([...next]);
  };
  const unrated = rarityCounts.get(NO_RARITY_KEY) ?? 0;

  return (
    <div className="atlas-loot-rarities" role="group" aria-label={t('loot.rarities')}>
      {rarities.map((option) => {
        const key = rarityKey(option);
        return (
          <RarityToggle
            key={key}
            label={option.name}
            tone={option.tone ?? undefined}
            count={rarityCounts.get(key) ?? 0}
            on={!excluded.has(key)}
            onToggle={() => toggle(key)}
          />
        );
      })}
      {unrated > 0 && (
        <RarityToggle label={t('loot.rarityNone')} tone={undefined} count={unrated} on={!excluded.has(NO_RARITY_KEY)} onToggle={() => toggle(NO_RARITY_KEY)} />
      )}
    </div>
  );
}

interface RollActionsProps {
  count: number;
  /** The stepper's unit: what one roll gives. */
  unit: 'items' | 'results';
  onCountChange: (count: number) => void;
  /** The button's text and, where it differs, its name for assistive technology. */
  rollLabel: string;
  rollName?: string;
  /** What a roll does, or why it cannot be made. */
  hint: string;
  disabled: boolean;
  onRoll: () => void;
}

/** How many to roll, and the Roll button. */
export function RollActions({ count, unit, onCountChange, rollLabel, rollName, hint, disabled, onRoll }: RollActionsProps): React.ReactElement {
  return (
    <div className="atlas-loot-rollbar__actions">
      <div className="atlas-loot-stepper" role="group" aria-label={t('loot.count')}>
        <LabelTooltip label={t('loot.fewer')}>
          <Button
            variant="ghost"
            size="icon"
            className="atlas-loot-stepper__button"
            disabled={count <= 1}
            onClick={() => onCountChange(count - 1)}
          >
            <Minus />
          </Button>
        </LabelTooltip>
        <span className="atlas-loot-stepper__value" aria-live="polite">
          {count}
          <span className="atlas-loot-stepper__unit">{t(unit === 'items' ? 'tables.unit.items' : 'tables.unit.results', { count })}</span>
        </span>
        <LabelTooltip label={t('loot.more')}>
          <Button
            variant="ghost"
            size="icon"
            className="atlas-loot-stepper__button"
            disabled={count >= LOOT_MAX_COUNT}
            onClick={() => onCountChange(count + 1)}
          >
            <Plus />
          </Button>
        </LabelTooltip>
      </div>
      <LabelTooltip describe label={hint}>
        {/* The span takes the hover while the button is disabled, so the hint still shows. */}
        <span className="atlas-loot-roll-trigger">
          <Button
            variant="default"
            className="atlas-loot-roll-button"
            disabled={disabled}
            onClick={onRoll}
            {...(rollName !== undefined && { 'aria-label': rollName })}
          >
            <Dices />
            {rollLabel}
          </Button>
        </span>
      </LabelTooltip>
    </div>
  );
}
