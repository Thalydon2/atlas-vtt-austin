import { Platform } from 'obsidian';
import type { PinPlayerVisibility } from '../types';
import { PIN_PLAYER_VISIBILITIES } from '../pixi/playerPins/pinPlayerVisibility';
import { t } from '../i18n';

interface PinPlayerPickerOptions {
  selected: PinPlayerVisibility | undefined;
  /** Undefined is hidden from players. */
  onSelect: (visibility: PinPlayerVisibility | undefined) => void;
}

const LABELS: Record<PinPlayerVisibility | 'hidden', () => string> = {
  hidden: () => t('pin.players.hidden'),
  icon: () => t('pin.players.icon'),
  note: () => t('pin.players.note', { key: Platform.isMacOS ? 'Cmd' : 'Ctrl' }),
};

/** The note pin dropdown's row that sets what the local player window shows of the pin. */
export function createPinPlayerPicker(parent: HTMLElement, { selected, onSelect }: PinPlayerPickerOptions): void {
  let current = selected;
  const picker = parent.createDiv({ cls: 'pin-player-picker' });
  picker.createDiv({ cls: 'pin-player-label', text: t('pin.players.group') });
  const row = picker.createDiv({ cls: 'pin-player-row', attr: { role: 'radiogroup', 'aria-label': t('pin.players.group') } });
  const buttons = new Map<PinPlayerVisibility | undefined, HTMLButtonElement>();
  const refresh = (): void => {
    for (const [value, button] of buttons) {
      button.toggleClass('is-selected', value === current);
      button.setAttribute('aria-checked', String(value === current));
    }
  };
  for (const value of [undefined, ...PIN_PLAYER_VISIBILITIES]) {
    const button = row.createEl('button', { cls: 'pin-player-btn', text: LABELS[value ?? 'hidden'](), attr: { type: 'button', role: 'radio' } });
    button.addEventListener('click', () => {
      current = value;
      refresh();
      onSelect(value);
    });
    buttons.set(value, button);
  }
  refresh();
}
