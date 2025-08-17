export interface StoryBlock {
  id: string;
  type: 'story' | 'idea';
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  title: string;
  content: string;
  notes: {
    specialNotes: string;
    plotTwist: string;
    plotHoles: string;
    inspiration: string;
    category: 'past' | 'villain_world' | 'hero_world';
  };
  color: string;
  isBookmarked: boolean;
  connections: string[];
  priority: number; // 0-100 for idea blocks
  satisfaction: number; // 0-100 for story blocks
  originalHeight?: number; // Store original height before minimizing
}

export interface Variable {
  id: string;
  name: string;
  value: string;
}

export interface AppState {
  currentTab: 'story' | 'ideas';
  storyBlocks: StoryBlock[];
  ideaBlocks: StoryBlock[];
  variables: Variable[];
  selectedBlock: string | null;
  draggedBlock: string | null;
  dragOffset: { x: number; y: number };
  isConnecting: boolean;
  connectionStart: string | null;
  showVariables: boolean;
  showProperties: boolean;
  showBookmarks: boolean;
  headerCollapsed: boolean;
  viewport: { x: number; y: number; zoom: number };
  isDraggingViewport: boolean;
  viewportDragStart: { x: number; y: number };
  resizingBlock: { id: string; startX: number; startY: number; startW: number; startH: number; } | null;
}

export interface ConnectionPoints {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}