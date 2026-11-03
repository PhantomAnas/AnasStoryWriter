import React from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const groups: { title: string; items: [string, string][] }[] = [
  {
    title: 'Blocks',
    items: [
      ['N', 'Add a block to the current board'],
      ['I', 'Add an idea marker (Story board)'],
      ['Double-click board', 'Add a block at that spot'],
      ['Del / Backspace', 'Delete selected block or connection'],
      ['Ctrl + D', 'Duplicate selected block'],
      ['B', 'Bookmark / unbookmark selected block'],
      ['M', 'Minimize / expand selected block'],
      ['Shift + drag', 'Snap block to grid']
    ]
  },
  {
    title: 'Connections',
    items: [
      ['Drag edge port', 'Drag from the circle on a block’s right edge onto another block'],
      ['C', 'Start a connection from the selected block, then click the target'],
      ['Click a line', 'Select it; Del removes it'],
      ['Esc', 'Cancel connecting / deselect']
    ]
  },
  {
    title: 'View',
    items: [
      ['Scroll / drag empty space', 'Pan'],
      ['Ctrl + scroll, pinch', 'Zoom around the pointer'],
      ['+ / −', 'Zoom in / out'],
      ['0', 'Reset zoom to 100%'],
      ['F', 'Fit all blocks in view'],
      ['Arrow keys', 'Pan (hold Shift for bigger steps)'],
      ['1 / 2', 'Switch to Story / Ideas board'],
      ['/', 'Find a block']
    ]
  },
  {
    title: 'Panels and files',
    items: [
      ['V', 'Toggle Variables panel'],
      ['P', 'Toggle Properties panel'],
      ['H', 'Toggle toolbar'],
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Shift + Z / Ctrl + Y', 'Redo'],
      ['Ctrl + S', 'Download project file'],
      ['Ctrl + O', 'Load project file (or drop one onto the board)'],
      ['Ctrl + E', 'Export Markdown'],
      ['?', 'This help']
    ]
  }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-slate-950/95">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Shortcuts and gestures
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" title="Close (Esc)">
            <X size={18} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 p-5">
          {groups.map(group => (
            <div key={group.title}>
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">{group.title}</h3>
              <dl className="space-y-1.5">
                {group.items.map(([keys, desc]) => (
                  <div key={keys} className="flex items-start gap-3 text-sm">
                    <dt className="flex-shrink-0 min-w-[120px]">
                      <kbd className="inline-block bg-white/10 border border-white/15 rounded-md px-1.5 py-0.5 text-xs font-mono text-gray-200">
                        {keys}
                      </kbd>
                    </dt>
                    <dd className="text-gray-300">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 text-xs text-gray-500">
          Your work is autosaved to this browser as a safety net. Use Save to download a project file you own.
        </div>
      </div>
    </div>
  );
};
