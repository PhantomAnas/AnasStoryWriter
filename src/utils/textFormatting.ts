export const formatText = (text: string): string => {
  if (!text) return '';
  
  // Replace bold text (*text*) - make it more visible
  let formatted = text.replace(/\*([^*]+)\*/g, '<strong style="color: #60A5FA; font-weight: bold;">$1</strong>');
  
  // Replace bullets (-)
  formatted = formatted.replace(/^- (.+)$/gm, '• $1');
  
  return formatted;
};

export const hasPlotTwist = (block: { notes: { plotTwist: string } }): boolean => {
  return block.notes.plotTwist.trim().length > 0;
};

export const hasPlotHole = (block: { notes: { plotHoles: string } }): boolean => {
  return block.notes.plotHoles.trim().length > 0;
};

export const getSatisfactionColor = (satisfaction: number): string => {
  // Red to Green gradient based on satisfaction (0-100)
  const red = Math.max(0, 255 - (satisfaction * 2.55));
  const green = Math.min(255, satisfaction * 2.55);
  return `rgb(${Math.round(red)}, ${Math.round(green)}, 0)`;
};

export const getPriorityColor = (priority: number): string => {
  // Red to Green gradient based on priority (0-100)
  const red = Math.max(0, 255 - (priority * 2.55));
  const green = Math.min(255, priority * 2.55);
  return `rgb(${Math.round(red)}, ${Math.round(green)}, 0)`;
};