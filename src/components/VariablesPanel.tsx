import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Variable } from '../types';

interface VariablesPanelProps {
  variables: Variable[];
  onAddVariable: () => void;
  onUpdateVariable: (id: string, field: 'name' | 'value', value: string) => void;
  onDeleteVariable: (id: string) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable
}) => {
  return (
    <div className="w-80 bg-black/20 backdrop-blur-md border-r border-white/10 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Variables
        </h3>
        <button
          onClick={onAddVariable}
          className="px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {variables.map(variable => (
          <div key={variable.id} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={variable.name}
                onChange={(e) => onUpdateVariable(variable.id, 'name', e.target.value)}
                className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-sm flex-1 border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200"
                placeholder="Variable name"
              />
              <button
                onClick={() => onDeleteVariable(variable.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-all duration-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <input
              type="text"
              value={variable.value}
              onChange={(e) => onUpdateVariable(variable.id, 'value', e.target.value)}
              className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-sm w-full border border-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200"
              placeholder="Value"
            />
          </div>
        ))}
      </div>
    </div>
  );
};