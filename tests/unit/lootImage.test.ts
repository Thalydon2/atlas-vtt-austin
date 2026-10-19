import { describe, expect, it } from 'vitest';
import { imageReference } from '../../src/app/loot/lootImage';
import { toLootItems } from '../../src/app/loot/lootItem';

describe('item pictures', () => {
  it('reads the ways Obsidian writes a picture', () => {
    expect(imageReference('![[Sword.png]]')).toEqual({ kind: 'vault', linkpath: 'Sword.png' });
    expect(imageReference('[[Art/Sword.png|Sword]]')).toEqual({ kind: 'vault', linkpath: 'Art/Sword.png' });
    expect(imageReference('![sword](Art/Long%20Sword.png)')).toEqual({ kind: 'vault', linkpath: 'Art/Long Sword.png' });
    expect(imageReference('https://example.com/sword.png')).toEqual({ kind: 'web', url: 'https://example.com/sword.png' });
    expect(imageReference(['[[Shield.webp]]'])).toEqual({ kind: 'vault', linkpath: 'Shield.webp' });
    expect(imageReference('')).toBeNull();
    expect(imageReference(3)).toBeNull();
  });

  it('takes a base property named like a picture as the image, not as a shown property', () => {
    const [item] = toLootItems({
      entries: [{ path: 'Items/Sword.md', name: 'Sword', values: { 'note.image': '[[Sword.png]]', 'note.weight': '3 lb' } }],
      order: ['note.image', 'note.weight'],
      displayNames: {},
    }, ['Items']);
    expect(item?.image).toBe('[[Sword.png]]');
    expect(item?.properties.map((property) => property.label)).toEqual(['weight']);
  });
});
