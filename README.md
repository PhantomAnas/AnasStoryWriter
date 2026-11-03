# Story Writer

A visual, canvas-based story planner for writers. Lay out scenes as draggable blocks, link them with arrows that show the flow of the story, park half-formed ideas on a separate board, and keep character names in sync across the whole story with variables. Everything runs in the browser and saves to a single JSON file you own.

Built with React, TypeScript, Vite, and Tailwind CSS. No backend, no account, no telemetry.

---

## Features

### Infinite canvas
- Drag blocks anywhere, pan by dragging empty space or scrolling, zoom from 10% to 300% with Ctrl + scroll, trackpad pinch, or two fingers on touch screens.
- Double-click empty space to add a block right there.
- **Fit** button (or `F`) frames every block; `0` resets zoom to 100%.
- Hold **Shift** while dragging to snap a block to the grid.
- Viewport position and zoom are saved with the project.

### Two boards: Story and Ideas
- **Story** is the main timeline of scenes and chapters.
- **Ideas** is a scratch board for loose thoughts that are not placed yet.
- Clone an idea from the Ideas board straight onto the Story board when it earns its place.
- Idea markers can also be dropped directly onto the Story board next to the scenes they relate to.

### Story blocks
- Title, free-text content, and a live formatted preview on the block itself.
- Lightweight markup: `*text*` renders as bold, and lines starting with `- ` become bullets.
- **Satisfaction** slider (0 to 100) shown as a colored check icon and a thin red-to-green strip along the bottom edge, so you can see at a glance which scenes still need work.
- Minimize a block to a one-line header to declutter the board (`M`). Its height is restored on expand.
- Resize by dragging the bottom-right corner, or type exact numbers in the Style tab.
- Duplicate a block with `Ctrl + D`.

### Idea blocks
- **Priority** slider (0 to 100) rendered as a progress strip along the bottom edge.
- Lightbulb icon marks them apart from story blocks.

### Connections
- **Drag to connect:** drag from the circular port on a block's right edge and drop onto another block.
- **Click to connect:** click the arrow button on a block (or press `C`), then click the target. A preview line follows the pointer.
- Arrows are smooth curves that leave and enter blocks at the nearest edge and redraw as you move things.
- An animated "current" flows along each arrow from source to target, so the direction of the story is visible at a glance. Toggle it with the wave button in the bottom bar.
- Lines connected to the selected block are highlighted. Click a line to select it, then press `Delete` or the red button on the line to remove it.
- The Properties panel lists both outgoing ("leads to") and incoming ("comes from") connections, each with a jump button.
- Deleting a block cleans up every link pointing at it.

### Notes per block
Each block carries a Notes tab with:
- **Category**: Past, Villain World, or Hero World (shown as a small label on the block).
- **Special Notes**
- **Plot Twist**: a ⚡ badge appears on the block header when this is filled in.
- **Plot Holes**: a ⚠ badge appears on the block header when this is filled in, so unresolved problems are visible from the board.
- **Inspiration**: references and sources.

### Variables
- Define name/value pairs such as `x = Alex` or `antagonist = Dr. Shadow`.
- Every whole-word match of a variable name in block content is replaced with its value in the preview. Matching is case-insensitive and done in a single pass, so one value can never be re-substituted by another variable.
- Rename a character once and every scene updates.
- The panel shows how many blocks use each variable and warns about empty, duplicate, or space-containing names.

### Find and bookmarks
- Star any block to bookmark it.
- The **Find** button (or `/`) opens a search over every block on the current board by title or content, with bookmarks listed when the search is empty.
- Pick a result to pan the canvas to that block and flash it.

### Undo and redo
- `Ctrl + Z` and `Ctrl + Shift + Z` (or `Ctrl + Y`) step through up to 100 changes.
- A drag or a typing burst counts as one step; discrete actions such as delete, connect, and add are each their own step.

### Keyboard shortcuts
Press `?` in the app for the full list. Highlights: `N` add block, `I` add idea marker, `Del` delete, `B` bookmark, `M` minimize, `F` fit, arrow keys pan, `1`/`2` switch boards, `V`/`P`/`H` toggle the Variables panel, Properties panel, and toolbar. Shortcuts never fire while you are typing in a field.

### Layout
- Both side panels have a close button, and a slim tab on the canvas edge brings them back.
- The toolbar collapses to a single floating button so the canvas can take the full window.
- Panel visibility is remembered between sessions.

### Save, load, autosave, export
- **Save** (`Ctrl + S`) downloads the whole project as `story-project-<timestamp>.json`.
- **Load** (`Ctrl + O`) restores a project from that file. You can also drop a `.json` file anywhere on the window.
- **Autosave** keeps a copy in the browser's local storage after every change and restores it when you come back. It is a safety net, not a replacement for Save: the file is the only copy you fully own.
- **Export** the Story board to **Markdown** (`Ctrl + E`) or **plain text**. Scenes are written in connection order, starting from blocks nothing points at, with notes, categories, satisfaction, idea markers, the Ideas board, and a variables table. Variables are substituted in the export.
- **New empty project** lives under the Export menu and can be undone.

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- npm (ships with Node)

