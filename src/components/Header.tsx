import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Save,
  Upload,
  ChevronUp,
  ChevronDown,
  Undo2,
  Redo2,
  Navigation,
  Search,
  Bookmark,
  FileDown,
  FilePlus2,
  Variable,
  SlidersHorizontal,
  HelpCircle,
  Lightbulb,
  ChevronDown as Caret
} from 'lucide-react';
import { BlockType, BoardTab, StoryBlock } from '../types';

interface HeaderProps {
  currentTab: BoardTab;
  headerCollapsed: boolean;
  showVariables: boolean;
  showProperties: boolean;
  showBookmarks: boolean;
  bookmarkedBlocks: StoryBlock[];
  blocks: StoryBlock[];
  canUndo: boolean;
  canRedo: boolean;
  onToggleHeader: () => void;
  onCreateBlock: (type?: BlockType) => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onToggleVariables: () => void;
  onToggleProperties: () => void;
  onToggleBookmarks: () => void;
  onCloseBookmarks: () => void;
  onGoToBlock: (blockId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowHelp: () => void;
}

const btn =
  'px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-sm shadow-md border hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed whitespace-nowrap';
const neutral = `${btn} bg-white/10 hover:bg-white/20 border-white/10`;

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  headerCollapsed,
  showVariables,
  showProperties,
  showBookmarks,
  bookmarkedBlocks,
  blocks,
  canUndo,
  canRedo,
  onToggleHeader,
  onCreateBlock,
  onSave,
  onLoad,
  onNew,
  onExportMarkdown,
  onExportText,
  onToggleVariables,
  onToggleProperties,
  onToggleBookmarks,
  onCloseBookmarks,
  onGoToBlock,
  onUndo,
  onRedo,
  onShowHelp
}) => {
  const [query, setQuery] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showBookmarks) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [showBookmarks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return blocks
      .filter(b => b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q))
      .slice(0, 30);
  }, [blocks, query]);

  const renderRow = (block: StoryBlock) => (
    <button
      key={block.id}
      onClick={() => onGoToBlock(block.id)}
      className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-b-0"
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: block.color, boxShadow: `0 0 10px ${block.color}80` }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white truncate">{block.title || 'Untitled'}</div>
        <div className="text-[11px] text-gray-400 truncate">
          {block.type === 'idea' ? 'Idea' : 'Scene'}
          {block.content ? ` · ${block.content.slice(0, 60)}` : ''}
        </div>
      </div>
      {block.isBookmarked && <Bookmark size={12} className="text-yellow-400 flex-shrink-0" fill="currentColor" />}
    </button>
  );

  if (headerCollapsed) {
    return (
      <button
        onClick={onToggleHeader}
        className="fixed top-3 right-3 z-50 p-2.5 bg-black/50 hover:bg-black/70 rounded-xl shadow-xl backdrop-blur-md border border-white/15 transition-colors"
        title="Show toolbar (H)"
      >
        <ChevronDown size={18} />
      </button>
    );
  }

  return (
    <header className="relative z-50 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-xl">
      <div className="px-3 py-2 flex flex-wrap items-center gap-2">
        {/* Left: brand, history */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleHeader} className={neutral} title="Hide toolbar (H)">
            <ChevronUp size={16} />
          </button>
          <div className="hidden lg:block text-base font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent pr-1">
            Story Writer
          </div>
          <div className="flex items-center rounded-xl bg-white/10 border border-white/10 overflow-hidden">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="px-2.5 py-2 hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="px-2.5 py-2 hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent transition-colors border-l border-white/10"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
          </div>
        </div>

        {/* Center: creation */}
        <div className="flex items-center gap-2 mx-auto">
          <button
            onClick={() => onCreateBlock(currentTab === 'ideas' ? 'idea' : 'story')}
            className={`${btn} ${
              currentTab === 'ideas'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 border-purple-400/30'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-blue-400/30'
            }`}
            title={currentTab === 'ideas' ? 'Add idea (N)' : 'Add story block (N)'}
          >
            <Plus size={16} />
            {currentTab === 'ideas' ? 'Add Idea' : 'Add Story Block'}
          </button>
          {currentTab === 'story' && (
            <button
              onClick={() => onCreateBlock('idea')}
              className={`${btn} bg-gradient-to-r from-purple-600/80 to-violet-600/80 hover:from-purple-500 hover:to-violet-500 border-purple-400/30`}
              title="Add an idea marker to the story board (I)"
            >
              <Lightbulb size={16} />
              Idea Marker
            </button>
          )}
        </div>

        {/* Right: navigation, panels, file */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={onToggleBookmarks}
              className={`${btn} bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 border-yellow-400/30`}
              title="Find a block or jump to a bookmark (/)"
            >
              <Navigation size={16} />
              <span className="hidden md:inline">Find</span>
              {bookmarkedBlocks.length > 0 && (
                <span className="text-[11px] bg-black/30 rounded-full px-1.5">{bookmarkedBlocks.length}</span>
              )}
            </button>
            {showBookmarks && (
              <>
                <div className="fixed inset-0 z-40" onClick={onCloseBookmarks} />
                <div className="absolute top-full right-0 mt-2 w-80 bg-slate-950/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/15 z-50 overflow-hidden">
                  <div className="p-2 border-b border-white/10 flex items-center gap-2">
                    <Search size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') onCloseBookmarks();
                        if (e.key === 'Enter' && results[0]) onGoToBlock(results[0].id);
                      }}
                      placeholder={`Search ${blocks.length} blocks on this board...`}
                      className="bg-transparent flex-1 text-sm outline-none placeholder:text-gray-500"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {query.trim() ? (
                      results.length ? (
                        results.map(renderRow)
                      ) : (
                        <div className="text-gray-400 text-sm p-4 text-center">No matches</div>
                      )
                    ) : (
                      <>
                        <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
                          <Bookmark size={11} /> Bookmarks
                        </div>
                        {bookmarkedBlocks.length === 0 ? (
                          <div className="text-gray-400 text-sm p-4 text-center">
                            No bookmarks yet. Click the bookmark icon on a block to add one.
                          </div>
                        ) : (
                          bookmarkedBlocks.map(renderRow)
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onToggleVariables}
            className={`${btn} ${showVariables ? 'bg-purple-600/70 border-purple-400/40' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
            title="Toggle Variables panel (V)"
          >
            <Variable size={16} />
            <span className="hidden xl:inline">Variables</span>
          </button>
          <button
            onClick={onToggleProperties}
            className={`${btn} ${showProperties ? 'bg-indigo-600/70 border-indigo-400/40' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
            title="Toggle Properties panel (P)"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden xl:inline">Properties</span>
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={onSave}
            className={`${btn} bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-green-400/30`}
            title="Download project file (Ctrl+S)"
          >
            <Save size={16} />
            <span className="hidden md:inline">Save</span>
          </button>
          <button onClick={onLoad} className={neutral} title="Load a project file (Ctrl+O). You can also drop a file onto the board.">
            <Upload size={16} />
            <span className="hidden md:inline">Load</span>
          </button>

          <div className="relative">
            <button onClick={() => setExportOpen(o => !o)} className={neutral} title="Export">
              <FileDown size={16} />
              <span className="hidden md:inline">Export</span>
              <Caret size={12} className="opacity-70" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/15 z-50 overflow-hidden text-sm">
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      onExportMarkdown();
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-colors"
                  >
                    <div className="text-white">Markdown (.md)</div>
                    <div className="text-[11px] text-gray-400">Scenes in connection order, with notes and variables</div>
                  </button>
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      onExportText();
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-colors border-t border-white/5"
                  >
                    <div className="text-white">Plain text (.txt)</div>
                    <div className="text-[11px] text-gray-400">Numbered outline, no markup</div>
                  </button>
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      onNew();
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition-colors border-t border-white/10 flex items-center gap-2 text-gray-300"
                  >
                    <FilePlus2 size={14} /> New empty project
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={onShowHelp} className={neutral} title="Keyboard shortcuts (?)">
            <HelpCircle size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
