import { Drag } from 'pixi-viewport';
import type { IDragOptions, Viewport } from 'pixi-viewport';
import type { FederatedPointerEvent } from 'pixi.js';

/** Screen pixels the pointer moves with Shift held before the pan picks the axis it locks to. */
const AXIS_PICK_DISTANCE_PX = 8;

type Axis = 'x' | 'y';

interface Point {
  x: number;
  y: number;
}

/**
 * pixi-viewport `drag` plugin whose pan holds to one axis while Shift is held: the axis the
 * pointer moved further along from where Shift was pressed. Releasing Shift pans freely again.
 */
export class AxisLockDrag extends Drag {
  private previousPoint: Point | null = null;
  private lockStart: Point | null = null;
  private lockedAxis: Axis | null = null;

  constructor(parent: Viewport, options?: IDragOptions) {
    super(parent, options);
  }

  override down(event: FederatedPointerEvent): boolean {
    this.clearLock();
    this.previousPoint = { x: event.global.x, y: event.global.y };
    return super.down(event);
  }

  override move(event: FederatedPointerEvent): boolean {
    const previous = this.previousPoint;
    this.previousPoint = { x: event.global.x, y: event.global.y };
    if (!event.shiftKey) {
      this.clearLock();
      return super.move(event);
    }
    this.lockStart ??= previous ?? this.previousPoint;
    this.lockedAxis ??= this.pickAxis(event, this.lockStart);
    return this.lockedAxis ? this.moveAlong(this.lockedAxis, event) : this.moved;
  }

  override up(event: FederatedPointerEvent): boolean {
    this.clearLock();
    this.previousPoint = null;
    return super.up(event);
  }

  private pickAxis(event: FederatedPointerEvent, start: Point): Axis | null {
    const dx = Math.abs(event.global.x - start.x);
    const dy = Math.abs(event.global.y - start.y);
    if (Math.max(dx, dy) < AXIS_PICK_DISTANCE_PX) return null;
    return dx >= dy ? 'x' : 'y';
  }

  /** Moves as the plugin does, with the other axis switched off for this one move. */
  private moveAlong(axis: Axis, event: FederatedPointerEvent): boolean {
    const { xDirection, yDirection } = this;
    this.xDirection = xDirection && axis === 'x';
    this.yDirection = yDirection && axis === 'y';
    try {
      return super.move(event);
    } finally {
      this.xDirection = xDirection;
      this.yDirection = yDirection;
    }
  }

  private clearLock(): void {
    this.lockStart = null;
    this.lockedAxis = null;
  }
}
