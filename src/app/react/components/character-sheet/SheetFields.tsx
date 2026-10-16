import React, { useEffect, useId, useState } from 'react';
import type { CharacterSheet } from '../../../characterSheet/characterSheetTypes';
import type { SheetUpdate } from './useCharacterSheet';

/** What every tab of the sheet is given. */
export interface SheetPanelProps {
  sheet: CharacterSheet;
  update: SheetUpdate;
  readOnly: boolean;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}

export function TextField({ label, value, onChange, disabled = false, multiline = false }: TextFieldProps): React.JSX.Element {
  const id = useId();
  return (
    <div className="atlas-cs-field">
      <label className="atlas-cs-label" htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} className="atlas-cs-textarea" value={value} disabled={disabled} rows={6} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} type="text" className="atlas-cs-input" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
  /** The label is read by screen readers only. */
  hideLabel?: boolean;
}

/** A whole number, committed on blur or Enter and clamped to its range; anything else puts the value back. */
export function NumberField({ label, value, min, max, onCommit, disabled = false, hideLabel = false }: NumberFieldProps): React.JSX.Element {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = (): void => {
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, Math.trunc(parsed)));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <div className="atlas-cs-field">
      <label className={hideLabel ? 'atlas-cs-label atlas-cs-visually-hidden' : 'atlas-cs-label'} htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className="atlas-cs-input atlas-cs-number"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === 'Enter') commit(); }}
      />
    </div>
  );
}

/** A derived number with its label under it. */
export function StatTile({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="atlas-cs-tile">
      <span className="atlas-cs-tile-value">{value}</span>
      <span className="atlas-cs-tile-label">{label}</span>
    </div>
  );
}

interface CheckFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CheckField({ label, checked, onChange, disabled = false }: CheckFieldProps): React.JSX.Element {
  return (
    <label className="atlas-cs-check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
