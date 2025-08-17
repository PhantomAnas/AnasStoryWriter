import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { StoryBlock } from '../types';
import { COLORS, NOTE_CATEGORIES } from '../constants';
import { getSatisfactionColor } from '../utils/textFormatting';

interface PropertiesPanelProps {
  selectedBlock: StoryBlock;
  blocks: StoryBlock[];
  onUpdateBlock: (id: string, updates: Partial<StoryBlock>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  blocks,
  onUpdateBlock
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'style'>('content');
  const isIdeaBlock = selectedBlock.type === 'idea';

  return (
    <div className="w-80 bg-black/30 backdrop-blur-md border-l border-white/10 overflow-y-auto">
      <div className="p-4 border-b border-white/10 bg-black/20">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {isIdeaBlock ? 'Idea' : 'Block'} Properties
        </h3>
        
        {/* Tab Navigation */}
        <div className="flex mt-3 bg-white/10 rounded-lg p-1">
          {['content', 'notes', 'style'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-500/30 text-blue-200 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Title</label>
              <input
                type="text"
                value={selectedBlock.title}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { title: e.target.value })}
                className="w-full bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Content</label>
              <div className="text-xs text-gray-400 mb-2">
                Use <code>-</code> for bullets, <code>*text*</code> for bold
              </div>
              <textarea
                value={selectedBlock.content}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { content: e.target.value })}
                className="w-full h-40 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white resize-y min-h-[100px]"
                placeholder={isIdeaBlock ? "Describe your idea..." : "Enter your story content..."}
              />
            </div>

            {/* Satisfaction Slider for Story Blocks */}
            {!isIdeaBlock && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Satisfaction</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedBlock.satisfaction}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { satisfaction: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)`
                    }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: getSatisfactionColor(selectedBlock.satisfaction) }}
                  />
                  <span className="text-xs text-gray-400 w-8">{selectedBlock.satisfaction}</span>
                </div>
              </div>
            )}

            {/* Priority Slider for Idea Blocks */}
            {isIdeaBlock && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Priority</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedBlock.priority}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { priority: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 w-8">{selectedBlock.priority}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
              <select
                value={selectedBlock.notes.category}
                onChange={(e) => onUpdateBlock(selectedBlock.id, {
                  notes: { ...selectedBlock.notes, category: e.target.value as any }
                })}
                className="w-full bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white"
              >
                {NOTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-gray-800">{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Special Notes</label>
              <textarea
                value={selectedBlock.notes.specialNotes}
                onChange={(e) => onUpdateBlock(selectedBlock.id, {
                  notes: { ...selectedBlock.notes, specialNotes: e.target.value }
                })}
                className="w-full h-24 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white resize-y min-h-[60px]"
                placeholder="Special notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                Plot Twist <span className="text-purple-400">⚡</span>
              </label>
              <textarea
                value={selectedBlock.notes.plotTwist}
                onChange={(e) => onUpdateBlock(selectedBlock.id, {
                  notes: { ...selectedBlock.notes, plotTwist: e.target.value }
                })}
                className="w-full h-24 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white resize-y min-h-[60px]"
                placeholder="Plot twist ideas..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                Plot Holes <span className="text-red-400">⚠</span>
              </label>
              <textarea
                value={selectedBlock.notes.plotHoles}
                onChange={(e) => onUpdateBlock(selectedBlock.id, {
                  notes: { ...selectedBlock.notes, plotHoles: e.target.value }
                })}
                className="w-full h-24 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white resize-y min-h-[60px]"
                placeholder="Plot holes to fix..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Inspiration</label>
              <textarea
                value={selectedBlock.notes.inspiration}
                onChange={(e) => onUpdateBlock(selectedBlock.id, {
                  notes: { ...selectedBlock.notes, inspiration: e.target.value }
                })}
                className="w-full h-24 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white resize-y min-h-[60px]"
                placeholder="Inspiration and references..."
              />
            </div>
          </div>
        )}

        {/* Style Tab */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">Border Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdateBlock(selectedBlock.id, { color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      selectedBlock.color === color ? 'border-white shadow-lg' : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ 
                      backgroundColor: color,
                      boxShadow: selectedBlock.color === color ? `0 0 15px ${color}40` : undefined
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Height</label>
              <input
                type="number"
                value={selectedBlock.height}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { height: parseInt(e.target.value) || 80 })}
                className="w-full bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-white"
                min="80"
              />
            </div>
          </div>
        )}

        {/* Connections Section */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium mb-3 text-gray-300">Connections</h4>
          <div className="text-xs text-gray-400 mb-2">
            Connected to: {selectedBlock.connections.length} blocks
          </div>
          <div className="space-y-2">
            {selectedBlock.connections.map(connId => {
              const connectedBlock = blocks.find(b => b.id === connId);
              return (
                <div key={connId} className="flex items-center justify-between bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
                  <span className="text-xs text-gray-200">{connectedBlock?.title || 'Unknown'}</span>
                  <button
                    onClick={() => onUpdateBlock(selectedBlock.id, {
                      connections: selectedBlock.connections.filter(id => id !== connId)
                    })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};