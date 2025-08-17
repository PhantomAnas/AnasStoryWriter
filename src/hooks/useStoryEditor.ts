import { useState, useCallback, useRef } from 'react';
import { AppState, StoryBlock, Variable } from '../types';
import { COLORS } from '../constants';

const initialState: AppState = {
  currentTab: 'story',
  storyBlocks: [],
  ideaBlocks: [],
  variables: [
    { id: '1', name: 'x', value: 'Alex' },
    { id: '2', name: 'antagonist', value: 'Dr. Shadow' }
  ],
  selectedBlock: null,
  draggedBlock: null,
  dragOffset: { x: 0, y: 0 },
  isConnecting: false,
  connectionStart: null,
  showVariables: true,
  showProperties: true,
  showBookmarks: false,
  headerCollapsed: false,
  viewport: { x: 0, y: 0, zoom: 1 },
  isDraggingViewport: false,
  viewportDragStart: { x: 0, y: 0 },
  resizingBlock: null
};

export const useStoryEditor = () => {
  const [state, setState] = useState<AppState>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const replaceVariables = useCallback((text: string) => {
    let result = text;
    state.variables.forEach(variable => {
      const regex = new RegExp(`\\b${variable.name}\\b`, 'gi');
      result = result.replace(regex, variable.value);
    });
    return result;
  }, [state.variables]);

  const createNewBlock = useCallback((forceType?: 'story' | 'idea') => {
    // Determine block type based on current tab and force type
    let blockType: 'story' | 'idea';
    let targetArray: 'storyBlocks' | 'ideaBlocks';
    
    if (forceType) {
      blockType = forceType;
      // If forcing idea type, always add to story blocks when in story tab
      if (forceType === 'idea' && state.currentTab === 'story') {
        targetArray = 'storyBlocks';
      } else {
        targetArray = forceType === 'idea' ? 'ideaBlocks' : 'storyBlocks';
      }
    } else {
      // Default behavior based on current tab
      blockType = state.currentTab === 'ideas' ? 'idea' : 'story';
      targetArray = state.currentTab === 'ideas' ? 'ideaBlocks' : 'storyBlocks';
    }
    
    const isIdeaBlock = blockType === 'idea';
    
    // Calculate center position based on current viewport
    const centerX = (window.innerWidth / 2) / state.viewport.zoom - state.viewport.x / state.viewport.zoom;
    const centerY = (window.innerHeight / 2) / state.viewport.zoom - state.viewport.y / state.viewport.zoom;
    
    const newBlock: StoryBlock = {
      id: (blockType === 'idea' && targetArray === 'ideaBlocks') 
        ? `idea-${Date.now()}` 
        : Date.now().toString(),
      type: blockType,
      x: centerX - 140, // Half of block width
      y: centerY - (isIdeaBlock ? 50 : 80), // Half of block height
      width: 280,
      height: isIdeaBlock ? 70 : 160,
      isMinimized: false,
      title: isIdeaBlock ? 'New Idea' : 'New Story Block',
      content: isIdeaBlock ? '' : 'Enter your story content here...',
      notes: {
        specialNotes: '',
        plotTwist: '',
        plotHoles: '',
        inspiration: '',
        category: 'past'
      },
      color: COLORS[0],
      isBookmarked: false,
      connections: [],
      priority: isIdeaBlock ? 50 : 0,
      satisfaction: isIdeaBlock ? 0 : 50
    };

    if (targetArray === 'ideaBlocks') {
      setState(prev => ({
        ...prev,
        ideaBlocks: [...prev.ideaBlocks, newBlock],
        selectedBlock: newBlock.id
      }));
    } else {
      setState(prev => ({
        ...prev,
        storyBlocks: [...prev.storyBlocks, newBlock],
        selectedBlock: newBlock.id
      }));
    }
  }, [state.viewport, state.currentTab]);

  const cloneIdeaToStory = useCallback((ideaId: string) => {
    // Find the idea block in either ideas array or story array (for idea blocks in story view)
    let ideaBlock = state.ideaBlocks.find(b => b.id === ideaId);
    if (!ideaBlock) {
      ideaBlock = state.storyBlocks.find(b => b.id === ideaId && b.type === 'idea');
    }
    if (!ideaBlock) return;

    // Create a new idea block in the story view (keep as idea type)
    const clonedIdeaBlock: StoryBlock = {
      ...ideaBlock,
      id: Date.now().toString(),
      type: 'idea', // Keep as idea block
      height: 70, // Idea block height
      connections: []
    };

    setState(prev => ({
      ...prev,
      storyBlocks: [...prev.storyBlocks, clonedIdeaBlock],
      currentTab: 'story',
      selectedBlock: clonedIdeaBlock.id
    }));
  }, [state.ideaBlocks]);

  const toggleBlockMinimized = useCallback((id: string) => {
    // This function is now unused - minimize logic moved to StoryBlock component
    console.log('toggleBlockMinimized - this should not be called anymore');
  }, []);
  const updateBlock = useCallback((id: string, updates: Partial<StoryBlock>) => {
    // Check which array contains the block
    const inStoryBlocks = state.storyBlocks.some(b => b.id === id);
    const inIdeaBlocks = state.ideaBlocks.some(b => b.id === id);
    
    setState(prev => ({
      ...prev,
      ...(inStoryBlocks && {
        storyBlocks: prev.storyBlocks.map(block =>
          block.id === id ? { ...block, ...updates } : block
        )
      }),
      ...(inIdeaBlocks && {
        ideaBlocks: prev.ideaBlocks.map(block =>
          block.id === id ? { ...block, ...updates } : block
        )
      })
    }));
  }, [state.storyBlocks, state.ideaBlocks]);

  const deleteBlock = useCallback((id: string) => {
    const inStoryBlocks = state.storyBlocks.some(b => b.id === id);
    const inIdeaBlocks = state.ideaBlocks.some(b => b.id === id);
    
    setState(prev => ({
      ...prev,
      ...(inStoryBlocks && {
        storyBlocks: prev.storyBlocks.filter(block => block.id !== id).map(block => ({
          ...block,
          connections: block.connections.filter(conn => conn !== id)
        }))
      }),
      ...(inIdeaBlocks && {
        ideaBlocks: prev.ideaBlocks.filter(block => block.id !== id).map(block => ({
          ...block,
          connections: block.connections.filter(conn => conn !== id)
        }))
      }),
      selectedBlock: prev.selectedBlock === id ? null : prev.selectedBlock
    }));
  }, [state.storyBlocks, state.ideaBlocks]);

  const addVariable = useCallback(() => {
    const newVariable: Variable = {
      id: Date.now().toString(),
      name: 'newVar',
      value: 'value'
    };
    setState(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }));
  }, []);

  const updateVariable = useCallback((id: string, field: 'name' | 'value', value: string) => {
    setState(prev => ({
      ...prev,
      variables: prev.variables.map(v =>
        v.id === id ? { ...v, [field]: value } : v
      )
    }));
  }, []);

  const deleteVariable = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v.id !== id)
    }));
  }, []);

  const saveProject = useCallback(() => {
    const projectData = {
      storyBlocks: state.storyBlocks,
      ideaBlocks: state.ideaBlocks,
      variables: state.variables,
      viewport: state.viewport,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.storyBlocks, state.ideaBlocks, state.variables, state.viewport]);

  const loadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const projectData = JSON.parse(event.target?.result as string);
        
        let storyBlocks = [];
        let ideaBlocks = [];
        
        if (projectData.storyBlocks && projectData.ideaBlocks) {
          // New format
          storyBlocks = projectData.storyBlocks;
          ideaBlocks = projectData.ideaBlocks;
        } else {
          // Old format - backwards compatibility
          const allBlocks = projectData.blocks || [];
          storyBlocks = allBlocks.filter((b: any) => b.type === 'story' || !b.type);
          ideaBlocks = allBlocks.filter((b: any) => b.type === 'idea');
        }
        
        // Add missing fields to existing blocks for backwards compatibility
        const updatedStoryBlocks = storyBlocks.map((block: any) => ({
          ...block,
          type: block.type || 'story', // Preserve original type
          isMinimized: block.isMinimized || false,
          priority: block.priority || (block.type === 'idea' ? 50 : 0),
          satisfaction: block.satisfaction || (block.type === 'story' ? 50 : 0)
        }));
        
        const updatedIdeaBlocks = ideaBlocks.map((block: any) => ({
          ...block,
          type: block.type || 'idea', // Preserve original type
          isMinimized: block.isMinimized || false,
          priority: block.priority || (block.type === 'idea' ? 50 : 0),
          satisfaction: block.satisfaction || (block.type === 'story' ? 50 : 0)
        }));
        
        setState(prev => ({
          ...prev,
          storyBlocks: updatedStoryBlocks,
          ideaBlocks: updatedIdeaBlocks,
          variables: projectData.variables || [],
          viewport: projectData.viewport || { x: 0, y: 0, zoom: 1 },
          selectedBlock: null
        }));
      } catch (error) {
        alert('Error loading project file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return {
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
  };
};