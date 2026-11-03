import { Variable } from '../types';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);

export const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Renders the lightweight block markup to HTML.
 * `*text*` becomes bold, lines starting with `- ` become bullets, newlines become <br>.
 * Content is HTML-escaped first so block text can never inject markup.
 */
export const formatText = (text: string): string => {
  if (!text) return '';

  let formatted = escapeHtml(text);
  formatted = formatted.replace(
    /\*([^*\n]+)\*/g,
    '<strong class="text-blue-300 font-semibold">$1</strong>'
  );
  formatted = formatted.replace(/^- (.+)$/gm, '• $1');
  return formatted.replace(/\n/g, '<br>');
};

/**
 * Replaces every whole-word variable name with its value in a single pass,
 * so a value can never be re-substituted by another variable.
 * Longer names win over shorter ones. Matching is case-insensitive.
 */
export const applyVariables = (text: string, variables: Variable[]): string => {
  if (!text) return '';
  const lookup = new Map<string, string>();
  for (const variable of variables) {
    const name = variable.name.trim();
    if (name) lookup.set(name.toLowerCase(), variable.value);
  }
  if (lookup.size === 0) return text;

  const pattern = [...lookup.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  return text.replace(regex, match => lookup.get(match.toLowerCase()) ?? match);
};

export const hasPlotTwist = (block: { notes: { plotTwist: string } }): boolean =>
  block.notes.plotTwist.trim().length > 0;

export const hasPlotHole = (block: { notes: { plotHoles: string } }): boolean =>
  block.notes.plotHoles.trim().length > 0;

const redToGreen = (value: number): string => {
  const clamped = Math.min(100, Math.max(0, value));
  const red = Math.round(255 - clamped * 2.55);
  const green = Math.round(clamped * 2.55);
  return `rgb(${red}, ${green}, 0)`;
};

export const getSatisfactionColor = (satisfaction: number): string => redToGreen(satisfaction);

export const getPriorityColor = (priority: number): string => redToGreen(priority);
