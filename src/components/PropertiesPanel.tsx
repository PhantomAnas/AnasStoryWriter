import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Crosshair, Minimize2, Maximize2, Trash2, X, MousePointerClick } from 'lucide-react';
import { StoryBlock } from '../types';
import { BLOCK_DEFAULTS, COLORS, NOTE_CATEGORIES } from '../constants';
import { getSatisfactionColor, getPriorityColor } from '../utils/textFormatting';

interface PropertiesPanelProps {
  selectedBlock: StoryBlock | undefined;
  blocks: StoryBlock[];
  onUpdateBlock: (id: string, updates: Partial<StoryBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onRemoveConnection: (from: string, to: string) => void;
  onGoToBlock: (id: string) => void;
  onToggleMinimized: (id: string) => void;
  onStartConnection: (id: string) => void;
  onClose: () => void;
}

type Tab = 'content' | 'notes' | 'style';

const field =
  'w-full bg-white/10 px-3 py-2 rounded-lg border border-white/15 focus:border-blue-400 focus:outline-none transition-colors text-white text-sm';
const textarea = `${field} resize-y min-h-[60px] leading-relaxed`;

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  blocks,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onRemoveConnection,
  onGoToBlock,
  onToggleMinimized,
  onStartConnection,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('content');

  const header = (title: string) => (
    <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-2">
      <h3 className="text-base font-semibold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent truncate">
        {title}
      </h3>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Hide panel (P)"
      >
        <X size={16} />
      </button>
    </div>
  );

  if (!selectedBlock) {
    return (
      <aside className="w-80 flex-shrink-0 bg-black/30 backdrop-blur-md border-l border-white/10 flex flex-col">
        {header('Properties')}
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="text-gray-400 text-sm">
            <MousePointerClick size={28} className="mx-auto mb-3 text-gray-500" />
            Select a block to edit its content, notes, and style.
            <div className="mt-3 text-xs text-gray-500">Double-click the board to add one.</div>
          </div>
        </div>
      </aside>
    );
  }

  const block = selectedBlock;
  const isIdea = block.type === 'idea';
  const incoming = blocks.filter(b => b.connections.includes(block.id));
  const outgoing = block.connections
    .map(id => blocks.find(b => b.id === id))
    .filter((b): b is StoryBlock => Boolean(b));

  const updateNotes = (patch: Partial<StoryBlock['notes']>) =>
    onUpdateBlock(block.id, { notes: { ...block.notes, ...patch } });

