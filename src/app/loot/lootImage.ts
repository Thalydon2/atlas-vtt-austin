import { TFile, type App } from 'obsidian';
import type { LootDraw } from './lootRoller';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'avif']);
/** Frontmatter keys of an item note that name its picture, when the base does not show one. */
const IMAGE_KEYS = /^(image|img|picture|art|artwork|cover|icon|thumbnail|portrait|token)$/i;
const WEB_ADDRESS = /^https?:\/\/\S+$/i;

/** What an image value points at: a web address, or a vault link or path. */
export type ImageReference = { kind: 'web'; url: string } | { kind: 'vault'; linkpath: string };

/**
 * Reads a picture value as Obsidian writes them: `![[Sword.png]]`, `[[Sword.png|alias]]`,
 * `![alt](Items/Sword.png)`, a bare path or a web address. Null for anything else.
 */
export function imageReference(value: unknown): ImageReference | null {
  const text: unknown = Array.isArray(value) ? (value as unknown[])[0] : value;
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const wiki = /^!?\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]$/.exec(trimmed);
  if (wiki) return { kind: 'vault', linkpath: wiki[1]!.trim() };
  const markdown = /^!?\[[^\]]*\]\(<?([^)>]+)>?\)$/.exec(trimmed);
  const target = markdown ? markdown[1]!.trim() : trimmed;
  if (WEB_ADDRESS.test(target)) return { kind: 'web', url: target };
  return /[[\]\n]/.test(target) ? null : { kind: 'vault', linkpath: decoded(target) };
}

/** A path written with %20 for spaces, as Markdown links have it; one that is no valid escape stays as written. */
function decoded(path: string): string {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}

function isImageFile(file: unknown): file is TFile {
  return file instanceof TFile && IMAGE_EXTENSIONS.has(file.extension.toLowerCase());
}

function urlOf(app: App, reference: ImageReference | null, sourcePath: string): string | null {
  if (!reference) return null;
  if (reference.kind === 'web') return reference.url;
  const file = app.metadataCache.getFirstLinkpathDest(reference.linkpath, sourcePath) ?? app.vault.getAbstractFileByPath(reference.linkpath);
  return isImageFile(file) ? app.vault.getResourcePath(file) : null;
}

/**
 * The picture of a rolled item, to show on its card: the base's image property, else an image
 * named in the item note's frontmatter, else the first image the note embeds. Null without one.
 */
export function lootImageUrl(app: App, draw: Pick<LootDraw, 'image' | 'notePath'>): string | null {
  const fromBase = urlOf(app, imageReference(draw.image), draw.notePath);
  if (fromBase) return fromBase;
  const note = app.vault.getAbstractFileByPath(draw.notePath);
  if (!(note instanceof TFile)) return null;
  const cache = app.metadataCache.getFileCache(note);
  for (const [key, value] of Object.entries(cache?.frontmatter ?? {})) {
    if (!IMAGE_KEYS.test(key)) continue;
    const url = urlOf(app, imageReference(value), note.path);
    if (url) return url;
  }
  for (const embed of cache?.embeds ?? []) {
    const url = urlOf(app, { kind: 'vault', linkpath: embed.link.split(/[#|]/)[0]!.trim() }, note.path);
    if (url) return url;
  }
  return null;
}

let app: App | null = null;

/** Lets loot cards anywhere in this Obsidian (the loot roller, the player window) find item pictures; null on unload. */
export function setLootImageApp(next: App | null): void {
  app = next;
}

/** The picture of a rolled item, or null where none is found or pictures cannot be read (an online player's browser). */
export function lootImageFor(draw: Pick<LootDraw, 'image' | 'notePath'>): string | null {
  return app ? lootImageUrl(app, draw) : null;
}