### Install and run

```bash
git clone https://github.com/PhantomAnas/AnasStoryWriter.git
cd AnasStoryWriter
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

### Build for production

```bash
npm run build
npm run preview
```

The static site is emitted to `dist/` and can be hosted on GitHub Pages, Netlify, Vercel, or any static file server.

### Lint and typecheck

```bash
npm run lint
npx tsc -p tsconfig.app.json --noEmit
```

---

## How to use

1. **Add a block.** Click *Add Story Block*, press `N`, or double-click the board. The block appears already selected.
2. **Write.** Edit the title directly on the block. Edit the content in the Properties panel on the right.
3. **Link scenes.** Drag from the circle on a block's right edge onto the next scene. Or click the `→` button, then click the target.
4. **Track problems.** Open the Notes tab in Properties and fill in Plot Twist or Plot Holes. The block shows a badge until you clear the field.
5. **Use variables.** Open the Variables panel on the left, add a name and value, then type the name anywhere in your content.
6. **Rate progress.** Drag the Satisfaction slider. The check icon and bottom strip change from red to green.
7. **Capture ideas.** Switch to the Ideas board (`2`), add ideas, set their priority, and clone the good ones back to the Story board.
8. **Save often.** Click *Save* to download the JSON file. Autosave covers you between saves, but the file is yours to keep and back up.

---

## Project structure

```
src/
├── App.tsx                   # Top-level layout, keyboard shortcuts, file drop, navigation
├── main.tsx                  # React entry point
├── index.css                 # Tailwind base plus animations (flow lines, flash, toasts)
├── types.ts                  # StoryBlock, Variable, ProjectData, AppState interfaces
├── constants.ts              # Colors, categories, block defaults, storage keys
├── hooks/
│   └── useStoryEditor.ts     # Project state, undo/redo history, autosave, save/load/export
├── components/
│   ├── Header.tsx            # Toolbar: undo/redo, add, find, panel toggles, save/load/export
│   ├── Canvas.tsx            # Pannable, zoomable board; pointer gestures; SVG connections
│   ├── StoryBlock.tsx        # A single block: header, preview, port, resize handle
│   ├── PropertiesPanel.tsx   # Content, Notes, Style tabs plus connections and actions
│   ├── VariablesPanel.tsx    # Variable list editor with usage counts
│   ├── BottomBar.tsx         # Board switcher, status, pan/zoom/fit, flow toggle
│   ├── ShortcutsModal.tsx    # Keyboard shortcut reference
│   └── Toast.tsx             # Transient status messages
└── utils/
    ├── project.ts            # File normalization (all versions), serialization, block factory
    ├── canvas.ts             # Connection curves, zoom-at-point, fit, coordinate math
    ├── export.ts             # Connection-order traversal, Markdown and text export
    └── textFormatting.ts     # Markup rendering (HTML-escaped) and variable substitution
```

---

## Project file format

A saved project is plain JSON:

```json
{
  "version": 2,
  "storyBlocks": [ /* StoryBlock[] */ ],
  "ideaBlocks":  [ /* StoryBlock[] */ ],
  "variables":   [ { "id": "1", "name": "x", "value": "Alex" } ],
  "viewport":    { "x": 0, "y": 0, "zoom": 1 },
  "timestamp":   "2026-11-03T12:00:00.000Z"
}
```

Each block holds its position, size, title, content, notes, color, bookmark flag, outgoing connection ids, priority, and satisfaction. See [src/types.ts](src/types.ts) for the full shape. Because the format is readable JSON, projects diff cleanly in Git and can be edited or generated by other tools.

### Compatibility
- **Older files load unchanged.** Version 1 files (a single `blocks` list) are split into story and idea boards on load. Missing fields get defaults, and a 0 priority or satisfaction stays 0.
- **Minimized blocks** are written the way earlier builds expect (`height: 64` plus `originalHeight`), so a file saved here still opens correctly in an older build.
- Files are validated on load: bad values are clamped, duplicate ids are repaired, and links to missing blocks are dropped.

### Keep your writing private
Project files are your manuscript. The repository's `.gitignore` excludes `story-project-*.json`, exported `story-*.md` / `story-*.txt`, and `projects/`, `stories/`, `drafts/` folders, so saving a file into the repo folder will not stage it. Keep your actual files in a backed-up location outside the repository.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 18 |
| Language | TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |
| Lint | ESLint 9 with typescript-eslint and react-hooks |

No backend, no database, no runtime dependencies beyond React and the icon set.

---

## Roadmap ideas

- Multi-select and group move
- Chapter grouping and collapsible regions
- Export a single chapter or a selection
- Optional light theme

Contributions and suggestions are welcome. Open an issue or a pull request.

---

## License

MIT. See [LICENSE](LICENSE) if present, or add one before publishing.
