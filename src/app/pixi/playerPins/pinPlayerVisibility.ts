import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { NotePin, PinPlayerVisibility } from '../../types';
import { pinSize } from '../../styles/designTokens';
import { canvasBadgeColors } from '../utils/canvasBadgeColors';

/** The choices a pin offers besides staying the GM's, in the order the pin dropdown lists them. */
export const PIN_PLAYER_VISIBILITIES: readonly PinPlayerVisibility[] = ['icon', 'note'];

/** Whether the local player window shows the pin. */
export function isShownToPlayers(pin: NotePin): boolean {
  return pin.playerVisibility !== undefined;
}

/** Widest a revealed note runs, in badge radii. */
const LABEL_WIDTH = 14;

/** The text of a pin's note in a card under the pin, as the players see it while the GM reveals it. */
export function createRevealLabel(text: string): Container {
  const colors = canvasBadgeColors();
  const radius = pinSize.badgeRadius;
  const label = new Text({
    text,
    style: new TextStyle({
      fill: colors.stroke,
      fontSize: radius * 0.7,
      fontFamily: 'Arial, sans-serif',
      wordWrap: true,
      wordWrapWidth: radius * LABEL_WIDTH,
    }),
    resolution: 4,
  });
  const padding = radius * 0.5;
  const card = new Graphics();
  card.roundRect(0, 0, label.width + padding * 2, label.height + padding * 2, padding);
  card.fill({ color: colors.background, alpha: 0.95 });
  card.stroke({ width: 0.5, color: colors.stroke, alpha: 0.4 });
  label.position.set(padding, padding);
  const group = new Container();
  group.addChild(card, label);
  group.position.set(-(label.width + padding * 2) / 2, radius + padding);
  return group;
}
