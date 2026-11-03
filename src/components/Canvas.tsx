import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanelLeftOpen, PanelRightOpen, Plus, Upload, X } from 'lucide-react';
import { StoryBlock } from './StoryBlock';
import { BlockType, BoardTab, ConnectionRef, Point, StoryBlock as StoryBlockType, Viewport } from '../types';
import { BLOCK_DEFAULTS } from '../constants';
import {
  connectionBetweenBlocks,
  connectionToPoint,
  distance,
  screenToWorld,
  zoomViewportAt
} from '../utils/canvas';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  blocks: StoryBlockType[];
  currentTab: BoardTab;
  selectedBlock: string | null;
  selectedConnection: ConnectionRef | null;
  viewport: Viewport;
  isConnecting: boolean;
  connectionStart: string | null;
  showFlow: boolean;
  flashBlockId: string | null;
  showVariables: boolean;
  showProperties: boolean;
  replaceVariables: (text: string) => string;
  onSelectBlock: (id: string | null) => void;
  onSelectConnection: (ref: ConnectionRef | null) => void;
  onViewportChange: (update: (viewport: Viewport) => Viewport) => void;
  onUpdateBlock: (id: string, updates: Partial<StoryBlockType>) => void;
  onDeleteBlock: (id: string) => void;
  onStartConnection: (blockId: string) => void;
  onCompleteConnection: (targetId: string) => void;
  onCancelConnection: () => void;
  onRemoveConnection: (from: string, to: string) => void;
  onToggleMinimized: (blockId: string) => void;
  onCloneIdea: (ideaId: string) => void;
  onCreateBlock: (type: BlockType, at: Point) => void;
  onToggleVariables: () => void;
  onToggleProperties: () => void;
  onLoadRequest: () => void;
}

type Gesture =
  | { kind: 'drag'; id: string; offset: Point; start: Point; moved: boolean }
  | { kind: 'pan'; last: Point }
  | { kind: 'resize'; id: string; start: Point; startWidth: number; startHeight: number }
  | { kind: 'connect'; from: string; start: Point; moved: boolean }
  | { kind: 'pinch' };

const GRID = 20;
const DRAG_THRESHOLD = 4;

const LINE_COLORS = {
  story: { base: 'rgba(96, 165, 250, 0.55)', bright: '#60A5FA', flow: 'rgba(224, 242, 254, 0.9)' },
  ideas: { base: 'rgba(192, 132, 252, 0.55)', bright: '#C084FC', flow: 'rgba(243, 232, 255, 0.9)' }
};

