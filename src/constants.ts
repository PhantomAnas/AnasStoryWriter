import { NoteCategory, Variable } from './types';

export const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F43F5E', // rose
  '#A855F7', // violet
  '#0EA5E9', // sky
  '#22C55E', // emerald
  '#FB923C', // orange-400
  '#64748B'  // slate
];

export const NOTE_CATEGORIES: ReadonlyArray<{ value: NoteCategory; label: string }> = [
  { value: 'past', label: 'Past' },
  { value: 'villain_world', label: 'Villain World' },
  { value: 'hero_world', label: 'Hero World' }
];

export const BLOCK_DEFAULTS = {
  width: 280,
  storyHeight: 160,
  ideaHeight: 70,
  minWidth: 180,
  minHeight: 56,
  /** Rendered height of a minimized block (header only). */
  minimizedHeight: 44,
  /** Height older versions of the app used to mark a block as minimized. Kept for file compatibility. */
  legacyMinimizedHeight: 64
} as const;

export const ZOOM = { min: 0.1, max: 3, step: 0.1 } as const;

export const PAN_STEP = 200;

export const HISTORY_LIMIT = 100;

export const AUTOSAVE_KEY = 'story-writer:autosave';
export const UI_PREFS_KEY = 'story-writer:ui';

export const DEFAULT_VARIABLES: Variable[] = [
  { id: '1', name: 'x', value: 'Alex' },
  { id: '2', name: 'antagonist', value: 'Dr. Shadow' }
];

/** Current project file version. Files without it are treated as version 1. */
export const PROJECT_VERSION = 2;
