import React, { useRef, useEffect, useCallback } from 'react';
import { StoryBlock } from './StoryBlock';
import { StoryBlock as StoryBlockType, ConnectionPoints } from '../types';

interface CanvasProps {
  blocks: StoryBlockType[];
  currentTab: 'story' | 'ideas';
  selectedBlock: string | null;
  draggedBlock: string | null;
  dragOffset: { x: number; y: number };
  viewport: { x: number; y: number; zoom: number };
  isDraggingViewport: boolean;
  viewportDragStart: { x: number; y: number };
  isConnecting: boolean;
  connectionStart: string | null;
  replaceVariables: (text: string) => string;
  onMouseDown: (e: React.MouseEvent, blockId: string) => void;
  onBlockClick: (e: React.MouseEvent, blockId: string) => void;
  onViewportMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onUpdateBlock: (id: string, updates: Partial<StoryBlockType>) => void;
  onDeleteBlock: (id: string) => void;
  onStartConnection: (blockId: string) => void;
  onCancelConnection: () => void;
  onToggleMinimized: (blockId: string) => void;
  onCloneIdea?: (ideaId: string) => void;
  setState: React.Dispatch<React.SetStateAction<any>>;
}

export const Canvas: React.FC<CanvasProps> = ({
  blocks,
  currentTab,
  selectedBlock,
  draggedBlock,
  dragOffset,
  viewport,
  isDraggingViewport,
  viewportDragStart,
  isConnecting,
  connectionStart,
  replaceVariables,
  onMouseDown,
  onBlockClick,
  onViewportMouseDown,
  onMouseMove,
  onMouseUp,
  onUpdateBlock,
  onDeleteBlock,
  onStartConnection,
  onCancelConnection,
  onToggleMinimized,
  onCloneIdea,
  setState
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const getConnectionPoints = useCallback((fromBlock: StoryBlockType, toBlock: StoryBlockType): ConnectionPoints => {
    const fromCenterX = fromBlock.x + fromBlock.width / 2;
    const fromCenterY = fromBlock.y + fromBlock.height / 2;
    const toCenterX = toBlock.x + toBlock.width / 2;
    const toCenterY = toBlock.y + toBlock.height / 2;

    const deltaX = toCenterX - fromCenterX;
    const deltaY = toCenterY - fromCenterY;

    let fromX, fromY, toX, toY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        fromX = fromBlock.x + fromBlock.width;
        fromY = fromCenterY;
        toX = toBlock.x;
        toY = toCenterY;
      } else {
        fromX = fromBlock.x;
        fromY = fromCenterY;
        toX = toBlock.x + toBlock.width;
        toY = toCenterY;
      }
    } else {
      if (deltaY > 0) {
        fromX = fromCenterX;
        fromY = fromBlock.y + fromBlock.height;
        toX = toCenterX;
        toY = toBlock.y;
      } else {
        fromX = fromCenterX;
        fromY = fromBlock.y;
        toX = toCenterX;
        toY = toBlock.y + toBlock.height;
      }
    }

    return { fromX, fromY, toX, toY };
  }, []);

  // Filter blocks based on current tab
  const visibleBlocks = blocks.filter(block => {
    if (currentTab === 'ideas') {
      // In ideas tab, show only idea blocks from ideaBlocks array
      return block.type === 'idea' && block.id.startsWith('idea-');
    } else {
      // In story tab, show all blocks (story blocks and cloned idea blocks)
      return block.type === 'story' || (block.type === 'idea');
    }
  });

  // Filter connections based on current tab
  // const connectionsToShow = visibleBlocks.filter(block => {
  //   if (currentTab === 'ideas') {
  //     // In ideas tab, show connections between original idea blocks only
  //     return block.type === 'idea' && block.id.startsWith('idea-');
  //   } else {
  //     // In story tab, show connections between story blocks only (not idea blocks)
  //     return block.type === 'story';
  //   }
  // });

  // Filter connections based on current tab
  const connectionsToShow = visibleBlocks.filter(block => {
    if (currentTab === 'ideas') {
      // In ideas tab, show connections between original idea blocks only
      return block.type === 'idea' && block.id.startsWith('idea-');
    } else {
      // In story tab, show connections between story and idea blocks
      return block.type === 'story' || block.type === 'idea';
    }
  });

  const renderConnections = useCallback(() => {
    if (connectionsToShow.length === 0) return null;

    return connectionsToShow.map(block =>
      block.connections.map(targetId => {
        const target = connectionsToShow.find(b => b.id === targetId);
        if (!target) return null;

        const { fromX, fromY, toX, toY } = getConnectionPoints(block, target);

        return (
          <line
            key={`${block.id}-${targetId}`}
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            className="drop-shadow-md"
          />
        );
      })
    ).flat();
  }, [connectionsToShow, getConnectionPoints]);

  // Global mouse event listeners for better drag handling
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedBlock && canvasRef.current) {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - dragOffset.x) / viewport.zoom - viewport.x / viewport.zoom;
        const y = (e.clientY - rect.top - dragOffset.y) / viewport.zoom - viewport.y / viewport.zoom;
        onUpdateBlock(draggedBlock, { x, y });
      } else if (isDraggingViewport) {
        e.preventDefault();
        const deltaX = e.clientX - viewportDragStart.x;
        const deltaY = e.clientY - viewportDragStart.y;

        setState((prev: any) => ({
          ...prev,
          viewport: {
            ...prev.viewport,
            x: prev.viewport.x + deltaX,
            y: prev.viewport.y + deltaY
          },
          viewportDragStart: { x: e.clientX, y: e.clientY }
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      setState((prev: any) => ({
        ...prev,
        draggedBlock: null,
        isDraggingViewport: false,
        dragOffset: { x: 0, y: 0 }
      }));
    };

    if (draggedBlock || isDraggingViewport) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
      document.addEventListener('mouseleave', handleGlobalMouseUp, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [draggedBlock, isDraggingViewport, dragOffset, viewport, viewportDragStart, onUpdateBlock, setState]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={canvasRef}
        className={`canvas-background w-full h-full relative ${
          isDraggingViewport ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={onViewportMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          background: `
            ${currentTab === 'ideas' 
              ? `radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
                 radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
                 linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)`
              : `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                 radial-gradient(circle at 40% 80%, rgba(120, 255, 198, 0.3) 0%, transparent 50%),
                 linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`
            }
          `
        }}
      >
        {/* Story Blocks and Connections Container */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            zIndex: 2
          }}
        >
          {/* SVG for connections */}
          <svg
            className="absolute pointer-events-none top-0 left-0 w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
              zIndex: 1
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={currentTab === 'ideas' ? "rgba(168, 85, 247, 0.8)" : "rgba(59, 130, 246, 0.8)"}
                />
              </marker>
            </defs>
            {renderConnections()}
          </svg>

          {/* Story Blocks */}
          {visibleBlocks.map(block => (
            <StoryBlock
              key={block.id}
              block={block}
              currentTab={currentTab}
              isSelected={selectedBlock === block.id}
              isDragged={draggedBlock === block.id}
              isConnecting={isConnecting}
              connectionStart={connectionStart}
              replaceVariables={replaceVariables}
              onMouseDown={onMouseDown}
              onClick={onBlockClick}
              onUpdateBlock={onUpdateBlock}
              onDeleteBlock={onDeleteBlock}
              onStartConnection={onStartConnection}
              onCancelConnection={onCancelConnection}
              onToggleMinimized={onToggleMinimized}
              onCloneIdea={onCloneIdea}
            />
          ))}
        </div>
      </div>
    </div>
  );
};