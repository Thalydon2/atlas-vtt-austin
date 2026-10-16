import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { App } from 'obsidian';
import { CharacterSheetPreview } from '../react/components/character-sheet/CharacterSheetPreview';
import { previewEdgeGaps } from '../react/components/statblock/previewEdgeGap';
import type { NotePreviewUIManager, PreviewAnchorRef, TokenPreviewAnchor } from './NotePreviewUIManager';
import './statblock-preview-window.scss';

const CURSOR_OFFSET = 15;
const CLOSE_MS = 150;

/** The CMD/Ctrl+hover preview of a token placed from a character sheet; shaped like a statblock preview. */
export class CharacterSheetPreviewWindow {
  public notePath: string;
  public element: HTMLElement | null = null;
  public originatingPin: PreviewAnchorRef;
  private reactRoot: Root | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private closing = false;

  constructor(
    app: App,
    token: TokenPreviewAnchor & { characterSheetId: string },
    private manager: NotePreviewUIManager,
    private position: { x: number; y: number },
  ) {
    this.notePath = token.notePath;
    this.originatingPin = token;
    this.element = document.body.createDiv({ cls: 'atlas-vtt-plugin atlas-statblock-preview-window atlas-cs-preview-window' });
    this.element.setAttribute('tabindex', '-1');
    this.setPosition(position.x, position.y);
    this.reactRoot = createRoot(this.element);
    this.reactRoot.render(React.createElement(CharacterSheetPreview, {
      app,
      sheetId: token.characterSheetId,
      hitPoints: token.resources?.hp,
      tokenImagePath: token.imagePath,
    }));
    // The sheet loads after the constructor returns: place the window again once it has its size.
    this.resizeObserver = new ResizeObserver(() => this.setPosition(this.position.x, this.position.y));
    this.resizeObserver.observe(this.element);
  }

  setPosition(x: number, y: number): void {
    this.position = { x, y };
    const element = this.element;
    if (!element) return;
    const gaps = previewEdgeGaps(element.ownerDocument, 20);
    element.classList.add('atlas-statblock-preview-window--measuring');
    window.requestAnimationFrame(() => {
      if (!this.element) return;
      this.element.style.maxHeight = `${window.innerHeight - gaps.block * 2}px`;
      const rect = this.element.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 400;
      let left = x + CURSOR_OFFSET;
      let top = y + CURSOR_OFFSET;
      if (left + width > window.innerWidth - gaps.inline) left = Math.max(gaps.inline, x - width - CURSOR_OFFSET);
      if (top + height > window.innerHeight - gaps.block) top = Math.max(gaps.block, window.innerHeight - height - gaps.block);
      this.element.style.left = `${Math.max(gaps.inline, left)}px`;
      this.element.style.top = `${Math.max(gaps.block, top)}px`;
      this.element.classList.remove('atlas-statblock-preview-window--measuring');
    });
  }

  hide(_force?: boolean): void {
    if (this.closing) return;
    this.closing = true;
    this.element?.classList.add('atlas-statblock-preview-window--closing');
    window.setTimeout(() => this.destroy(), CLOSE_MS);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    // React forbids unmounting while it renders, which happens when this runs from an effect.
    const root = this.reactRoot;
    this.reactRoot = null;
    if (root) window.setTimeout(() => root.unmount(), 0);
    this.element?.remove();
    this.element = null;
    this.manager.handlePreviewClosed(this);
  }

  getIsPinned(): boolean {
    return false;
  }
}
