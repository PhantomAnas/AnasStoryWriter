import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AppState, BlockType, BoardTab, Point, ProjectData, StoryBlock, Variable } from '../types';
import { AUTOSAVE_KEY, DEFAULT_VARIABLES, HISTORY_LIMIT, UI_PREFS_KEY } from '../constants';
import { applyVariables } from '../utils/textFormatting';
import { createBlock, normalizeProject, serializeProject, uid } from '../utils/project';
import { downloadText, exportToMarkdown, exportToPlainText } from '../utils/export';

/** The part of the state that undo/redo and autosave track. */
type Doc = Pick<AppState, 'storyBlocks' | 'ideaBlocks' | 'variables'>;

type UiPrefs = Pick<AppState, 'showVariables' | 'showProperties' | 'headerCollapsed' | 'showFlow'>;

const initialState: AppState = {
  currentTab: 'story',
  storyBlocks: [],
  ideaBlocks: [],
  variables: DEFAULT_VARIABLES,
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedBlock: null,
  selectedConnection: null,
  isConnecting: false,
  connectionStart: null,
  showVariables: true,
  showProperties: true,
  showBookmarks: false,
  headerCollapsed: false,
  showFlow: true,
  flashBlockId: null
};

const docOf = (state: AppState): Doc => ({
  storyBlocks: state.storyBlocks,
  ideaBlocks: state.ideaBlocks,
  variables: state.variables
});

const sameDoc = (a: Doc, b: Doc): boolean =>
  a.storyBlocks === b.storyBlocks && a.ideaBlocks === b.ideaBlocks && a.variables === b.variables;

const readUiPrefs = (): Partial<UiPrefs> => {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    const prefs: Partial<UiPrefs> = {};
    (['showVariables', 'showProperties', 'headerCollapsed', 'showFlow'] as const).forEach(key => {
      if (typeof parsed[key] === 'boolean') prefs[key] = parsed[key];
    });
    return prefs;
  } catch {
    return {};
  }
};

const readAutosave = (): ProjectData | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return normalizeProject(JSON.parse(raw));
  } catch {
    return null;
  }
};

const boardOf = (tab: BoardTab): 'storyBlocks' | 'ideaBlocks' =>
  tab === 'ideas' ? 'ideaBlocks' : 'storyBlocks';

const removeFromBoard = (blocks: StoryBlock[], id: string): StoryBlock[] =>
  blocks
    .filter(block => block.id !== id)
    .map(block =>
      block.connections.includes(id)
        ? { ...block, connections: block.connections.filter(c => c !== id) }
        : block
    );

const mapBoard = (blocks: StoryBlock[], id: string, update: (block: StoryBlock) => StoryBlock): StoryBlock[] => {
  let changed = false;
  const next = blocks.map(block => {
    if (block.id !== id) return block;
    changed = true;
    return update(block);
  });
  return changed ? next : blocks;
};

/** Applies an update to whichever board holds the block. Returns the same state object when nothing changed. */
const patchBlock = (state: AppState, id: string, update: (block: StoryBlock) => StoryBlock): AppState => {
  const storyBlocks = mapBoard(state.storyBlocks, id, update);
  const ideaBlocks = storyBlocks === state.storyBlocks ? mapBoard(state.ideaBlocks, id, update) : state.ideaBlocks;
  if (storyBlocks === state.storyBlocks && ideaBlocks === state.ideaBlocks) return state;
  return { ...state, storyBlocks, ideaBlocks };
};

