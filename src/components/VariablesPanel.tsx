import React, { useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { StoryBlock, Variable } from '../types';
import { escapeRegExp } from '../utils/textFormatting';

interface VariablesPanelProps {
  variables: Variable[];
  blocks: StoryBlock[];
  onAddVariable: () => string;
  onUpdateVariable: (id: string, field: 'name' | 'value', value: string) => void;
  onDeleteVariable: (id: string) => void;
  onClose: () => void;
}

const input =
  'bg-white/10 px-2 py-1.5 rounded-md text-sm border border-white/15 focus:border-blue-400 focus:outline-none transition-colors w-full';

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  blocks,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable,
  onClose
}) => {
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    if (!focusId.current) return;
    const el = document.querySelector<HTMLInputElement>(`[data-variable-name="${focusId.current}"]`);
    el?.focus();
    focusId.current = null;
  }, [variables.length]);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const variable of variables) {
      const name = variable.name.trim();
      if (!name) {
        counts.set(variable.id, 0);
        continue;
      }
      const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
      counts.set(
        variable.id,
        blocks.filter(
          b =>
            regex.test(b.title) ||
            regex.test(b.content) ||
            regex.test(b.notes.specialNotes) ||
            regex.test(b.notes.plotTwist) ||
            regex.test(b.notes.plotHoles)
        ).length
      );
    }
    return counts;
  }, [variables, blocks]);

  const names = variables.map(v => v.name.trim().toLowerCase());

  return (
    <aside className="w-72 flex-shrink-0 bg-black/25 backdrop-blur-md border-r border-white/10 flex flex-col min-h-0">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
          Variables
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              focusId.current = onAddVariable();
            }}
            className="px-2 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors shadow"
            title="Add variable"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Hide panel (V)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 min-h-0">
        <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
          Type a variable's name anywhere in a block and it is shown as its value. Rename a character once, every scene follows.
        </p>

        {variables.length === 0 && (
          <div className="text-sm text-gray-500 italic text-center py-6">No variables yet.</div>
        )}

        <div className="space-y-2.5">
          {variables.map(variable => {
            const trimmed = variable.name.trim();
            const hasSpace = /\s/.test(trimmed);
            const duplicate = trimmed && names.filter(n => n === trimmed.toLowerCase()).length > 1;
            const count = usage.get(variable.id) ?? 0;
            return (
              <div key={variable.id} className="bg-white/10 p-2.5 rounded-lg border border-white/15">
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="text"
                    value={variable.name}
                    data-variable-name={variable.id}
                    onChange={e => onUpdateVariable(variable.id, 'name', e.target.value)}
                    className={`${input} font-mono ${hasSpace || duplicate ? '!border-amber-400' : ''}`}
                    placeholder="name"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => onDeleteVariable(variable.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-colors flex-shrink-0"
                    title="Delete variable"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={variable.value}
                  onChange={e => onUpdateVariable(variable.id, 'value', e.target.value)}
                  className={input}
                  placeholder="value"
                />
                <div className="mt-1.5 text-[11px] text-gray-500 flex items-center justify-between">
                  <span>
                    {hasSpace
                      ? 'Names with spaces never match'
                      : duplicate
                      ? 'Duplicate name'
                      : !trimmed
                      ? 'Give it a name'
                      : `Used in ${count} block${count === 1 ? '' : 's'}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
