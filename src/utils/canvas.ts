import { Point, StoryBlock, Viewport } from '../types';
import { ZOOM } from '../constants';
import { renderedHeight } from './project';

export interface ConnectionGeometry {
  d: string;
  start: Point;
  end: Point;
  mid: Point;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const boxOf = (block: StoryBlock): Box => ({
  x: block.x,
  y: block.y,
  width: block.width,
  height: renderedHeight(block)
});

/**
 * Smooth S-curve between the nearest edges of two boxes.
 * The curve leaves and enters perpendicular to the edge, which reads as a clear direction of flow.
 */
export const connectionBetweenBoxes = (from: Box, to: Box): ConnectionGeometry => {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  let start: Point;
  let end: Point;
  let c1: Point;
  let c2: Point;

  if (Math.abs(dx) > Math.abs(dy)) {
    const dir = dx >= 0 ? 1 : -1;
    start = { x: dir > 0 ? from.x + from.width : from.x, y: fromCenter.y };
    end = { x: dir > 0 ? to.x : to.x + to.width, y: toCenter.y };
    const pull = Math.max(40, Math.abs(end.x - start.x) / 2);
    c1 = { x: start.x + dir * pull, y: start.y };
    c2 = { x: end.x - dir * pull, y: end.y };
  } else {
    const dir = dy >= 0 ? 1 : -1;
    start = { x: fromCenter.x, y: dir > 0 ? from.y + from.height : from.y };
    end = { x: toCenter.x, y: dir > 0 ? to.y : to.y + to.height };
    const pull = Math.max(40, Math.abs(end.y - start.y) / 2);
    c1 = { x: start.x, y: start.y + dir * pull };
    c2 = { x: end.x, y: end.y - dir * pull };
  }

  const mid = {
    x: (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8,
    y: (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8
  };

  const d = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
  return { d, start, end, mid };
};

export const connectionBetweenBlocks = (from: StoryBlock, to: StoryBlock): ConnectionGeometry =>
  connectionBetweenBoxes(boxOf(from), boxOf(to));

/** Curve from a block to a free point (used for the live preview while connecting). */
export const connectionToPoint = (from: StoryBlock, point: Point): ConnectionGeometry =>
  connectionBetweenBoxes(boxOf(from), { x: point.x, y: point.y, width: 0, height: 0 });

export const clampZoom = (zoom: number): number => Math.min(ZOOM.max, Math.max(ZOOM.min, zoom));

/** Zooms so that the world point under `anchor` (canvas-relative pixels) stays fixed on screen. */
export const zoomViewportAt = (viewport: Viewport, nextZoom: number, anchor: Point): Viewport => {
  const zoom = clampZoom(nextZoom);
  const worldX = (anchor.x - viewport.x) / viewport.zoom;
  const worldY = (anchor.y - viewport.y) / viewport.zoom;
  return {
    zoom,
    x: anchor.x - worldX * zoom,
    y: anchor.y - worldY * zoom
  };
};

export const screenToWorld = (viewport: Viewport, canvasPoint: Point): Point => ({
  x: (canvasPoint.x - viewport.x) / viewport.zoom,
  y: (canvasPoint.y - viewport.y) / viewport.zoom
});

/** Viewport that centers the given block in a canvas of the given size, keeping the current zoom. */
export const centerOnBlock = (viewport: Viewport, block: StoryBlock, canvasWidth: number, canvasHeight: number): Viewport => {
  const cx = block.x + block.width / 2;
  const cy = block.y + renderedHeight(block) / 2;
  return {
    ...viewport,
    x: canvasWidth / 2 - cx * viewport.zoom,
    y: canvasHeight / 2 - cy * viewport.zoom
  };
};

/** Viewport that shows every block with some padding. Returns null when there is nothing to fit. */
export const fitViewport = (blocks: StoryBlock[], canvasWidth: number, canvasHeight: number): Viewport | null => {
  if (blocks.length === 0 || canvasWidth <= 0 || canvasHeight <= 0) return null;
  const padding = 80;
  const minX = Math.min(...blocks.map(b => b.x));
  const minY = Math.min(...blocks.map(b => b.y));
  const maxX = Math.max(...blocks.map(b => b.x + b.width));
  const maxY = Math.max(...blocks.map(b => b.y + renderedHeight(b)));
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const zoom = clampZoom(Math.min(canvasWidth / width, canvasHeight / height, 1.25));
  return {
    zoom,
    x: canvasWidth / 2 - ((minX + maxX) / 2) * zoom,
    y: canvasHeight / 2 - ((minY + maxY) / 2) * zoom
  };
};

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
