import { parseLinktext, type App } from 'obsidian';

/** Longest excerpt, in characters; a longer note is cut at a word. */
const MAX_EXCERPT = 600;

interface HeadingLine {
  heading: string;
  level: number;
  line: number;
}

/** The note's lines with its frontmatter blanked, so line numbers still match the metadata cache. */
function bodyLines(text: string): string[] {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') return lines;
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  return end === -1 ? lines : lines.map((line, index) => (index <= end ? '' : line));
}

/** A line of Markdown as plain text: embeds gone, links as their text, no heading marks, quotes, emphasis or comments. */
function plainLine(line: string): string {
  return line
    .replace(/!\[\[[^\]]*\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/(\*\*|__|\*|_|~~|==|`)/g, '')
    .replace(/%%.*?%%/g, '')
    .trim();
}

/** Plain text of a note, or of the section under `heading`; runs of blank lines kept to one, cut to `max`. */
export function noteExcerpt(text: string, headings: readonly HeadingLine[], heading: string | undefined, max = MAX_EXCERPT): string {
  let lines = bodyLines(text);
  if (heading) {
    const start = headings.find((entry) => entry.heading === heading);
    if (start) {
      const next = headings.find((entry) => entry.line > start.line && entry.level <= start.level);
      lines = lines.slice(start.line + 1, next?.line ?? lines.length);
    }
  }
  const plain = lines
    .map(plainLine)
    .filter((line, index, all) => line !== '' || (index > 0 && all[index - 1] !== ''))
    .join('\n')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2))}…`;
}

/** The excerpt of the note a pin links (`[[Note#Heading]]` reads that section); empty when the note is gone. */
export async function readNoteExcerpt(app: App, link: string): Promise<string> {
  const { path, subpath } = parseLinktext(link);
  const file = app.metadataCache.getFirstLinkpathDest(path, '');
  if (!file) return '';
  const text = await app.vault.cachedRead(file);
  const headings = (app.metadataCache.getFileCache(file)?.headings ?? []).map((entry) => ({
    heading: entry.heading,
    level: entry.level,
    line: entry.position.start.line,
  }));
  return noteExcerpt(text, headings, subpath.startsWith('#') ? subpath.slice(1) : undefined);
}