  return (
    <aside className="w-80 flex-shrink-0 bg-black/30 backdrop-blur-md border-l border-white/10 flex flex-col min-h-0">
      {header(isIdea ? 'Idea' : 'Scene')}

      <div className="px-4 pt-3">
        <div className="flex bg-white/10 rounded-lg p-1">
          {(['content', 'notes', 'style'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500/30 text-blue-100 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'notes' && (block.notes.plotTwist.trim() || block.notes.plotHoles.trim()) ? ' •' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-5">
        {activeTab === 'content' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-400">Title</label>
              <input
                type="text"
                value={block.title}
                onChange={e => onUpdateBlock(block.id, { title: e.target.value })}
                className={field}
                placeholder={isIdea ? 'Idea title' : 'Scene title'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">Content</label>
                <span className="text-[11px] text-gray-500">
                  <code className="text-gray-400">*bold*</code> · <code className="text-gray-400">- bullet</code>
                </span>
              </div>
              <textarea
                value={block.content}
                onChange={e => onUpdateBlock(block.id, { content: e.target.value })}
                className={`${textarea} h-56`}
                placeholder={isIdea ? 'Describe your idea...' : 'What happens in this scene?'}
              />
            </div>

            {!isIdea ? (
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-400">
                  Satisfaction <span className="text-gray-500">· how happy you are with this scene</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={block.satisfaction}
                    onChange={e => onUpdateBlock(block.id, { satisfaction: parseInt(e.target.value, 10) })}
                    className="flex-1 satisfaction-range"
                  />
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0"
                    style={{ backgroundColor: getSatisfactionColor(block.satisfaction) }}
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">{block.satisfaction}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-400">Priority</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={block.priority}
                    onChange={e => onUpdateBlock(block.id, { priority: parseInt(e.target.value, 10) })}
                    className="flex-1 satisfaction-range"
                  />
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0"
                    style={{ backgroundColor: getPriorityColor(block.priority) }}
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">{block.priority}</span>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'notes' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-400">Category</label>
              <select
                value={block.notes.category}
                onChange={e => updateNotes({ category: e.target.value as StoryBlock['notes']['category'] })}
                className={field}
              >
                {NOTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-gray-800">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-400">Special notes</label>
              <textarea
                value={block.notes.specialNotes}
                onChange={e => updateNotes({ specialNotes: e.target.value })}
                className={`${textarea} h-24`}
                placeholder="Anything to remember about this scene..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-400">
                Plot twist <span className="text-purple-400">⚡</span>
                <span className="text-gray-500"> · shows a badge on the block</span>
              </label>
              <textarea
                value={block.notes.plotTwist}
                onChange={e => updateNotes({ plotTwist: e.target.value })}
                className={`${textarea} h-24`}
                placeholder="Plot twist ideas..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-400">
                Plot holes <span className="text-red-400">⚠</span>
                <span className="text-gray-500"> · clear it once resolved</span>
              </label>
              <textarea
                value={block.notes.plotHoles}
                onChange={e => updateNotes({ plotHoles: e.target.value })}
                className={`${textarea} h-24`}
                placeholder="Problems to fix..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-400">Inspiration</label>
              <textarea
                value={block.notes.inspiration}
                onChange={e => updateNotes({ inspiration: e.target.value })}
                className={`${textarea} h-24`}
                placeholder="References, sources, moods..."
              />
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-2 text-gray-400">Accent color</label>
              <div className="grid grid-cols-8 gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdateBlock(block.id, { color })}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                      block.color === color ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color, boxShadow: block.color === color ? `0 0 12px ${color}80` : undefined }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-400">Width</label>
                <input
                  type="number"
                  value={block.width}
                  min={BLOCK_DEFAULTS.minWidth}
                  onChange={e =>
                    onUpdateBlock(block.id, {
                      width: Math.max(BLOCK_DEFAULTS.minWidth, parseInt(e.target.value, 10) || BLOCK_DEFAULTS.minWidth)
                    })
                  }
                  className={field}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-400">Height</label>
                <input
                  type="number"
                  value={block.height}
                  min={BLOCK_DEFAULTS.minHeight}
                  onChange={e =>
                    onUpdateBlock(block.id, {
                      height: Math.max(BLOCK_DEFAULTS.minHeight, parseInt(e.target.value, 10) || BLOCK_DEFAULTS.minHeight)
                    })
                  }
                  className={field}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 -mt-2">You can also drag the bottom-right corner of a block.</p>

            <button
              onClick={() => onToggleMinimized(block.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm border border-white/10 transition-colors"
            >
              {block.isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              {block.isMinimized ? 'Expand block' : 'Minimize to header'}
            </button>
          </>
        )}

        {/* Connections */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Connections</h4>
            <button
              onClick={() => onStartConnection(block.id)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 transition-colors"
              title="Then click the block it should lead to"
            >
              <Crosshair size={12} /> Connect
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] text-gray-500 flex items-center gap-1">
              <ArrowRight size={11} /> Leads to {outgoing.length === 0 && <span className="italic">nothing yet</span>}
            </div>
            {outgoing.map(target => (
              <div
                key={target.id}
                className="flex items-center justify-between bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 gap-2"
              >
                <button
                  onClick={() => onGoToBlock(target.id)}
                  className="text-xs text-gray-200 hover:text-white truncate text-left flex-1 flex items-center gap-2"
                  title="Go to block"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: target.color }} />
                  <span className="truncate">{target.title || 'Untitled'}</span>
                </button>
                <button
                  onClick={() => onRemoveConnection(block.id, target.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-colors flex-shrink-0"
                  title="Remove connection"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            {incoming.length > 0 && (
              <>
                <div className="text-[11px] text-gray-500 flex items-center gap-1 pt-1">
                  <ArrowLeft size={11} /> Comes from
                </div>
                {incoming.map(source => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 gap-2"
                  >
                    <button
                      onClick={() => onGoToBlock(source.id)}
                      className="text-xs text-gray-300 hover:text-white truncate text-left flex-1 flex items-center gap-2"
                      title="Go to block"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} />
                      <span className="truncate">{source.title || 'Untitled'}</span>
                    </button>
                    <button
                      onClick={() => onRemoveConnection(source.id, block.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-colors flex-shrink-0"
                      title="Remove connection"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-white/10 flex gap-2">
          <button
            onClick={() => onDuplicateBlock(block.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm border border-white/10 transition-colors"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            onClick={() => onDeleteBlock(block.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg text-sm border border-red-500/30 transition-colors"
            title="Delete (Del). Undo with Ctrl+Z."
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </aside>
  );
};