export const Canvas: React.FC<CanvasProps> = props => {
  const {
    canvasRef,
    blocks,
    currentTab,
    selectedBlock,
    selectedConnection,
    viewport,
    isConnecting,
    connectionStart,
    showFlow,
    flashBlockId,
    showVariables,
    showProperties,
    replaceVariables,
    onSelectBlock,
    onSelectConnection,
    onViewportChange,
    onUpdateBlock,
    onDeleteBlock,
    onStartConnection,
    onCompleteConnection,
    onCancelConnection,
    onRemoveConnection,
    onToggleMinimized,
    onCloneIdea,
    onCreateBlock,
    onToggleVariables,
    onToggleProperties,
    onLoadRequest
  } = props;

  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ dist: number; mid: Point } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

  const canvasPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
    },
    [canvasRef]
  );

  // Handlers are stored in refs so the window listeners stay stable while always seeing fresh props.
  const moveHandler = useRef<(e: PointerEvent) => void>(() => {});
  const upHandler = useRef<(e: PointerEvent) => void>(() => {});
  const onWindowMove = useCallback((e: PointerEvent) => moveHandler.current(e), []);
  const onWindowUp = useCallback((e: PointerEvent) => upHandler.current(e), []);

  const attach = useCallback(() => {
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  }, [onWindowMove, onWindowUp]);

  const detach = useCallback(() => {
    window.removeEventListener('pointermove', onWindowMove);
    window.removeEventListener('pointerup', onWindowUp);
    window.removeEventListener('pointercancel', onWindowUp);
  }, [onWindowMove, onWindowUp]);

  useEffect(() => detach, [detach]);

  const toWorld = (clientX: number, clientY: number): Point =>
    screenToWorld(viewport, canvasPoint(clientX, clientY));

  moveHandler.current = (e: PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const g = gesture.current;
    if (!g) return;

    if (g.kind === 'pinch') {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const dist = distance(pts[0], pts[1]);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const prev = pinch.current;
      if (prev && prev.dist > 0) {
        const ratio = dist / prev.dist;
        const anchor = canvasPoint(mid.x, mid.y);
        onViewportChange(v => {
          const zoomed = zoomViewportAt(v, v.zoom * ratio, anchor);
          return { ...zoomed, x: zoomed.x + (mid.x - prev.mid.x), y: zoomed.y + (mid.y - prev.mid.y) };
        });
      }
      pinch.current = { dist, mid };
      return;
    }

    if (g.kind === 'drag') {
      if (!g.moved && distance(g.start, { x: e.clientX, y: e.clientY }) < DRAG_THRESHOLD) return;
      g.moved = true;
      const p = toWorld(e.clientX - g.offset.x, e.clientY - g.offset.y);
      const snap = e.shiftKey;
      onUpdateBlock(g.id, {
        x: snap ? Math.round(p.x / GRID) * GRID : p.x,
        y: snap ? Math.round(p.y / GRID) * GRID : p.y
      });
      return;
    }

    if (g.kind === 'pan') {
      const dx = e.clientX - g.last.x;
      const dy = e.clientY - g.last.y;
      g.last = { x: e.clientX, y: e.clientY };
      onViewportChange(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
      return;
    }

    if (g.kind === 'resize') {
      const width = Math.max(BLOCK_DEFAULTS.minWidth, g.startWidth + (e.clientX - g.start.x) / viewport.zoom);
      const height = Math.max(BLOCK_DEFAULTS.minHeight, g.startHeight + (e.clientY - g.start.y) / viewport.zoom);
      onUpdateBlock(g.id, { width: Math.round(width), height: Math.round(height) });
      return;
    }

    if (g.kind === 'connect') {
      if (distance(g.start, { x: e.clientX, y: e.clientY }) >= DRAG_THRESHOLD) g.moved = true;
      setCursor(toWorld(e.clientX, e.clientY));
    }
  };

  upHandler.current = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;

    if (g?.kind === 'pinch') {
      if (pointers.current.size < 2) {
        gesture.current = null;
        pinch.current = null;
      }
      if (pointers.current.size === 0) detach();
      return;
    }

    if (g?.kind === 'connect') {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-block-id]');
      const targetId = el?.dataset.blockId;
      if (targetId && targetId !== g.from) {
        onCompleteConnection(targetId);
        setCursor(null);
      } else if (g.moved) {
        onCancelConnection();
        setCursor(null);
      }
      // A plain click on the port keeps click-to-connect mode on; the preview follows the pointer.
    }

    if (g?.kind === 'drag') setDraggingId(null);
    gesture.current = null;
    if (pointers.current.size === 0) detach();
  };

  // Clear the preview line when connecting stops for any reason.
  useEffect(() => {
    if (!isConnecting) setCursor(null);
  }, [isConnecting]);

  // Wheel: scroll pans, Ctrl/Cmd + wheel (and trackpad pinch) zooms around the pointer.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const deltaX = e.deltaX * scale;
      const deltaY = e.deltaY * scale;
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-deltaY * 0.0015);
        const anchor = canvasPoint(e.clientX, e.clientY);
        onViewportChange(v => zoomViewportAt(v, v.zoom * factor, anchor));
      } else if (e.shiftKey && deltaX === 0) {
        onViewportChange(v => ({ ...v, x: v.x - deltaY }));
      } else {
        onViewportChange(v => ({ ...v, x: v.x - deltaX, y: v.y - deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [canvasRef, canvasPoint, onViewportChange]);

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    return Boolean(el?.closest?.('[data-block-id], [data-connection], [data-ui]'));
  };

  const handleCanvasPointerDownCapture = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (e.pointerType === 'touch' && pointers.current.size === 2) {
      // Second finger: switch to pinch-zoom, abandoning whatever was in progress.
      gesture.current = { kind: 'pinch' };
      pinch.current = null;
      setDraggingId(null);
      setCursor(null);
      attach();
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (gesture.current?.kind === 'pinch') return;
    if (isInteractiveTarget(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    if (isConnecting) onCancelConnection();
    onSelectBlock(null);
    onSelectConnection(null);
    gesture.current = { kind: 'pan', last: { x: e.clientX, y: e.clientY } };
    attach();
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isConnecting && !gesture.current) setCursor(toWorld(e.clientX, e.clientY));
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (isInteractiveTarget(e.target)) return;
    onCreateBlock(currentTab === 'ideas' ? 'idea' : 'story', toWorld(e.clientX, e.clientY));
  };

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (isConnecting || gesture.current?.kind === 'pinch') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    onSelectBlock(id);
    onSelectConnection(null);
    gesture.current = {
      kind: 'drag',
      id,
      offset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      start: { x: e.clientX, y: e.clientY },
      moved: false
    };
    setDraggingId(id);
    attach();
  };

  const handleBlockClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isConnecting && connectionStart && connectionStart !== id) {
      onCompleteConnection(id);
    }
  };

  const handleResizeStart = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const block = blocks.find(b => b.id === id);
    if (!block || block.isMinimized) return;
    onSelectBlock(id);
    gesture.current = {
      kind: 'resize',
      id,
      start: { x: e.clientX, y: e.clientY },
      startWidth: block.width,
      startHeight: block.height
    };
    attach();
  };

  const handleConnectDragStart = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    if (isConnecting && connectionStart && connectionStart !== id) {
      onCompleteConnection(id);
      return;
    }
    onStartConnection(id);
    onSelectBlock(id);
    gesture.current = { kind: 'connect', from: id, start: { x: e.clientX, y: e.clientY }, moved: false };
    setCursor(toWorld(e.clientX, e.clientY));
    attach();
  };

  // ---------- Connections ----------
  const blockMap = useMemo(() => new Map(blocks.map(b => [b.id, b])), [blocks]);

  const connections = useMemo(() => {
    const list: { key: string; from: string; to: string; d: string; mid: Point }[] = [];
    for (const block of blocks) {
      for (const targetId of block.connections) {
        const target = blockMap.get(targetId);
        if (!target) continue;
        const geo = connectionBetweenBlocks(block, target);
        list.push({ key: `${block.id}->${targetId}`, from: block.id, to: targetId, d: geo.d, mid: geo.mid });
      }
    }
    return list;
  }, [blocks, blockMap]);

  const colors = LINE_COLORS[currentTab];
  const sourceBlock = connectionStart ? blockMap.get(connectionStart) : undefined;
  const preview = isConnecting && sourceBlock && cursor ? connectionToPoint(sourceBlock, cursor) : null;
  const selectedConnectionGeo = selectedConnection
    ? connections.find(c => c.from === selectedConnection.from && c.to === selectedConnection.to)
    : undefined;

  const background =
    currentTab === 'ideas'
      ? `radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
         radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
         radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
         linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)`
      : `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
         radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
         radial-gradient(circle at 40% 80%, rgba(120, 255, 198, 0.3) 0%, transparent 50%),
         linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`;

  const gridSize = GRID * 2 * viewport.zoom;

  return (
    <div className="flex-1 relative overflow-hidden min-w-0">
      <div
        ref={canvasRef}
        className={`canvas-background w-full h-full relative ${
          gesture.current?.kind === 'pan' ? 'cursor-grabbing' : isConnecting ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        style={{ background, touchAction: 'none' }}
        onPointerDownCapture={handleCanvasPointerDownCapture}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Subtle dot grid that moves with the viewport */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            zIndex: 2
          }}
        >
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: 1, height: 1, overflow: 'visible', zIndex: 1 }}
          >
            <defs>
              {(['base', 'bright', 'selected'] as const).map(kind => (
                <marker
                  key={kind}
                  id={`arrow-${kind}`}
                  markerWidth="12"
                  markerHeight="12"
                  refX="11"
                  refY="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path
                    d="M 1 1 L 11 6 L 1 11 z"
                    fill={kind === 'selected' ? '#ffffff' : kind === 'bright' ? colors.bright : colors.base}
                  />
                </marker>
              ))}
            </defs>

            {connections.map(c => {
              const isSelected =
                selectedConnection?.from === c.from && selectedConnection?.to === c.to;
              const isRelated = selectedBlock === c.from || selectedBlock === c.to;
              const isHovered = hoveredConnection === c.key;
              const emphasized = isSelected || isRelated || isHovered;
              const stroke = isSelected ? '#ffffff' : emphasized ? colors.bright : colors.base;
              return (
                <g
                  key={c.key}
                  data-connection={c.key}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onPointerDown={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    onSelectBlock(null);
                    onSelectConnection({ from: c.from, to: c.to });
                  }}
                  onPointerEnter={() => setHoveredConnection(c.key)}
                  onPointerLeave={() => setHoveredConnection(null)}
                >
                  <path d={c.d} stroke="transparent" strokeWidth={18} fill="none" pointerEvents="stroke" />
                  <path
                    d={c.d}
                    stroke={stroke}
                    strokeWidth={isSelected ? 3 : emphasized ? 2.5 : 2}
                    fill="none"
                    strokeLinecap="round"
                    markerEnd={`url(#arrow-${isSelected ? 'selected' : emphasized ? 'bright' : 'base'})`}
                    style={{ transition: 'stroke 150ms' }}
                  />
                  {showFlow && (
                    <path
                      d={c.d}
                      className="flow-line"
                      stroke={colors.flow}
                      strokeWidth={isSelected ? 3 : 2}
                      fill="none"
                      opacity={emphasized ? 1 : 0.7}
                    />
                  )}
                </g>
              );
            })}

            {preview && (
              <path
                d={preview.d}
                stroke="#FACC15"
                strokeWidth={2}
                strokeDasharray="6 6"
                fill="none"
                strokeLinecap="round"
                className="preview-line"
              />
            )}
          </svg>

          {/* Remove button for the selected connection */}
          {selectedConnectionGeo && (
            <button
              data-ui
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation();
                onRemoveConnection(selectedConnectionGeo.from, selectedConnectionGeo.to);
              }}
              className="absolute bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg flex items-center gap-1"
              style={{
                left: selectedConnectionGeo.mid.x,
                top: selectedConnectionGeo.mid.y,
                transform: `translate(-50%, -50%) scale(${1 / viewport.zoom})`,
                zIndex: 30
              }}
              title="Remove this connection (Del)"
            >
              <X size={12} />
            </button>
          )}

          {blocks.map(block => (
            <StoryBlock
              key={block.id}
              block={block}
              currentTab={currentTab}
              isSelected={selectedBlock === block.id}
              isDragged={draggingId === block.id}
              isConnecting={isConnecting}
              connectionStart={connectionStart}
              isFlashing={flashBlockId === block.id}
              replaceVariables={replaceVariables}
              onDragStart={handleDragStart}
              onClick={handleBlockClick}
              onUpdateBlock={onUpdateBlock}
              onDeleteBlock={onDeleteBlock}
              onConnectDragStart={handleConnectDragStart}
              onCancelConnection={onCancelConnection}
              onToggleMinimized={onToggleMinimized}
              onResizeStart={handleResizeStart}
              onCloneIdea={onCloneIdea}
            />
          ))}
        </div>

        {/* Empty state */}
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
            <div className="text-center bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-6 max-w-md pointer-events-auto" data-ui>
              <div className="text-lg font-semibold text-white mb-1">
                {currentTab === 'ideas' ? 'No ideas yet' : 'An empty board'}
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {currentTab === 'ideas'
                  ? 'Park loose thoughts here, then clone the good ones onto the Story board.'
                  : 'Double-click anywhere to add a block, drag blocks around, and drag from a block’s edge port to connect scenes.'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    const center = screenToWorld(viewport, { x: (rect?.width ?? 800) / 2, y: (rect?.height ?? 600) / 2 });
                    onCreateBlock(currentTab === 'ideas' ? 'idea' : 'story', center);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-500 hover:to-cyan-500 text-sm flex items-center gap-2 shadow-lg"
                >
                  <Plus size={14} /> Add {currentTab === 'ideas' ? 'idea' : 'story block'}
                </button>
                {currentTab === 'story' && (
                  <button
                    onClick={onLoadRequest}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-2 border border-white/10"
                  >
                    <Upload size={14} /> Load project
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connecting hint */}
        {isConnecting && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-400/50 text-yellow-100 text-xs px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none"
            style={{ zIndex: 40 }}
          >
            Click or drop on another block to connect · Esc to cancel
          </div>
        )}

        {/* Edge tabs to reopen hidden panels */}
        {!showVariables && (
          <button
            data-ui
            onClick={onToggleVariables}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-purple-600/60 border border-l-0 border-white/15 rounded-r-xl px-1.5 py-4 text-gray-300 hover:text-white backdrop-blur-md transition-colors"
            style={{ zIndex: 40 }}
            title="Show Variables panel (V)"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
        {!showProperties && (
          <button
            data-ui
            onClick={onToggleProperties}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-indigo-600/60 border border-r-0 border-white/15 rounded-l-xl px-1.5 py-4 text-gray-300 hover:text-white backdrop-blur-md transition-colors"
            style={{ zIndex: 40 }}
            title="Show Properties panel (P)"
          >
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
