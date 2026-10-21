import { requestUrl } from 'obsidian';
import { isReleaseVersion } from '../changelog/version';
import { isRecord } from '../utils/guards';

/** Austin's fork, which BRAT installs from: its releases, not the official plugin's, are this build's updates. */
export const FORK_REPOSITORY = 'Thalydon2/atlas-vtt-austin';
/** The fork's manifest on its default branch, which names the newest version pushed. */
export const MANIFEST_URL = `https://raw.githubusercontent.com/${FORK_REPOSITORY}/HEAD/manifest.json`;
const PLUGIN_ID = 'atlas-vtt-austin';
/** A manifest is a few hundred bytes; anything far larger is not one. */
const MAX_MANIFEST_LENGTH = 64 * 1024;

export type FetchText = (url: string) => Promise<{ status: number; text: string }>;

/** Obsidian's `requestUrl`, which answers errors with their status instead of throwing. */
export const obsidianFetch: FetchText = async (url) => {
  const response = await requestUrl({ url, throw: false });
  return { status: response.status, text: response.text };
};

/**
 * The release Obsidian would install now, or null when the manifest cannot be read, is not
 * Atlas', names no release, or needs a newer Obsidian than `appSupports` allows. Never throws.
 */
export async function readPublishedVersion(fetch: FetchText, appSupports: (minAppVersion: string) => boolean): Promise<string | null> {
  try {
    const { status, text } = await fetch(MANIFEST_URL);
    if (status !== 200 || text.length > MAX_MANIFEST_LENGTH) return null;
    const manifest: unknown = JSON.parse(text);
    if (!isRecord(manifest)) return null;
    const { id, version, minAppVersion } = manifest;
    if (id !== PLUGIN_ID || !isReleaseVersion(version)) return null;
    if (typeof minAppVersion === 'string' && !appSupports(minAppVersion)) return null;
    return version;
  } catch {
    return null;
  }
}
