import React from 'react';
import {
  Bookmark,
  BookmarkPlus,
  X,
  Trash2,
  Minimize2,
  Maximize2,
  Copy,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { BoardTab, StoryBlock as StoryBlockType } from '../types';
import { formatText, hasPlotTwist, hasPlotHole, getSatisfactionColor } from '../utils/textFormatting';
import { renderedHeight } from '../utils/project';
import { NOTE_CATEGORIES } from '../constants';

interface StoryBlockProps {
  block: StoryBlockType;
  currentTab: BoardTab;
  isSelected: boolean;
  isDragged: boolean;
  isConnecting: boolean;
  connectionStart: string | null;
  isFlashing: boolean;
  replaceVariables: (text: string) => string;
  onDragStart: (e: React.PointerEvent<HTMLDivElement>, blockId: string) => void;
  onClick: (e: React.MouseEvent, blockId: string) => void;
  onUpdateBlock: (id: string, updates: Partial<StoryBlockType>) => void;
  onDeleteBlock: (id: string) => void;
  onConnectDragStart: (e: React.PointerEvent, blockId: string) => void;
  onCancelConnection: () => void;
  onToggleMinimized: (blockId: string) => void;
  onResizeStart: (e: React.PointerEvent, blockId: string) => void;
  onCloneIdea?: (ideaId: string) => void;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

export const StoryBlock: React.FC<StoryBlockProps> = ({
  block,
  currentTab,
  isSelected,
  isDragged,
  isConnecting,
  connectionStart,
  isFlashing,
  replaceVariables,
  onDragStart,
  onClick,
  onUpdateBlock,
  onDeleteBlock,
  onConnectDragStart,
  onCancelConnection,
  onToggleMinimized,
  onResizeStart,
  onCloneIdea
}) => {
  const isIdea = block.type === 'idea';
  const isSource = isConnecting && connectionStart === block.id;
  const isTarget = isConnecting && connectionStart !== block.id;
  const showPlotTwist = hasPlotTwist(block);
  const showPlotHole = hasPlotHole(block);
  const height = renderedHeight(block);
  const categoryLabel = NOTE_CATEGORIES.find(c => c.value === block.notes.category)?.label ?? '';

  const iconButton =
    'p-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

  return (
    <div
      data-block-id={block.id}
      className={`
        group absolute rounded-xl select-none backdrop-blur-md bg-slate-950/60
        ${isDragged ? 'cursor-grabbing transition-none' : 'cursor-grab transition-shadow duration-200'}
        ${isTarget ? 'cursor-crosshair hover:ring-2 hover:ring-green-400' : ''}
        ${isSource ? 'ring-2 ring-yellow-400 animate-pulse-strong' : ''}
        ${isFlashing ? 'flash-bookmark' : ''}
      `}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height,
        display: 'flex',
        flexDirection: 'column',
        border: isIdea ? `2px solid ${block.color}` : '1px solid rgba(255, 255, 255, 0.18)',
        borderTop: isIdea ? `2px solid ${block.color}` : `4px solid ${block.color}`,
        boxShadow: isSelected
          ? `0 0 0 2px rgba(255,255,255,0.85), 0 0 28px ${block.color}66, 0 20px 25px -5px rgb(0 0 0 / 0.5)`
          : '0 15px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
        zIndex: isSelected ? 20 : isDragged ? 15 : 10,
        opacity: isDragged ? 0.9 : 1
      }}
      onPointerDown={e => onDragStart(e, block.id)}
      onClick={e => onClick(e, block.id)}
    >
      {/* Header */}
      <div
        className={`px-2 py-1.5 flex items-center justify-between gap-1 bg-black/25 rounded-t-xl ${
          block.isMinimized ? 'h-full' : 'border-b border-white/10'
        }`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-shrink-0">
            {isIdea ? (
              <Lightbulb size={13} className="text-yellow-400" aria-label="Idea" />
            ) : (
              <CheckCircle
                size={13}
                style={{ color: getSatisfactionColor(block.satisfaction) }}
                aria-label={`Satisfaction ${block.satisfaction}%`}
              />
            )}
            {showPlotTwist && <Zap size={12} className="text-purple-400" aria-label="Has a plot twist" />}
            {showPlotHole && <AlertTriangle size={12} className="text-red-400" aria-label="Has plot holes" />}
          </div>

          <button
            onPointerDown={stop}
            onClick={e => {
              e.stopPropagation();
              onUpdateBlock(block.id, { isBookmarked: !block.isBookmarked });
            }}
            className={`${iconButton} ${block.isBookmarked ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'} hover:bg-yellow-500/20`}
            title={block.isBookmarked ? 'Remove bookmark' : 'Bookmark this block'}
          >
            {block.isBookmarked ? <Bookmark size={12} fill="currentColor" /> : <BookmarkPlus size={12} />}
          </button>

          <input
            type="text"
            value={block.title}
            placeholder={isIdea ? 'Idea title' : 'Scene title'}
            onChange={e => onUpdateBlock(block.id, { title: e.target.value })}
            onPointerDown={stop}
            onClick={stop}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
            }}
            className="bg-transparent text-sm font-semibold flex-1 min-w-0 outline-none focus:bg-white/15 rounded px-1.5 py-0.5 transition-colors placeholder:text-gray-500 cursor-text"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {isIdea && currentTab === 'ideas' && onCloneIdea && (
            <button
              onPointerDown={stop}
              onClick={e => {
                e.stopPropagation();
                onCloneIdea(block.id);
              }}
              className={`${iconButton} text-green-400 hover:bg-green-500/20`}
              title="Place a copy on the Story board"
            >
              <Copy size={12} />
            </button>
          )}

          <button
            onPointerDown={stop}
            onClick={e => {
              e.stopPropagation();
              onToggleMinimized(block.id);
            }}
            className={`${iconButton} text-gray-400 hover:bg-white/15`}
            title={block.isMinimized ? 'Expand (M)' : 'Minimize (M)'}
          >
            {block.isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>

          <button
            onPointerDown={e => {
              e.stopPropagation();
              if (isSource) return;
              onConnectDragStart(e, block.id);
            }}
            onClick={e => {
              e.stopPropagation();
              if (isSource) onCancelConnection();
            }}
            className={`${iconButton} ${
              isSource ? 'text-yellow-300 bg-yellow-500/25' : 'text-blue-300 hover:bg-blue-500/25'
            }`}
            title={isSource ? 'Cancel connection (Esc)' : 'Connect: click, then click another block. Or drag to it.'}
          >
            {isSource ? <X size={12} /> : <ArrowRight size={12} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!block.isMinimized && (
        <div className="px-3 py-2 flex-1 min-h-0 flex flex-col">
          {block.content ? (
            <div
              className="text-xs text-gray-300 leading-relaxed flex-1 min-h-0 overflow-y-auto modern-scrollbar pr-1"
              dangerouslySetInnerHTML={{ __html: formatText(replaceVariables(block.content)) }}
            />
          ) : (
            <div className="text-xs text-gray-500 italic">
              {isIdea ? 'No details yet' : 'No content yet. Write in the Properties panel.'}
            </div>
          )}
          {!isIdea && categoryLabel && (
            <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-500 flex-shrink-0 truncate">
              {categoryLabel}
            </div>
          )}
        </div>
      )}

      {/* Progress strip along the bottom edge */}
      {!block.isMinimized && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 rounded-b-xl overflow-hidden"
          title={isIdea ? `Priority ${block.priority}%` : `Satisfaction ${block.satisfaction}%`}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${isIdea ? block.priority : block.satisfaction}%`,
              background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)',
              opacity: 0.85
            }}
          />
        </div>
      )}

      {/* Connection port: drag from here onto another block */}
      <button
        onPointerDown={e => {
          e.stopPropagation();
          onConnectDragStart(e, block.id);
        }}
        onClick={stop}
        className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 bg-slate-900 transition-all duration-150
          ${isSource
            ? 'border-yellow-400 bg-yellow-400/40 opacity-100 scale-110'
            : 'border-blue-400 opacity-50 group-hover:opacity-100 hover:scale-125 hover:bg-blue-500/40'}
          ${isSelected ? 'opacity-100' : ''}`}
        style={{ cursor: 'crosshair', zIndex: 2 }}
        title="Drag to another block to connect"
        aria-label="Connection port"
      />

      {/* Resize handle */}
      {!block.isMinimized && (
        <div
          onPointerDown={e => onResizeStart(e, block.id)}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
          title="Drag to resize"
        >
          <svg viewBox="0 0 16 16" className="w-full h-full text-gray-300">
            <path d="M15 1 L1 15 M15 7 L7 15 M15 12 L12 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}

      {/* Delete */}
      {isSelected && !isConnecting && (
        <button
          onPointerDown={stop}
          onClick={e => {
            e.stopPropagation();
            onDeleteBlock(block.id);
          }}
          className="absolute -top-2.5 -left-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-transform duration-150 hover:scale-110"
          title="Delete block (Del). Undo with Ctrl+Z."
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};