export const useStoryEditor = () => {
  const init = useMemo(() => {
    const autosave = readAutosave();
    const restored = Boolean(autosave && (autosave.storyBlocks.length || autosave.ideaBlocks.length));
    const state: AppState = {
      ...initialState,
      ...readUiPrefs(),
      ...(autosave && restored
        ? {
            storyBlocks: autosave.storyBlocks,
            ideaBlocks: autosave.ideaBlocks,
            variables: autosave.variables,
            viewport: autosave.viewport
          }
        : {})
    };
    return { state, restored };
  }, []);

  const [state, setState] = useState<AppState>(init.state);
  const stateRef = useRef(state);
  stateRef.current = state;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Undo / redo ----------
  // Changes to the document are committed to history after a short quiet period,
  // so a drag or a typing burst becomes one undo step instead of hundreds.
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);
  const committed = useRef<Doc>(docOf(init.state));
  const skipNextCommit = useRef(false);
  const commitImmediately = useRef(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  const commit = useCallback((doc: Doc) => {
    if (sameDoc(doc, committed.current)) return;
    past.current.push(committed.current);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    committed.current = doc;
    setHistoryVersion(v => v + 1);
  }, []);

  /**
   * Discrete actions (delete, connect, add...) call this first so that any pending
   * drag/typing burst becomes its own undo step and the action itself is committed at once.
   */
  const markDiscrete = useCallback(() => {
    commit(docOf(stateRef.current));
    commitImmediately.current = true;
    setTimeout(() => {
      commitImmediately.current = false;
    }, 0);
  }, [commit]);

  useEffect(() => {
    const current = docOf(state);
    if (skipNextCommit.current) {
      skipNextCommit.current = false;
      committed.current = current;
      return;
    }
    if (sameDoc(current, committed.current)) return;

    if (commitImmediately.current) {
      commitImmediately.current = false;
      commit(current);
      return;
    }
    const timer = setTimeout(() => commit(current), 350);
    return () => clearTimeout(timer);
  }, [state.storyBlocks, state.ideaBlocks, state.variables]); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreDoc = useCallback((doc: Doc) => {
    skipNextCommit.current = true;
    setState(prev => {
      const visibleIds = new Set([...doc.storyBlocks, ...doc.ideaBlocks].map(b => b.id));
      return {
        ...prev,
        ...doc,
        selectedBlock: prev.selectedBlock && visibleIds.has(prev.selectedBlock) ? prev.selectedBlock : null,
        selectedConnection: null,
        isConnecting: false,
        connectionStart: null
      };
    });
    setHistoryVersion(v => v + 1);
  }, []);

  const undo = useCallback(() => {
    const current = docOf(stateRef.current);
    // Flush any change that has not been committed yet so it is not lost.
    commit(current);
    const previous = past.current.pop();
    if (!previous) return false;
    future.current.push(current);
    restoreDoc(previous);
    return true;
  }, [commit, restoreDoc]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return false;
    past.current.push(docOf(stateRef.current));
    restoreDoc(next);
    return true;
  }, [restoreDoc]);

  const canUndo = past.current.length > 0 || !sameDoc(docOf(state), committed.current);
  const canRedo = future.current.length > 0;
  void historyVersion;

  // ---------- Autosave + UI prefs ----------
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeProject(state)));
        setLastAutosave(new Date());
      } catch {
        // Storage may be full or blocked (private mode). Manual save still works.
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [state.storyBlocks, state.ideaBlocks, state.variables, state.viewport]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const prefs: UiPrefs = {
        showVariables: state.showVariables,
        showProperties: state.showProperties,
        headerCollapsed: state.headerCollapsed,
        showFlow: state.showFlow
      };
      localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [state.showVariables, state.showProperties, state.headerCollapsed, state.showFlow]);

  // ---------- Derived ----------
  const replaceVariables = useCallback(
    (text: string) => applyVariables(text, state.variables),
    [state.variables]
  );

  const currentBlocks = state.currentTab === 'ideas' ? state.ideaBlocks : state.storyBlocks;

  // ---------- Blocks ----------
  const createNewBlock = useCallback((type?: BlockType, at?: Point) => {
    markDiscrete();
    setState(prev => {
      const blockType: BlockType = type ?? (prev.currentTab === 'ideas' ? 'idea' : 'story');
      // Idea blocks created while on the Story board live on the Story board as markers.
      const board = boardOf(prev.currentTab);
      const position = at ?? {
        x: (window.innerWidth / 2 - prev.viewport.x) / prev.viewport.zoom,
        y: (window.innerHeight / 2 - prev.viewport.y) / prev.viewport.zoom
      };
      const block = createBlock(blockType, position);
      return {
        ...prev,
        [board]: [...prev[board], block],
        selectedBlock: block.id,
        selectedConnection: null,
        showProperties: true
      };
    });
  }, [markDiscrete]);

  const duplicateBlock = useCallback((id: string) => {
    markDiscrete();
    setState(prev => {
      const board = boardOf(prev.currentTab);
      const source = prev[board].find(b => b.id === id);
      if (!source) return prev;
      const copy: StoryBlock = {
        ...source,
        id: uid(),
        x: source.x + 30,
        y: source.y + 30,
        title: source.title ? `${source.title} (copy)` : source.title,
        connections: [],
        isBookmarked: false
      };
      return { ...prev, [board]: [...prev[board], copy], selectedBlock: copy.id, selectedConnection: null };
    });
  }, [markDiscrete]);

  const cloneIdeaToStory = useCallback((ideaId: string) => {
    markDiscrete();
    setState(prev => {
      const idea = prev.ideaBlocks.find(b => b.id === ideaId)
        ?? prev.storyBlocks.find(b => b.id === ideaId && b.type === 'idea');
      if (!idea) return prev;
      const centerX = (window.innerWidth / 2 - prev.viewport.x) / prev.viewport.zoom;
      const centerY = (window.innerHeight / 2 - prev.viewport.y) / prev.viewport.zoom;
      const clone: StoryBlock = {
        ...idea,
        id: uid(),
        type: 'idea',
        x: centerX - idea.width / 2,
        y: centerY - idea.height / 2,
        connections: [],
        isMinimized: false
      };
      return {
        ...prev,
        storyBlocks: [...prev.storyBlocks, clone],
        currentTab: 'story',
        selectedBlock: clone.id,
        selectedConnection: null,
        isConnecting: false,
        connectionStart: null
      };
    });
  }, [markDiscrete]);

  const updateBlock = useCallback((id: string, updates: Partial<StoryBlock>) => {
    setState(prev => patchBlock(prev, id, block => ({ ...block, ...updates })));
  }, []);

  const toggleBlockMinimized = useCallback((id: string) => {
    markDiscrete();
    setState(prev => patchBlock(prev, id, block => ({ ...block, isMinimized: !block.isMinimized })));
  }, [markDiscrete]);

  const deleteBlock = useCallback((id: string) => {
    markDiscrete();
    setState(prev => ({
      ...prev,
      storyBlocks: removeFromBoard(prev.storyBlocks, id),
      ideaBlocks: removeFromBoard(prev.ideaBlocks, id),
      selectedBlock: prev.selectedBlock === id ? null : prev.selectedBlock,
      selectedConnection:
        prev.selectedConnection && (prev.selectedConnection.from === id || prev.selectedConnection.to === id)
          ? null
          : prev.selectedConnection,
      connectionStart: prev.connectionStart === id ? null : prev.connectionStart,
      isConnecting: prev.connectionStart === id ? false : prev.isConnecting
    }));
  }, [markDiscrete]);

  // ---------- Connections ----------
  const addConnection = useCallback((from: string, to: string) => {
    markDiscrete();
    if (from === to) return;
    setState(prev =>
      patchBlock(prev, from, block =>
        block.connections.includes(to) ? block : { ...block, connections: [...block.connections, to] }
      )
    );
  }, [markDiscrete]);

  const removeConnection = useCallback((from: string, to: string) => {
    markDiscrete();
    setState(prev => {
      const next = patchBlock(prev, from, block => ({
        ...block,
        connections: block.connections.filter(c => c !== to)
      }));
      const selected = next.selectedConnection;
      if (selected && selected.from === from && selected.to === to) {
        return { ...next, selectedConnection: null };
      }
      return next;
    });
  }, [markDiscrete]);

  const startConnection = useCallback((blockId: string) => {
    setState(prev => ({ ...prev, isConnecting: true, connectionStart: blockId, selectedConnection: null }));
  }, []);

  const completeConnection = useCallback((targetId: string) => {
    markDiscrete();
    setState(prev => {
      const from = prev.connectionStart;
      const cleared = { ...prev, isConnecting: false, connectionStart: null };
      if (!from || from === targetId) return cleared;
      return patchBlock(cleared, from, block =>
        block.connections.includes(targetId) ? block : { ...block, connections: [...block.connections, targetId] }
      );
    });
  }, [markDiscrete]);

  const cancelConnection = useCallback(() => {
    setState(prev => (prev.isConnecting ? { ...prev, isConnecting: false, connectionStart: null } : prev));
  }, []);

  // ---------- Variables ----------
  const addVariable = useCallback(() => {
    markDiscrete();
    const variable: Variable = { id: uid(), name: '', value: '' };
    setState(prev => ({ ...prev, variables: [...prev.variables, variable] }));
    return variable.id;
  }, [markDiscrete]);

  const updateVariable = useCallback((id: string, field: 'name' | 'value', value: string) => {
    setState(prev => ({
      ...prev,
      variables: prev.variables.map(v => (v.id === id ? { ...v, [field]: value } : v))
    }));
  }, []);

  const deleteVariable = useCallback((id: string) => {
    markDiscrete();
    setState(prev => ({ ...prev, variables: prev.variables.filter(v => v.id !== id) }));
  }, [markDiscrete]);

  // ---------- Project file ----------
  const saveProject = useCallback(() => {
    const data = serializeProject(stateRef.current);
    downloadText(`story-project-${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
  }, []);

  const loadFromFile = useCallback((file: File): Promise<ProjectData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the file.'));
      reader.onload = event => {
        try {
          const project = normalizeProject(JSON.parse(String(event.target?.result ?? '')));
          markDiscrete();
          setState(prev => ({
            ...prev,
            storyBlocks: project.storyBlocks,
            ideaBlocks: project.ideaBlocks,
            variables: project.variables,
            viewport: project.viewport,
            selectedBlock: null,
            selectedConnection: null,
            isConnecting: false,
            connectionStart: null
          }));
          resolve(project);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Error loading project file.'));
        }
      };
      reader.readAsText(file);
    });
  }, [markDiscrete]);

  const newProject = useCallback(() => {
    markDiscrete();
    setState(prev => ({
      ...prev,
      storyBlocks: [],
      ideaBlocks: [],
      variables: DEFAULT_VARIABLES,
      viewport: { x: 0, y: 0, zoom: 1 },
      currentTab: 'story',
      selectedBlock: null,
      selectedConnection: null,
      isConnecting: false,
      connectionStart: null
    }));
  }, [markDiscrete]);

  const exportMarkdown = useCallback(() => {
    const { storyBlocks, ideaBlocks, variables } = stateRef.current;
    downloadText(`story-${Date.now()}.md`, exportToMarkdown({ storyBlocks, ideaBlocks, variables }), 'text/markdown');
  }, []);

  const exportPlainText = useCallback(() => {
    const { storyBlocks, ideaBlocks, variables } = stateRef.current;
    downloadText(`story-${Date.now()}.txt`, exportToPlainText({ storyBlocks, ideaBlocks, variables }), 'text/plain');
  }, []);

  return {
    state,
    setState,
    fileInputRef,
    restoredFromAutosave: init.restored,
    lastAutosave,
    currentBlocks,
    replaceVariables,
    createNewBlock,
    duplicateBlock,
    cloneIdeaToStory,
    toggleBlockMinimized,
    updateBlock,
    deleteBlock,
    addConnection,
    removeConnection,
    startConnection,
    completeConnection,
    cancelConnection,
    addVariable,
    updateVariable,
    deleteVariable,
    saveProject,
    loadFromFile,
    newProject,
    exportMarkdown,
    exportPlainText,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
