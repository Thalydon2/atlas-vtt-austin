import React, { useMemo, useState } from 'react';
import type { LootDraw } from '../../../loot/lootRoller';
import { lootImageFor } from '../../../loot/lootImage';
import { t } from '../../../i18n';

/**
 * The item's picture beside its name. A click shows it across the card and another puts it back,
 * so a small thumbnail never hides detail. Nothing where the item has no picture or it fails to load.
 */
export function LootItemImage({ draw }: { draw: Pick<LootDraw, 'image' | 'notePath' | 'name'> }): React.ReactElement | null {
  const url = useMemo(() => lootImageFor(draw), [draw]);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!url || failed) return null;
  return (
    <button
      type="button"
      className={`atlas-loot-card__image${expanded ? ' is-expanded' : ''}`}
      aria-label={t(expanded ? 'loot.image.shrink' : 'loot.image.enlarge', { name: draw.name })}
      aria-expanded={expanded}
      onClick={(event) => { event.stopPropagation(); setExpanded(!expanded); }}
    >
      <img src={url} alt="" draggable={false} loading="lazy" onError={() => setFailed(true)} />
    </button>
  );
}
