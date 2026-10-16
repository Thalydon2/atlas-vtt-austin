import type { App } from 'obsidian';
import type { EventEmitter } from 'events';
import type { FederatedPointerEvent } from 'pixi.js';
import type { ViewAtlasStore } from '../../storeFactory';
import { isModHeld, isModKey } from '../../keyboard/modKey';
import { readNoteExcerpt } from './noteExcerpt';

interface HoveredPin {
  pin: { id: string; kind?: string };
  pixiEvent?: FederatedPointerEvent;
}

/** Shows `text` under the pin `pinId` in the players' picture; null hides what is shown. */
export type ApplyReveal = (pinId: string | null, text?: string) => void;

/**
 * While the GM holds Cmd/Ctrl over a pin shown to players with its note (`playerVisibility: 'note'`),
 * the players see the note's text under it. Letting go of the key or leaving the pin hides it.
 */
export class PlayerPinReveal {
  private hovered: string | null = null;
  private modDown = false;
  private shown: string | null = null;
  /** Counts reads, so a note that arrives after the reveal ended is dropped. */
  private ticket = 0;

  constructor(
    private readonly app: App,
    private readonly eventBus: EventEmitter,
    private readonly store: ViewAtlasStore,
    private readonly apply: ApplyReveal,
  ) {
    eventBus.on('pin-hover-preview', this.onHover);
    eventBus.on('pin-hide-preview', this.onHide);
    document.addEventListener('keydown', this.onKey);
    document.addEventListener('keyup', this.onKey);
    window.addEventListener('blur', this.onBlur);
  }

  private onHover = (data: HoveredPin): void => {
    if (data.pin.kind !== 'pin') return;
    this.hovered = data.pin.id;
    if (data.pixiEvent) this.modDown = isModHeld(data.pixiEvent);
    this.update();
  };

  private onHide = (data: HoveredPin): void => {
    if (data.pin.id !== this.hovered) return;
    this.hovered = null;
    this.update();
  };

  private onKey = (event: KeyboardEvent): void => {
    if (!isModKey(event)) return;
    this.modDown = event.type === 'keydown';
    this.update();
  };

  private onBlur = (): void => {
    this.modDown = false;
    this.update();
  };

  private update(): void {
    const id = this.hovered && this.modDown ? this.hovered : null;
    const pin = id ? this.store.getState().objects.pins[id] : undefined;
    if (pin?.playerVisibility !== 'note') {
      this.hide();
      return;
    }
    if (this.shown === pin.id) return;
    const ticket = ++this.ticket;
    this.shown = pin.id;
    readNoteExcerpt(this.app, pin.notePath).then(
      (text) => { if (ticket === this.ticket) this.apply(pin.id, text); },
      () => { /* A note that cannot be read reveals nothing. */ },
    );
  }

  private hide(): void {
    if (this.shown === null) return;
    this.ticket++;
    this.shown = null;
    this.apply(null);
  }

  destroy(): void {
    this.eventBus.off('pin-hover-preview', this.onHover);
    this.eventBus.off('pin-hide-preview', this.onHide);
    document.removeEventListener('keydown', this.onKey);
    document.removeEventListener('keyup', this.onKey);
    window.removeEventListener('blur', this.onBlur);
    this.hide();
  }
}
