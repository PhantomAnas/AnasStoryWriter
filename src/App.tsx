import React, { useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VariablesPanel } from './components/VariablesPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Canvas } from './components/Canvas';
import { BottomBar } from './components/BottomBar';
import { useStoryEditor } from './hooks/useStoryEditor';

export default function App() {
  const {
    state,
    setState,
    fileInputRef,
    replaceVariables,
    createNewBlock,
    cloneIdeaToStory,
    toggleBlockMinimized,
    updateBlock,
    deleteBlock,
    addVariable,
    updateVariable,
    deleteVariable,
    saveProject,
    loadProject,
  } = useStoryEditor();

  const moveViewport = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 200;
    setState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        x: prev.viewport.x + (direction === 'left' ? step : direction === 'right' ? -step : 0),
        y: prev.viewport.y + (direction === 'up' ? step : direction === 'down' ? -step : 0)
      }
    }));
  }, [setState]);

  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: Math.min(prev.viewport.zoom + 0.1, 3) }
    }));
  }, [setState]);

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, zoom: Math.max(prev.viewport.zoom - 0.1, 0.1) }
    }));
  }, [setState]);

  const goToBookmark = useCallback((blockId: string) => {
    const currentBlocks = state.currentTab === 'ideas' ? state.ideaBlocks : state.storyBlocks;
    const block = currentBlocks.find(b => b.id === blockId);
    if (block) {
      // Add flash effect
      setTimeout(() => {
        const element = document.querySelector(`[data-block-id="${blockId}"]`);
        if (element) {
          element.classList.add('flash-bookmark');
        }
      }, 300);
      
      setState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          x: (window.innerWidth / 2 - block.width / 2) - block.x * prev.viewport.zoom,
          y: (window.innerHeight / 2 - block.height / 2) - block.y * prev.viewport.zoom
        },
        selectedBlock: blockId,
        showBookmarks: false
      }));
    }
  }, [setState, state.storyBlocks, state.ideaBlocks]);

  const handleMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    if (state.isConnecting) return;

    const currentBlocks = state.currentTab === 'ideas' ? state.ideaBlocks : state.storyBlocks;
    const block = currentBlocks.find(b => b.id === blockId);
    if (!block) return;

    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setState(prev => ({
      ...prev,
      draggedBlock: blockId,
      selectedBlock: blockId,
      dragOffset: { x: offsetX, y: offsetY },
      isDraggingViewport: false // Ensure viewport dragging is disabled
    }));
  }, [state.isConnecting, state.storyBlocks, state.ideaBlocks, setState]);

  const handleViewportMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-background')) {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isDraggingViewport: true,
        viewportDragStart: { x: e.clientX, y: e.clientY },
        selectedBlock: null
      }));
    }
  }, [setState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (state.draggedBlock) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - state.dragOffset.x) / state.viewport.zoom - state.viewport.x / state.viewport.zoom;
      const y = (e.clientY - rect.top - state.dragOffset.y) / state.viewport.zoom - state.viewport.y / state.viewport.zoom;
      updateBlock(state.draggedBlock, { x, y });
    } else if (state.isDraggingViewport) {
      const deltaX = e.clientX - state.viewportDragStart.x;
      const deltaY = e.clientY - state.viewportDragStart.y;

      setState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          x: prev.viewport.x + deltaX,
          y: prev.viewport.y + deltaY
        },
        viewportDragStart: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [state.draggedBlock, state.dragOffset, state.viewport, state.isDraggingViewport, state.viewportDragStart, updateBlock, setState]);

  const handleMouseUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      draggedBlock: null,
      isDraggingViewport: false,
      resizingBlock: null,
      // Clear any dragging state when mouse is released
      dragOffset: { x: 0, y: 0 }
    }));
  }, [setState]);

  const startConnection = useCallback((blockId: string) => {
    setState(prev => ({
      ...prev,
      isConnecting: true,
      connectionStart: blockId
    }));
  }, [setState]);

  const completeConnection = useCallback((targetId: string) => {
    if (!state.connectionStart || state.connectionStart === targetId) {
      setState(prev => ({ ...prev, isConnecting: false, connectionStart: null }));
      return;
    }

    const currentBlocks = state.currentTab === 'ideas' ? state.ideaBlocks : state.storyBlocks;
    const startBlock = currentBlocks.find(b => b.id === state.connectionStart);
    if (startBlock && !startBlock.connections.includes(targetId)) {
      updateBlock(state.connectionStart, {
        connections: [...startBlock.connections, targetId]
      });
    }

    setState(prev => ({
      ...prev,
      isConnecting: false,
      connectionStart: null
    }));
  }, [state.connectionStart, state.currentTab, state.storyBlocks, state.ideaBlocks, updateBlock, setState]);

  const cancelConnection = useCallback(() => {
    setState(prev => ({ ...prev, isConnecting: false, connectionStart: null }));
  }, [setState]);

  const handleBlockClick = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    if (state.isConnecting) {
      completeConnection(blockId);
    } else {
      setState(prev => ({ ...prev, selectedBlock: blockId }));
    }
  }, [state.isConnecting, completeConnection, setState]);

  // Get current blocks based on active tab - COMPLETELY SEPARATE
  const currentBlocks = state.currentTab === 'ideas' ? state.ideaBlocks : state.storyBlocks;
  const selectedBlock = currentBlocks.find(b => b.id === state.selectedBlock);
  const bookmarkedBlocks = currentBlocks.filter(b => b.isBookmarked);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col overflow-hidden">
      <Header
        currentTab={state.currentTab}
        onTabChange={(tab) => setState(prev => ({ ...prev, currentTab: tab, selectedBlock: null }))}
        onCreateBlock={createNewBlock}
        onCloneIdea={cloneIdeaToStory}
        onSave={saveProject}
        onLoad={() => fileInputRef.current?.click()}
        onToggleVariables={() => setState(prev => ({ ...prev, showVariables: !prev.showVariables }))}
        onToggleProperties={() => setState(prev => ({ ...prev, showProperties: !prev.showProperties }))}
        showVariables={state.showVariables}
        showProperties={state.showProperties}
        showBookmarks={state.showBookmarks}
        onToggleBookmarks={() => setState(prev => ({ ...prev, showBookmarks: !prev.showBookmarks }))}
        bookmarkedBlocks={bookmarkedBlocks}
        onGoToBookmark={goToBookmark}
        headerCollapsed={state.headerCollapsed}
        onToggleHeader={() => setState(prev => ({ ...prev, headerCollapsed: !prev.headerCollapsed }))}
        fileInputRef={fileInputRef}
        blocks={[...state.storyBlocks, ...state.ideaBlocks]}
      />

      <div className="flex flex-1 overflow-hidden">
        {state.showVariables && (
          <VariablesPanel
            variables={state.variables}
            onAddVariable={addVariable}
            onUpdateVariable={updateVariable}
            onDeleteVariable={deleteVariable}
          />
        )}

        <Canvas
          blocks={currentBlocks}
          currentTab={state.currentTab}
          selectedBlock={state.selectedBlock}
          draggedBlock={state.draggedBlock}
          dragOffset={state.dragOffset}
          viewport={state.viewport}
          isDraggingViewport={state.isDraggingViewport}
          viewportDragStart={state.viewportDragStart}
          isConnecting={state.isConnecting}
          connectionStart={state.connectionStart}
          replaceVariables={replaceVariables}
          onMouseDown={handleMouseDown}
          onBlockClick={handleBlockClick}
          onViewportMouseDown={handleViewportMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onStartConnection={startConnection}
          onCancelConnection={cancelConnection}
          onToggleMinimized={toggleBlockMinimized}
          onCloneIdea={cloneIdeaToStory}
          setState={setState}
        />

        {state.showProperties && selectedBlock && (
          <PropertiesPanel
            selectedBlock={selectedBlock}
            blocks={currentBlocks}
            onUpdateBlock={updateBlock}
          />
        )}
      </div>

      {/* Bottom Bar */}
      <BottomBar
        currentTab={state.currentTab}
        onTabChange={(tab) => setState(prev => ({ ...prev, currentTab: tab, selectedBlock: null }))}
        totalStoryBlocks={state.storyBlocks.length}
        totalIdeaBlocks={state.currentTab === 'ideas' ? state.ideaBlocks.length : 0}
        viewport={state.viewport}
        blocksCount={currentBlocks.length}
        variablesCount={state.variables.length}
        selectedBlockTitle={selectedBlock?.title}
        isConnecting={state.isConnecting}
        onMoveViewport={moveViewport}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={loadProject}
        className="hidden"
      />

      {/* Click outside to close bookmarks */}
      {state.showBookmarks && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setState(prev => ({ ...prev, showBookmarks: false }))}
        />
      )}
    </div>
  );
}