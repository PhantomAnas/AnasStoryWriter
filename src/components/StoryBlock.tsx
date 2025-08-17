import React, { useEffect, useState } from 'react';
import { Bookmark, BookmarkPlus, X, Trash2, Minimize2, Maximize2, Copy, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { StoryBlock as StoryBlockType } from '../types';
import { formatText, hasPlotTwist, hasPlotHole, getSatisfactionColor, getPriorityColor } from '../utils/textFormatting';

interface StoryBlockProps {
  block: StoryBlockType;
  currentTab: 'story' | 'ideas';
  isSelected: boolean;
  isDragged: boolean;
  isConnecting: boolean;
  connectionStart: string | null;
  replaceVariables: (text: string) => string;
  onMouseDown: (e: React.MouseEvent, blockId: string) => void;
  onClick: (e: React.MouseEvent, blockId: string) => void;
  onUpdateBlock: (id: string, updates: Partial<StoryBlockType>) => void;
  onDeleteBlock: (id: string) => void;
  onStartConnection: (blockId: string) => void;
  onCancelConnection: () => void;
  onToggleMinimized: (blockId: string) => void;
  onCloneIdea?: (ideaId: string) => void;
}

export const StoryBlock: React.FC<StoryBlockProps> = ({
  block,
  currentTab,
  isSelected,
  isDragged,
  isConnecting,
  connectionStart,
  replaceVariables,
  onMouseDown,
  onClick,
  onUpdateBlock,
  onDeleteBlock,
  onStartConnection,
  onCancelConnection,
  onToggleMinimized,
  onCloneIdea
}) => {
  const [isFlashing, setIsFlashing] = useState(false);

  // Flash effect when navigating to bookmark
  useEffect(() => {
    const element = document.querySelector(`[data-block-id="${block.id}"]`);
    if (element && element.classList.contains('flash-bookmark')) {
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        element.classList.remove('flash-bookmark');
      }, 1000);
    }
  }, [block.id]);

  const isIdeaBlock = block.type === 'idea';
  const showMinimized = false; // Remove auto-minimize logic
  const showPlotTwist = hasPlotTwist(block);
  const showPlotHole = hasPlotHole(block);
  const isMinimized = block.height === 64; // Check if minimized

  return (
    <div
      data-block-id={block.id}
      className={`
        absolute bg-black/40 backdrop-blur-md rounded-xl shadow-2xl cursor-move select-none border transition-all duration-300
        ${!isDragged ? 'transition-all duration-200' : 'transition-none'}
        ${isSelected ? 'shadow-blue-500/50 !border-blue-400 shadow-2xl' : 'border-white/20'}
        ${isConnecting && connectionStart === block.id ? 'animate-pulse-strong !border-yellow-400' : ''}
        ${isConnecting && connectionStart !== block.id ? 'hover:!border-green-400' : ''}
        ${isFlashing ? 'animate-pulse !border-yellow-300 !shadow-yellow-300/50' : ''}
        ${showMinimized ? 'opacity-75 hover:opacity-100' : ''}
      `}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        display: 'flex',
        flexDirection: 'column',
        border: isIdeaBlock 
          ? `3px solid ${block.color}`
          : `1px solid rgba(255, 255, 255, 0.2)`,
        borderTop: isIdeaBlock 
          ? `3px solid ${block.color}`
          : `4px solid ${block.color}`,
        boxShadow: isSelected 
          ? `0 0 30px ${block.color}50, 0 20px 25px -5px rgb(0 0 0 / 0.5)` 
          : `0 15px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)`,
        zIndex: isSelected ? 20 : isDragged ? 15 : 10,
        pointerEvents: isDragged ? 'none' : 'auto'
      }}
      onMouseDown={(e) => {
        // Don't handle mousedown if it's on a button
        if (e.target.closest('button')) {
          return;
        }
        if (!isConnecting) {
          e.preventDefault();
          onMouseDown(e, block.id);
        }
      }}
      onClick={(e) => onClick(e, block.id)}
    >
      {/* Block Header */}
      <div className="p-3 border-b border-white/20 flex items-center justify-between bg-black/20 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status Indicators */}
          <div className="flex items-center gap-1">
            {isIdeaBlock && (
              <Lightbulb size={12} className="text-yellow-400" />
            )}
            {!isIdeaBlock && (
              <CheckCircle 
                size={12} 
                style={{ color: getSatisfactionColor(block.satisfaction) }}
              />
            )}
            {showPlotTwist && (
              <span className="text-xs text-purple-400" title="Plot Twist">⚡</span>
            )}
            {showPlotHole && (
              <AlertTriangle size={10} className="text-red-400" title="Plot Hole" />
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateBlock(block.id, { isBookmarked: !block.isBookmarked });
            }}
            className={`p-1 rounded-md transition-colors ${
              block.isBookmarked ? 'text-yellow-400' : 'text-gray-400'
            } hover:bg-yellow-500/20`}
            title={block.isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
          >
            {block.isBookmarked ? <Bookmark size={12} fill="currentColor" /> : <BookmarkPlus size={12} />}
          </button>
          
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdateBlock(block.id, { title: e.target.value })}
            className="bg-transparent text-sm font-semibold flex-1 min-w-0 outline-none focus:bg-white/20 rounded px-2 py-1 transition-colors"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {/* Clone Idea Button (only for idea blocks in ideas tab) */}
          {isIdeaBlock && currentTab === 'ideas' && onCloneIdea && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloneIdea(block.id);
              }}
              className="p-1 rounded-md text-green-400 hover:bg-green-500/20 transition-colors"
              title="Clone to Story"
            >
              <Copy size={12} />
            </button>
          )}
          
          {/* Minimize/Maximize Button */}
          {block.type === 'story' && (
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (isMinimized) {
                  // It's minimized, restore to original height or default to 160
                  const restoreHeight = block.originalHeight || 160;
                  onUpdateBlock(block.id, { height: restoreHeight });
                } else {
                  // It's normal, minimize to 64 and save current height
                  onUpdateBlock(block.id, { 
                    originalHeight: block.height,
                    height: 64 
                  });
                }
              }}
              className="p-1 rounded-md text-gray-400 hover:bg-gray-500/20 transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 999,
                position: 'relative'
              }}
            >
              {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
          )}
          
          {/* Connection Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isConnecting && connectionStart === block.id) {
                onCancelConnection();
              } else {
                onStartConnection(block.id);
              }
            }}
            className={`p-1 rounded-md transition-colors ${
              isConnecting && connectionStart === block.id
                ? 'text-yellow-400 bg-yellow-500/20'
                : 'text-blue-400 hover:bg-blue-500/20'
            }`}
            title={
              isConnecting && connectionStart === block.id
                ? 'Cancel connection'
                : 'Connect to another block'
            }
          >
            {isConnecting && connectionStart === block.id ? <X size={12} /> : <span className="text-xs">→</span>}
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-3 flex-1 overflow-hidden flex flex-col">
        {isMinimized ? (
          // Don't show any content when minimized
          null
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Content area - show formatted preview only */}
            {block.type === 'story' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                {block.content ? (
                  <div 
                    className="text-xs text-gray-300 leading-relaxed h-full overflow-y-auto modern-scrollbar"
                    dangerouslySetInnerHTML={{ 
                      __html: formatText(replaceVariables(block.content))
                        .replace(/\n/g, '<br>')
                    }} 
                  />
                ) : (
                  <div className="text-xs text-gray-500 italic">No content yet...</div>
                )}
              </div>
            )}
            
            {/* Priority display for idea blocks in IDEAS tab only */}
            {isIdeaBlock && currentTab === 'ideas' && (
              <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Priority:</span>
                  <div className="flex-1 h-1 bg-gray-600 rounded-lg relative">
                    <div 
                      className="h-full rounded-lg"
                      style={{
                        width: `${block.priority}%`,
                        backgroundColor: getPriorityColor(block.priority)
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{block.priority}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Priority progress bar for ALL idea blocks */}
      {isIdeaBlock && !isMinimized && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50 rounded-b-xl overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{
              width: `${block.priority}%`,
              background: `linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)`,
              opacity: 0.8
            }}
          />
        </div>
      )}

      {/* Delete Button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};