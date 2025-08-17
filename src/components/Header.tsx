import React, { useEffect } from 'react';
import { Plus, Save, Upload, X, Menu, Navigation, ChevronUp, ChevronDown } from 'lucide-react';
import { StoryBlock } from '../types';

interface HeaderProps {
  currentTab: 'story' | 'ideas';
  onTabChange: (tab: 'story' | 'ideas') => void;
  onCreateBlock: () => void;
  onCloneIdea?: (ideaId: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onToggleVariables: () => void;
  onToggleProperties: () => void;
  showVariables: boolean;
  showProperties: boolean;
  showBookmarks: boolean;
  onToggleBookmarks: () => void;
  bookmarkedBlocks: StoryBlock[];
  onGoToBookmark: (blockId: string) => void;
  headerCollapsed: boolean;
  onToggleHeader: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  blocks: StoryBlock[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onCreateBlock,
  onCloneIdea,
  onSave,
  onLoad,
  onToggleVariables,
  onToggleProperties,
  showVariables,
  showProperties,
  showBookmarks,
  onToggleBookmarks,
  bookmarkedBlocks,
  onGoToBookmark,
  headerCollapsed,
  onToggleHeader,
  fileInputRef,
  blocks
}) => {
  // Flash effect for bookmarked blocks
  useEffect(() => {
    if (showBookmarks) {
      bookmarkedBlocks.forEach(block => {
        const element = document.querySelector(`[data-block-id="${block.id}"]`);
        if (element) {
          element.classList.add('neon-border');
        }
      });
    } else {
      bookmarkedBlocks.forEach(block => {
        const element = document.querySelector(`[data-block-id="${block.id}"]`);
        if (element) {
          element.classList.remove('neon-border');
        }
      });
    }
  }, [showBookmarks, bookmarkedBlocks]);

  const totalStoryBlocks = blocks.filter(b => b.type === 'story').length;
  
  // Count ideas differently based on current tab
  const totalIdeaBlocks = currentTab === 'ideas' 
    ? blocks.filter(b => b.type === 'idea' && b.id.startsWith('idea-')).length
    : 0; // Don't show idea count in story tab since they're mixed in

  return (
    <>
      {/* Main Header - Only show when not collapsed */}
      {!headerCollapsed && (
        <div className="relative z-50 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-2xl">
          <div className="px-6 py-4">
            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Collapse Toggle */}
              <button
                onClick={onToggleHeader}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-gray-500/30 hover:scale-105"
                title="Collapse header"
              >
                <ChevronUp size={16} />
              </button>
              
              {/* Bookmarks */}
              <div className="relative">
                <button
                  onClick={onToggleBookmarks}
                  className="px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-yellow-500/30 hover:scale-105"
                >
                  <Navigation size={16} />
                  Bookmarks ({bookmarkedBlocks.length})
                </button>
                {showBookmarks && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-black/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 z-50 overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-gray-200">Bookmarked Blocks</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {bookmarkedBlocks.length === 0 ? (
                        <div className="text-gray-400 text-sm p-4 text-center">No bookmarks yet</div>
                      ) : (
                        bookmarkedBlocks.map(block => (
                          <button
                            key={block.id}
                            onClick={() => onGoToBookmark(block.id)}
                            className="w-full text-left p-3 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 border-b border-white/5 last:border-b-0"
                          >
                            <div
                              className="w-4 h-4 rounded-full shadow-lg flex-shrink-0"
                              style={{
                                backgroundColor: block.color,
                                boxShadow: `0 0 12px ${block.color}60`
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-white truncate">{block.title}</div>
                              <div className="text-xs text-gray-400 capitalize">{block.type}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={onToggleVariables}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-purple-500/30 hover:scale-105"
              >
                {showVariables ? <X size={16} /> : <Menu size={16} />}
                Variables
              </button>
              
              <button
                onClick={onToggleProperties}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl hover:from-indigo-500 hover:to-blue-500 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-indigo-500/30 hover:scale-105"
              >
                {showProperties ? <X size={16} /> : <Menu size={16} />}
                Properties
              </button>
              
              {/* Add Idea Button (only in story tab) */}
              {currentTab === 'story' && (
                <button
                  onClick={() => onCreateBlock('idea')}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-purple-500/30 hover:scale-105"
                >
                  <Plus size={16} />
                  Add Idea Block
                </button>
              )}
              
              <button
                onClick={() => onCreateBlock()}
                className={`px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border hover:scale-105 ${
                  currentTab === 'ideas' 
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 border-purple-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-blue-500/30'
                }`}
              >
                <Plus size={16} />
                Add {currentTab === 'ideas' ? 'Idea' : 'Story Block'}
              </button>
              
              <button
                onClick={onSave}
                className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-green-500/30 hover:scale-105"
              >
                <Save size={16} />
                Save
              </button>
              
              <button
                onClick={onLoad}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl hover:from-amber-500 hover:to-yellow-500 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-sm border border-amber-500/30 hover:scale-105"
              >
                <Upload size={16} />
                Load
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Toggle Button - Only show when collapsed */}
      {headerCollapsed && (
        <button
          onClick={onToggleHeader}
          className="fixed top-4 right-4 z-50 p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-2xl backdrop-blur-sm border border-gray-500/30 hover:scale-110"
          title="Show header"
        >
          <ChevronDown size={20} />
        </button>
      )}
    </>
  );
};