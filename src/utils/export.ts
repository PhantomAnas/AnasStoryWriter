import { StoryBlock, Variable } from '../types';
import { NOTE_CATEGORIES } from '../constants';
import { applyVariables } from './textFormatting';

const byPosition = (a: StoryBlock, b: StoryBlock): number =>
  a.y - b.y || a.x - b.x;

/**
 * Orders blocks by following connections.
 * Starts from blocks nothing points at (top-left first), walks each chain depth-first,
 * then appends anything left over (cycles, isolated blocks) in top-left order.
 */
export const orderByConnections = (blocks: StoryBlock[]): StoryBlock[] => {
  const byId = new Map(blocks.map(b => [b.id, b]));
  const incoming = new Set<string>();
  blocks.forEach(b => b.connections.forEach(target => incoming.add(target)));

  const visited = new Set<string>();
  const ordered: StoryBlock[] = [];

  const visit = (block: StoryBlock) => {
    if (visited.has(block.id)) return;
    visited.add(block.id);
    ordered.push(block);
    block.connections
      .map(id => byId.get(id))
      .filter((b): b is StoryBlock => Boolean(b))
      .sort(byPosition)
      .forEach(visit);
  };

  const sorted = [...blocks].sort(byPosition);
  sorted.filter(b => !incoming.has(b.id)).forEach(visit);
  sorted.forEach(visit);
  return ordered;
};

/** Converts block markup (`*bold*`, `- bullet`) to standard Markdown. */
const toMarkdownBody = (content: string, variables: Variable[]): string =>
  applyVariables(content, variables)
    .replace(/\*([^*\n]+)\*/g, '**$1**')
    .trim();

const categoryLabel = (value: string): string =>
  NOTE_CATEGORIES.find(c => c.value === value)?.label ?? value;

interface ExportInput {
  storyBlocks: StoryBlock[];
  ideaBlocks: StoryBlock[];
  variables: Variable[];
  title?: string;
}

export const exportToMarkdown = ({ storyBlocks, ideaBlocks, variables, title = 'Story' }: ExportInput): string => {
  const lines: string[] = [];
  const byId = new Map(storyBlocks.map(b => [b.id, b]));
  const sub = (text: string) => applyVariables(text, variables).trim();

  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`_Exported from Story Writer on ${new Date().toLocaleString()}_`);
  lines.push('');

  const scenes = orderByConnections(storyBlocks.filter(b => b.type === 'story'));
  const markers = storyBlocks.filter(b => b.type === 'idea');

  scenes.forEach((block, index) => {
    lines.push(`## ${index + 1}. ${sub(block.title) || 'Untitled'}`);
    lines.push('');
    const body = toMarkdownBody(block.content, variables);
    if (body) {
      lines.push(body);
      lines.push('');
    }

    const meta: string[] = [];
    meta.push(`Category: ${categoryLabel(block.notes.category)}`);
    meta.push(`Satisfaction: ${block.satisfaction}%`);
    lines.push(`> ${meta.join(' · ')}`);
    lines.push('');

    const note = (label: string, value: string) => {
      if (value.trim()) {
        lines.push(`**${label}:** ${sub(value)}`);
        lines.push('');
      }
    };
    note('Plot twist ⚡', block.notes.plotTwist);
    note('Plot holes ⚠', block.notes.plotHoles);
    note('Notes', block.notes.specialNotes);
    note('Inspiration', block.notes.inspiration);

    const next = block.connections
      .map(id => byId.get(id))
      .filter((b): b is StoryBlock => b !== undefined && b.type === 'story')
      .map(b => sub(b.title) || 'Untitled');
    if (next.length) {
      lines.push(`→ Leads to: ${next.join(', ')}`);
      lines.push('');
    }
  });

  if (markers.length) {
    lines.push('## Idea markers on the story board');
    lines.push('');
    markers.forEach(b => {
      const body = toMarkdownBody(b.content, variables);
      lines.push(`- **${sub(b.title) || 'Untitled'}** (priority ${b.priority}%)${body ? `: ${body.replace(/\n+/g, ' ')}` : ''}`);
    });
    lines.push('');
  }

  if (ideaBlocks.length) {
    lines.push('## Ideas board');
    lines.push('');
    [...ideaBlocks]
      .sort((a, b) => b.priority - a.priority)
      .forEach(b => {
        const body = toMarkdownBody(b.content, variables);
        lines.push(`- **${sub(b.title) || 'Untitled'}** (priority ${b.priority}%)${body ? `: ${body.replace(/\n+/g, ' ')}` : ''}`);
      });
    lines.push('');
  }

  const named = variables.filter(v => v.name.trim());
  if (named.length) {
    lines.push('## Variables');
    lines.push('');
    lines.push('| Name | Value |');
    lines.push('|------|-------|');
    named.forEach(v => lines.push(`| ${v.name} | ${v.value} |`));
    lines.push('');
  }

  return lines.join('\n');
};

/** Plain-text version: the scenes in order, no markup, suitable for pasting into a manuscript outline. */
export const exportToPlainText = ({ storyBlocks, variables, title = 'Story' }: ExportInput): string => {
  const scenes = orderByConnections(storyBlocks.filter(b => b.type === 'story'));
  const out: string[] = [title.toUpperCase(), ''];
  scenes.forEach((block, index) => {
    out.push(`${index + 1}. ${applyVariables(block.title, variables).trim() || 'Untitled'}`);
    const body = applyVariables(block.content, variables)
      .replace(/\*([^*\n]+)\*/g, '$1')
      .trim();
    if (body) out.push(body.split('\n').map(l => `   ${l}`).join('\n'));
    out.push('');
  });
  return out.join('\n');
};

export const downloadText = (filename: string, text: string, mime = 'text/plain'): void => {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
