export type BlockType = 'story' | 'idea';
export type BoardTab = 'story' | 'ideas';
export type NoteCategory = 'past' | 'villain_world' | 'hero_world';

export interface BlockNotes {
  specialNotes: string;
  plotTwist: string;
  plotHoles: string;
  inspiration: string;
  category: NoteCategory;
}

export interface StoryBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  /** Expanded height. When `isMinimized` is true the block renders as a header-only strip instead. */
  height: number;
  isMinimized: boolean;
  title: string;
  content: string;
  notes: BlockNotes;
  color: string;
  isBookmarked: boolean;
  /** Ids of blocks this block points to (outgoing arrows). */
  connections: string[];
  /** 0-100, used by idea blocks. */
  priority: number;
  /** 0-100, used by story blocks. */
  satisfaction: number;
  /** Legacy field: older files stored the pre-minimize height here. Kept for compatibility. */
  originalHeight?: number;
}

export interface Variable {
  id: string;
  name: string;
  value: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** Shape of a saved project file. */
export interface ProjectData {
  storyBlocks: StoryBlock[];
  ideaBlocks: StoryBlock[];
  variables: Variable[];
  viewport: Viewport;
  timestamp?: string;
  version?: number;
}

export interface ConnectionRef {
  from: string;
  to: string;
}

export interface AppState {
  currentTab: BoardTab;
  storyBlocks: StoryBlock[];
  ideaBlocks: StoryBlock[];
  variables: Variable[];
  viewport: Viewport;
  selectedBlock: string | null;
  selectedConnection: ConnectionRef | null;
  isConnecting: boolean;
  connectionStart: string | null;
  showVariables: boolean;
  showProperties: boolean;
  showBookmarks: boolean;
  headerCollapsed: boolean;
  /** Animated "current" flowing along connection lines. */
  showFlow: boolean;
  /** Block that should flash briefly (after navigating to it). */
  flashBlockId: string | null;
}

export interface Point {
  x: number;
  y: number;
}
