import {
  AppState,
  BlockNotes,
  BlockType,
  NoteCategory,
  ProjectData,
  StoryBlock,
  Variable,
  Viewport
} from '../types';
import { BLOCK_DEFAULTS, COLORS, PROJECT_VERSION, ZOOM } from '../constants';

const CATEGORIES: NoteCategory[] = ['past', 'villain_world', 'hero_world'];

/** Unique id. Keeps the timestamp prefix older files used, plus a random suffix to avoid collisions. */
export const uid = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === 'object' ? (value as Raw) : {};

export const createEmptyNotes = (): BlockNotes => ({
  specialNotes: '',
  plotTwist: '',
  plotHoles: '',
  inspiration: '',
  category: 'past'
});

/**
 * Coerces a block from any file version into the current shape.
 * Missing fields get defaults, bad values are clamped, and legacy "height 64 means minimized" is migrated.
 */
export const normalizeBlock = (rawValue: unknown, fallbackType: BlockType): StoryBlock => {
  const raw = asRecord(rawValue);
  const type: BlockType = raw.type === 'idea' ? 'idea' : raw.type === 'story' ? 'story' : fallbackType;
  const defaultHeight = type === 'idea' ? BLOCK_DEFAULTS.ideaHeight : BLOCK_DEFAULTS.storyHeight;

  const rawNotes = asRecord(raw.notes);
  const category = rawNotes.category as NoteCategory;
  const notes: BlockNotes = {
    specialNotes: str(rawNotes.specialNotes),
    plotTwist: str(rawNotes.plotTwist),
    plotHoles: str(rawNotes.plotHoles),
    inspiration: str(rawNotes.inspiration),
    category: CATEGORIES.includes(category) ? category : 'past'
  };

  const legacyMinimized = raw.height === BLOCK_DEFAULTS.legacyMinimizedHeight;
  const isMinimized = Boolean(raw.isMinimized) || legacyMinimized;
  let height = num(raw.height, defaultHeight);
  if (legacyMinimized) height = num(raw.originalHeight, defaultHeight);

  const connections = Array.isArray(raw.connections)
    ? Array.from(new Set(raw.connections.filter(c => c != null).map(String)))
    : [];

  return {
    id: raw.id != null ? String(raw.id) : uid(),
    type,
    x: num(raw.x, 0),
    y: num(raw.y, 0),
    width: Math.max(BLOCK_DEFAULTS.minWidth, num(raw.width, BLOCK_DEFAULTS.width)),
    height: Math.max(BLOCK_DEFAULTS.minHeight, height),
    isMinimized,
    title: str(raw.title, type === 'idea' ? 'New Idea' : 'New Story Block'),
    content: str(raw.content),
    notes,
    color: typeof raw.color === 'string' && raw.color ? raw.color : COLORS[0],
    isBookmarked: Boolean(raw.isBookmarked),
    connections,
    priority: clampPercent(num(raw.priority, type === 'idea' ? 50 : 0)),
    satisfaction: clampPercent(num(raw.satisfaction, type === 'story' ? 50 : 0))
  };
};

/** Makes ids unique within a board and drops connections that point nowhere. */
const cleanBoard = (blocks: StoryBlock[]): StoryBlock[] => {
  const seen = new Set<string>();
  const unique = blocks.map(block => {
    if (!seen.has(block.id)) {
      seen.add(block.id);
      return block;
    }
    return { ...block, id: uid() };
  });
  const ids = new Set(unique.map(b => b.id));
  return unique.map(block => ({
    ...block,
    connections: block.connections.filter(target => target !== block.id && ids.has(target))
  }));
};

export const normalizeViewport = (rawValue: unknown): Viewport => {
  const raw = asRecord(rawValue);
  return {
    x: num(raw.x, 0),
    y: num(raw.y, 0),
    zoom: clamp(num(raw.zoom, 1), ZOOM.min, ZOOM.max)
  };
};

export const normalizeVariables = (rawValue: unknown): Variable[] => {
  if (!Array.isArray(rawValue)) return [];
  return rawValue
    .filter(v => v && typeof v === 'object')
    .map(v => {
      const raw = v as Raw;
      return { id: raw.id != null ? String(raw.id) : uid(), name: str(raw.name), value: str(raw.value) };
    });
};

/**
 * Reads any project file this app has ever written.
 * Version 1 files had a single `blocks` list; version 2 split it into `storyBlocks` and `ideaBlocks`.
 */
export const normalizeProject = (rawValue: unknown): ProjectData => {
  if (!rawValue || typeof rawValue !== 'object') {
    throw new Error('This file is not a Story Writer project.');
  }
  const raw = rawValue as Raw;

  let story: unknown[] = [];
  let ideas: unknown[] = [];

  if (Array.isArray(raw.storyBlocks) || Array.isArray(raw.ideaBlocks)) {
    story = Array.isArray(raw.storyBlocks) ? raw.storyBlocks : [];
    ideas = Array.isArray(raw.ideaBlocks) ? raw.ideaBlocks : [];
  } else if (Array.isArray(raw.blocks)) {
    const all = raw.blocks as Raw[];
    story = all.filter(b => asRecord(b).type !== 'idea');
    ideas = all.filter(b => asRecord(b).type === 'idea');
  } else {
    throw new Error('No blocks found in this file.');
  }

  return {
    storyBlocks: cleanBoard(story.map(b => normalizeBlock(b, 'story'))),
    ideaBlocks: cleanBoard(ideas.map(b => normalizeBlock(b, 'idea'))),
    variables: normalizeVariables(raw.variables),
    viewport: normalizeViewport(raw.viewport),
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : undefined,
    version: num(raw.version, 1)
  };
};

/**
 * Builds the file representation of the current state.
 * Minimized blocks are written the way older versions expect (height 64 + originalHeight),
 * so a file saved here still opens correctly in an older build.
 */
export const serializeProject = (
  state: Pick<AppState, 'storyBlocks' | 'ideaBlocks' | 'variables' | 'viewport'>
): ProjectData => {
  const forFile = (block: StoryBlock): StoryBlock =>
    block.isMinimized
      ? { ...block, height: BLOCK_DEFAULTS.legacyMinimizedHeight, originalHeight: block.height }
      : block;

  return {
    version: PROJECT_VERSION,
    storyBlocks: state.storyBlocks.map(forFile),
    ideaBlocks: state.ideaBlocks.map(forFile),
    variables: state.variables,
    viewport: state.viewport,
    timestamp: new Date().toISOString()
  };
};

export const createBlock = (type: BlockType, position: { x: number; y: number }): StoryBlock => {
  const isIdea = type === 'idea';
  const width = BLOCK_DEFAULTS.width;
  const height = isIdea ? BLOCK_DEFAULTS.ideaHeight : BLOCK_DEFAULTS.storyHeight;
  return {
    id: uid(),
    type,
    x: position.x - width / 2,
    y: position.y - height / 2,
    width,
    height,
    isMinimized: false,
    title: isIdea ? 'New Idea' : 'New Story Block',
    content: '',
    notes: createEmptyNotes(),
    color: isIdea ? COLORS[4] : COLORS[0],
    isBookmarked: false,
    connections: [],
    priority: isIdea ? 50 : 0,
    satisfaction: isIdea ? 0 : 50
  };
};

/** Height the block occupies on the canvas right now. */
export const renderedHeight = (block: StoryBlock): number =>
  block.isMinimized ? BLOCK_DEFAULTS.minimizedHeight : block.height;
