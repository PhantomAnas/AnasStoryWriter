import React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';

interface BottomBarProps {
  currentTab: 'story' | 'ideas';
  onTabChange: (tab: 'story' | 'ideas') => void;
  totalStoryBlocks: number;
  totalIdeaBlocks: number;
  viewport: { x: number; y: number; zoom: number };
  blocksCount: number;
  variablesCount: number;
  selectedBlockTitle?: string;
  isConnecting: boolean;
  onMoveViewport: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  currentTab,
  onTabChange,
  totalStoryBlocks,
  totalIdeaBlocks,
  viewport,
  blocksCount,
  variablesCount,
  selectedBlockTitle,
  isConnecting,
  onMoveViewport,
  onZoomIn,
  onZoomOut
}) => {
  return (
    <div className="bg-black/40 backdrop-blur-md px-4 py-3 border-t border-white/10 flex items-center justify-between">
      {/* Left - Info Block */}
      <div className="text-xs text-gray-400">
        {isConnecting ? (
          <span className="text-blue-400 animate-pulse">Click on a block to connect to it...</span>
        ) : (
          <span>
            {blocksCount} blocks | {variablesCount} variables{selectedBlockTitle && ` | Selected: ${selectedBlockTitle.length > 30 ? selectedBlockTitle.substring(0, 30) + '...' : selectedBlockTitle}`}
          </span>
        )}
      </div>

      {/* Center - Title and Tab Switcher in SAME ROW */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Story Editor
        </h1>
        <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1.5 border border-white/20 shadow-lg">
          <button
            onClick={() => onTabChange('story')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm ${
              currentTab === 'story' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Story ({totalStoryBlocks})
          </button>
          <button
            onClick={() => onTabChange('ideas')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm ${
              currentTab === 'ideas' 
                ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg transform scale-105' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Ideas {currentTab === 'ideas' ? `(${totalIdeaBlocks})` : ''}
          </button>
        </div>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
          <button
            onClick={() => onMoveViewport('up')}
            className="p-2 hover:bg-white/20 rounded transition-all duration-200"
            title="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => onMoveViewport('left')}
            className="p-2 hover:bg-white/20 rounded transition-all duration-200"
            title="Move left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => onMoveViewport('down')}
            className="p-2 hover:bg-white/20 rounded transition-all duration-200"
            title="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => onMoveViewport('right')}
            className="p-2 hover:bg-white/20 rounded transition-all duration-200"
            title="Move right"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
          <button
            onClick={onZoomOut}
            className="p-1 hover:bg-white/20 rounded transition-all duration-200"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-gray-300 px-2 min-w-[50px] text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1 hover:bg-white/20 rounded transition-all duration-200"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Viewport Position */}
        <div className="text-xs text-gray-400">
          ({Math.round(viewport.x)}, {Math.round(viewport.y)})
        </div>
      </div>
    </div>
  );
};