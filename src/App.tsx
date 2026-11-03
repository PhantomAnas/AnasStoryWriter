import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { VariablesPanel } from './components/VariablesPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Canvas } from './components/Canvas';
import { BottomBar } from './components/BottomBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { Toast, ToastMessage } from './components/Toast';
import { useStoryEditor } from './hooks/useStoryEditor';
import { BlockType, BoardTab, Point, Viewport } from './types';
import { PAN_STEP, ZOOM } from './constants';
import { centerOnBlock, fitViewport, zoomViewportAt } from './utils/canvas';

export default function App() {
  const editor = useStoryEditor();
  const {
    state,
    setState,
    fileInputRef,
    restoredFromAutosave,
    lastAutosave,
    currentBlocks,
    replaceVariables,
    createNewBlock,
    duplicateBlock,
    cloneIdeaToStory,
    toggleBlockMinimized,
    updateBlock,
    deleteBlock,
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
  } = editor;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number>();
  const flashTimer = useRef<number>();

  const notify = useCallback((text: string, tone: 'info' | 'error' = 'info') => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), tone === 'error' ? 4000 : 2200);
  }, []);

  useEffect(() => {
    if (restoredFromAutosave) notify('Restored your last session from this browser');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Viewport helpers ----------
  const canvasSize = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? window.innerWidth, height: rect?.height ?? window.innerHeight };
  }, []);

  const setViewport = useCallback(
    (update: (viewport: Viewport) => Viewport) => {
      setState(prev => ({ ...prev, viewport: update(prev.viewport) }));
    },
    [setState]
  );

  const canvasCenterWorld = useCallback((): Point => {
    const { width, height } = canvasSize();
    const { x, y, zoom } = state.viewport;
    return { x: (width / 2 - x) / zoom, y: (height / 2 - y) / zoom };
  }, [canvasSize, state.viewport]);

  const moveViewport = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', step = PAN_STEP) => {
      setViewport(v => ({
        ...v,
        x: v.x + (direction === 'left' ? step : direction === 'right' ? -step : 0),
        y: v.y + (direction === 'up' ? step : direction === 'down' ? -step : 0)
      }));
    },
    [setViewport]
  );

  const zoomBy = useCallback(
    (delta: number) => {
      const { width, height } = canvasSize();
      setViewport(v => zoomViewportAt(v, v.zoom + delta, { x: width / 2, y: height / 2 }));
    },
    [canvasSize, setViewport]
  );

  const resetZoom = useCallback(() => {
    const { width, height } = canvasSize();
    setViewport(v => zoomViewportAt(v, 1, { x: width / 2, y: height / 2 }));
  }, [canvasSize, setViewport]);

  const fitAll = useCallback(() => {
    const { width, height } = canvasSize();
    const fitted = fitViewport(currentBlocks, width, height);
    if (fitted) setViewport(() => fitted);
  }, [canvasSize, currentBlocks, setViewport]);

  const goToBlock = useCallback(
    (blockId: string) => {
      const onStory = state.storyBlocks.some(b => b.id === blockId);
      const onIdeas = !onStory && state.ideaBlocks.some(b => b.id === blockId);
      if (!onStory && !onIdeas) return;
      const block = (onStory ? state.storyBlocks : state.ideaBlocks).find(b => b.id === blockId)!;
      const { width, height } = canvasSize();
      setState(prev => ({
        ...prev,
        currentTab: onStory ? 'story' : 'ideas',
        viewport: centerOnBlock(prev.viewport, block, width, height),
        selectedBlock: blockId,
        selectedConnection: null,
        showBookmarks: false,
        flashBlockId: blockId,
        isConnecting: false,
        connectionStart: null
      }));
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(
        () => setState(prev => (prev.flashBlockId === blockId ? { ...prev, flashBlockId: null } : prev)),
        1300
      );
    },
    [state.storyBlocks, state.ideaBlocks, canvasSize, setState]
  );

  // ---------- Actions ----------
  const addBlock = useCallback(
    (type?: BlockType, at?: Point) => {
      createNewBlock(type, at ?? canvasCenterWorld());
    },
    [createNewBlock, canvasCenterWorld]
  );

  const changeTab = useCallback(
    (tab: BoardTab) => {
      setState(prev =>
        prev.currentTab === tab
          ? prev
          : {
              ...prev,
              currentTab: tab,
              selectedBlock: null,
              selectedConnection: null,
              isConnecting: false,
              connectionStart: null,
              showBookmarks: false
            }
      );
    },
    [setState]
  );

  const selectBlock = useCallback(
    (id: string | null) => {
      setState(prev => (prev.selectedBlock === id ? prev : { ...prev, selectedBlock: id }));
    },
    [setState]
  );

  const selectConnection = useCallback(
    (ref: { from: string; to: string } | null) => {
      setState(prev => ({ ...prev, selectedConnection: ref }));
    },
    [setState]
  );

  const removeBlock = useCallback(
    (id: string) => {
      deleteBlock(id);
      notify('Block deleted · Ctrl+Z to undo');
    },
    [deleteBlock, notify]
  );

  const handleFile = useCallback(
    (file: File) => {
      loadFromFile(file)
        .then(project => {
          const total = project.storyBlocks.length + project.ideaBlocks.length;
          notify(`Loaded ${file.name} · ${total} block${total === 1 ? '' : 's'}`);
        })
        .catch((error: Error) => notify(error.message || 'Could not load that file', 'error'));
    },
    [loadFromFile, notify]
  );

  const requestLoad = useCallback(() => fileInputRef.current?.click(), [fileInputRef]);

  const handleNew = useCallback(() => {
    const total = state.storyBlocks.length + state.ideaBlocks.length;
    if (total > 0 && !window.confirm('Start a new, empty project? You can undo this with Ctrl+Z.')) return;
    newProject();
    notify('New project');
  }, [state.storyBlocks.length, state.ideaBlocks.length, newProject, notify]);

  const handleSave = useCallback(() => {
    saveProject();
    notify('Project file downloaded');
  }, [saveProject, notify]);

  const handleUndo = useCallback(() => {
    if (!undo()) notify('Nothing to undo');
  }, [undo, notify]);

  const handleRedo = useCallback(() => {
    if (!redo()) notify('Nothing to redo');
  }, [redo, notify]);

  const toggle = useCallback(
    (key: 'showVariables' | 'showProperties' | 'headerCollapsed' | 'showBookmarks' | 'showFlow') => {
      setState(prev => ({ ...prev, [key]: !prev[key] }));
    },
    [setState]
  );

  // ---------- Drop a project file anywhere ----------
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      e.preventDefault();
      if (!file.name.toLowerCase().endsWith('.json')) {
        notify('Drop a .json project file', 'error');
        return;
      }
      handleFile(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleFile, notify]);

  // ---------- Keyboard shortcuts ----------
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const inField = Boolean(
      target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
    );
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (mod && key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }
    if (mod && key === 'o') {
      e.preventDefault();
      requestLoad();
      return;
    }
    if (mod && key === 'e') {
      e.preventDefault();
      exportMarkdown();
      notify('Markdown exported');
      return;
    }

    if (e.key === 'Escape') {
      if (helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (inField) {
        target?.blur();
        return;
      }
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStart: null,
        selectedBlock: null,
        selectedConnection: null,
        showBookmarks: false
      }));
      return;
    }

    if (inField) return;

    if (mod && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) handleRedo();
      else handleUndo();
      return;
    }
    if (mod && key === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }
    if (mod && key === 'd') {
      if (state.selectedBlock) {
        e.preventDefault();
        duplicateBlock(state.selectedBlock);
      }
      return;
    }
    if (mod || e.altKey) return;

    const selected = state.selectedBlock ? currentBlocks.find(b => b.id === state.selectedBlock) : undefined;

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (state.selectedConnection) {
          removeConnection(state.selectedConnection.from, state.selectedConnection.to);
          notify('Connection removed · Ctrl+Z to undo');
        } else if (selected) {
          removeBlock(selected.id);
        }
        break;
      case 'n':
      case 'N':
        addBlock(state.currentTab === 'ideas' ? 'idea' : 'story');
        break;
      case 'i':
      case 'I':
        addBlock('idea');
        break;
      case 'c':
      case 'C':
        if (selected) startConnection(selected.id);
        break;
      case 'b':
      case 'B':
        if (selected) updateBlock(selected.id, { isBookmarked: !selected.isBookmarked });
        break;
      case 'm':
      case 'M':
        if (selected) toggleBlockMinimized(selected.id);
        break;
      case 'f':
      case 'F':
        fitAll();
        break;
      case '0':
        resetZoom();
        break;
      case '+':
      case '=':
        zoomBy(ZOOM.step);
        break;
      case '-':
      case '_':
        zoomBy(-ZOOM.step);
        break;
      case '?':
        setHelpOpen(o => !o);
        break;
      case '/':
        e.preventDefault();
        setState(prev => ({ ...prev, showBookmarks: true, headerCollapsed: false }));
        break;
      case 'v':
      case 'V':
        toggle('showVariables');
        break;
      case 'p':
      case 'P':
        toggle('showProperties');
        break;
      case 'h':
      case 'H':
        toggle('headerCollapsed');
        break;
      case '1':
        changeTab('story');
        break;
      case '2':
        changeTab('ideas');
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        moveViewport(direction, e.shiftKey ? PAN_STEP * 2.5 : PAN_STEP / 2);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const selectedBlock = currentBlocks.find(b => b.id === state.selectedBlock);
  const bookmarkedBlocks = currentBlocks.filter(b => b.isBookmarked);

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col overflow-hidden">
      <Header
        currentTab={state.currentTab}
        headerCollapsed={state.headerCollapsed}
        showVariables={state.showVariables}
        showProperties={state.showProperties}
        showBookmarks={state.showBookmarks}
        bookmarkedBlocks={bookmarkedBlocks}
        blocks={currentBlocks}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleHeader={() => toggle('headerCollapsed')}
        onCreateBlock={type => addBlock(type)}
        onSave={handleSave}
        onLoad={requestLoad}
        onNew={handleNew}
        onExportMarkdown={() => {
          exportMarkdown();
          notify('Markdown exported');
        }}
        onExportText={() => {
          exportPlainText();
          notify('Text outline exported');
        }}
        onToggleVariables={() => toggle('showVariables')}
        onToggleProperties={() => toggle('showProperties')}
        onToggleBookmarks={() => toggle('showBookmarks')}
        onCloseBookmarks={() => setState(prev => ({ ...prev, showBookmarks: false }))}
        onGoToBlock={goToBlock}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onShowHelp={() => setHelpOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {state.showVariables && (
          <VariablesPanel
            variables={state.variables}
            blocks={[...state.storyBlocks, ...state.ideaBlocks]}
            onAddVariable={addVariable}
            onUpdateVariable={updateVariable}
            onDeleteVariable={deleteVariable}
            onClose={() => toggle('showVariables')}
          />
        )}

        <Canvas
          canvasRef={canvasRef}
          blocks={currentBlocks}
          currentTab={state.currentTab}
          selectedBlock={state.selectedBlock}
          selectedConnection={state.selectedConnection}
          viewport={state.viewport}
          isConnecting={state.isConnecting}
          connectionStart={state.connectionStart}
          showFlow={state.showFlow}
          flashBlockId={state.flashBlockId}
          showVariables={state.showVariables}
          showProperties={state.showProperties}
          replaceVariables={replaceVariables}
          onSelectBlock={selectBlock}
          onSelectConnection={selectConnection}
          onViewportChange={setViewport}
          onUpdateBlock={updateBlock}
          onDeleteBlock={removeBlock}
          onStartConnection={startConnection}
          onCompleteConnection={completeConnection}
          onCancelConnection={cancelConnection}
          onRemoveConnection={removeConnection}
          onToggleMinimized={toggleBlockMinimized}
          onCloneIdea={id => {
            cloneIdeaToStory(id);
            notify('Idea placed on the Story board');
          }}
          onCreateBlock={(type, at) => addBlock(type, at)}
          onToggleVariables={() => toggle('showVariables')}
          onToggleProperties={() => toggle('showProperties')}
          onLoadRequest={requestLoad}
        />

        {state.showProperties && (
          <PropertiesPanel
            selectedBlock={selectedBlock}
            blocks={currentBlocks}
            onUpdateBlock={updateBlock}
            onDeleteBlock={removeBlock}
            onDuplicateBlock={duplicateBlock}
            onRemoveConnection={removeConnection}
            onGoToBlock={goToBlock}
            onToggleMinimized={toggleBlockMinimized}
            onStartConnection={startConnection}
            onClose={() => toggle('showProperties')}
          />
        )}
      </div>

      <BottomBar
        currentTab={state.currentTab}
        onTabChange={changeTab}
        storyCount={state.storyBlocks.length}
        ideaCount={state.ideaBlocks.length}
        viewport={state.viewport}
        blocksCount={currentBlocks.length}
        variablesCount={state.variables.length}
        selectedBlockTitle={selectedBlock?.title}
        isConnecting={state.isConnecting}
        lastAutosave={lastAutosave}
        showFlow={state.showFlow}
        onToggleFlow={() => toggle('showFlow')}
        onMoveViewport={direction => moveViewport(direction)}
        onZoomIn={() => zoomBy(ZOOM.step)}
        onZoomOut={() => zoomBy(-ZOOM.step)}
        onFit={fitAll}
        onResetZoom={resetZoom}
        onShowHelp={() => setHelpOpen(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toast toast={toast} />
    </div>
  );
}
