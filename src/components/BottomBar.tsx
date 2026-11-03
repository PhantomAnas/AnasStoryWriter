import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
  Waves,
  Keyboard,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { BoardTab, Viewport } from '../types';

interface BottomBarProps {
  currentTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
  storyCount: number;
  ideaCount: number;
  viewport: Viewport;
  blocksCount: number;
  variablesCount: number;
  selectedBlockTitle?: string;
  isConnecting: boolean;
  lastAutosave: Date | null;
  showFlow: boolean;
  onToggleFlow: () => void;
  onMoveViewport: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetZoom: () => void;
  onShowHelp: () => void;
}

const navBtn = 'p-1.5 hover:bg-white/20 rounded-md transition-colors';

export const BottomBar: React.FC<BottomBarProps> = ({
  currentTab,
  onTabChange,
  storyCount,
  ideaCount,
  viewport,
  blocksCount,
  variablesCount,
  selectedBlockTitle,
  isConnecting,
  lastAutosave,
  showFlow,
  onToggleFlow,
  onMoveViewport,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetZoom,
  onShowHelp
}) => {
  const truncated =
    selectedBlockTitle && selectedBlockTitle.length > 30 ? `${selectedBlockTitle.slice(0, 30)}…` : selectedBlockTitle;

  return (
    <footer className="bg-black/40 backdrop-blur-md px-3 py-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
      {/* Status */}
      <div className="text-xs text-gray-400 flex items-center gap-3 min-w-0">
        {isConnecting ? (
          <span className="text-yellow-300 animate-pulse">Click a block to connect to it · Esc cancels</span>
        ) : (
          <span className="truncate">
            {blocksCount} block{blocksCount === 1 ? '' : 's'} · {variablesCount} variable{variablesCount === 1 ? '' : 's'}
            {truncated && (
              <>
                {' · '}
                <span className="text-gray-200">{truncated}</span>
              </>
            )}
          </span>
        )}
        {lastAutosave && (
          <span className="hidden sm:inline text-gray-500" title="Autosaved to this browser. Use Save to download a file you own.">
            Autosaved {lastAutosave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Board switcher */}
      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/15 shadow-md">
        <button
          onClick={() => onTabChange('story')}
          className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1.5 ${
            currentTab === 'story'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Story board (1)"
        >
          <BookOpen size={14} /> Story <span className="opacity-75">({storyCount})</span>
        </button>
        <button
          onClick={() => onTabChange('ideas')}
          className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1.5 ${
            currentTab === 'ideas'
              ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Ideas board (2)"
        >
          <Lightbulb size={14} /> Ideas <span className="opacity-75">({ideaCount})</span>
        </button>
      </div>

      {/* View controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15">
          <button onClick={() => onMoveViewport('left')} className={navBtn} title="Pan left (←)">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => onMoveViewport('up')} className={navBtn} title="Pan up (↑)">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => onMoveViewport('down')} className={navBtn} title="Pan down (↓)">
            <ChevronDown size={14} />
          </button>
          <button onClick={() => onMoveViewport('right')} className={navBtn} title="Pan right (→)">
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15">
          <button onClick={onZoomOut} className={navBtn} title="Zoom out (-)">
            <ZoomOut size={14} />
          </button>
          <button
            onClick={onResetZoom}
            className="text-xs text-gray-200 px-1.5 min-w-[48px] text-center hover:bg-white/20 rounded-md py-1 transition-colors"
            title="Reset zoom to 100% (0)"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>
          <button onClick={onZoomIn} className={navBtn} title="Zoom in (+)">
            <ZoomIn size={14} />
          </button>
          <button onClick={onFit} className={`${navBtn} border-l border-white/10 rounded-l-none`} title="Fit all blocks in view (F)">
            <Maximize size={14} />
          </button>
        </div>

        <button
          onClick={onToggleFlow}
          className={`p-1.5 rounded-lg border transition-colors ${
            showFlow ? 'bg-blue-500/30 border-blue-400/40 text-blue-100' : 'bg-white/10 border-white/15 text-gray-400 hover:text-white'
          }`}
          title={showFlow ? 'Flow animation on connections: on' : 'Flow animation on connections: off'}
        >
          <Waves size={14} />
        </button>

        <button
          onClick={onShowHelp}
          className="p-1.5 rounded-lg border bg-white/10 border-white/15 text-gray-400 hover:text-white transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={14} />
        </button>
      </div>
    </footer>
  );
};
