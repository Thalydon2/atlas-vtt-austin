import { setIcon, type App } from 'obsidian';
import { FORK_REPOSITORY } from './publishedVersion';
import { t } from '../i18n';
import { showNotice } from '../ui/notice';
import atlasIconUrl from '../assets/brand/atlas-icon.webp';

const FORK_URL = `https://github.com/${FORK_REPOSITORY}`;
/** BRAT's command that updates every beta plugin it installed, this fork among them. */
const BRAT_UPDATE_COMMAND = /^obsidian42-brat:.*checkForUpdatesAndUpdate$/i;

export function releaseNotesUrl(version: string): string {
  return `${FORK_URL}/releases/tag/${encodeURIComponent(version)}`;
}

interface CommandRegistry {
  commands?: Record<string, unknown>;
  executeCommandById?: (id: string) => boolean;
}

/**
 * Hands the update to BRAT, which installed this fork: its "check for updates and update" command,
 * else the fork's releases page. Atlas never installs anything itself.
 */
export function openUpdate(app: App | undefined = (window as unknown as { app?: App }).app): void {
  const registry = (app as unknown as { commands?: CommandRegistry } | undefined)?.commands;
  const command = Object.keys(registry?.commands ?? {}).find((id) => BRAT_UPDATE_COMMAND.test(id));
  if (command && registry?.executeCommandById?.(command)) return;
  window.open(`${FORK_URL}/releases/latest`);
}

/** Says that `version` is out, with Update and What's new; it stays until it is clicked. */
export function announceUpdate(version: string): void {
  const message = createFragment();
  const card = message.createDiv({ cls: 'atlas-vtt-plugin atlas-update-notice' });
  card.createEl('img', { cls: 'atlas-update-notice__icon', attr: { src: atlasIconUrl, alt: '' } });
  const body = card.createDiv({ cls: 'atlas-update-notice__body' });
  body.createDiv({ cls: 'atlas-update-notice__title', text: t('settings.updates.noticeTitle') });
  body.createDiv({ cls: 'atlas-update-notice__text', text: t('settings.updates.notice', { version }) });
  const actions = body.createDiv({ cls: 'atlas-update-notice__actions' });
  const update = actions.createEl('button', { cls: 'mod-cta', text: t('settings.updates.update') });
  const notes = actions.createEl('button', { text: t('settings.updates.whatsNew') });
  const close = card.createEl('button', { cls: 'btn btn--ghost btn--icon atlas-close-btn atlas-update-notice__close', attr: { 'aria-label': t('common.close') } });
  setIcon(close, 'x');
  const notice = showNotice(message, 0);
  close.addEventListener('click', () => notice.hide());
  update.addEventListener('click', () => {
    notice.hide();
    openUpdate();
  });
  notes.addEventListener('click', () => {
    notice.hide();
    window.open(releaseNotesUrl(version));
  });
}
