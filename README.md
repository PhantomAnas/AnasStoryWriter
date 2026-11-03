# Story Writer

A visual, canvas-based story planner for writers. Lay out scenes as draggable blocks, link them with arrows, park half-formed ideas on a separate board, and keep character names in sync across the whole story with variables. Everything runs in the browser and saves to a single JSON file you own.

Built with React, TypeScript, Vite, and Tailwind CSS.

---

## Features

### Infinite canvas
- Drag blocks anywhere, pan the board by dragging empty space, and zoom from 10% to 300%.
- Arrow buttons and zoom controls in the bottom bar for keyboard-free navigation.
- Viewport position and zoom are saved with the project.

### Two boards: Story and Ideas
- **Story** is the main timeline of scenes and chapters.
- **Ideas** is a scratch board for loose thoughts that are not placed yet.
- Clone an idea from the Ideas board straight onto the Story board when it earns its place.
- Idea blocks can also be dropped directly onto the Story board as lightweight markers next to the scenes they relate to.

### Story blocks
- Title, free-text content, and a live formatted preview on the block itself.
- Lightweight markup: `*text*` renders as bold, and lines starting with `- ` become bullets.
- **Satisfaction** slider (0 to 100) with a red-to-green indicator so you can see at a glance which scenes still need work.
- Minimize a block to a one-line header to declutter the board. Its original height is restored on expand.

### Idea blocks
- **Priority** slider (0 to 100) rendered as a progress bar along the bottom edge of the block.
- Lightbulb icon marks them apart from story blocks.

### Connections
- Click the arrow button on a block, then click another block to draw a directed link between them.
- Arrows attach to the nearest edge automatically and redraw as you move blocks.
- Remove individual links from the Properties panel. Deleting a block cleans up every link pointing at it.

### Notes per block
Each block carries a Notes tab with:
- **Category**: Past, Villain World, or Hero World.
- **Special Notes**
- **Plot Twist**: a ⚡ badge appears on the block header when this is filled in.
- **Plot Holes**: a ⚠ badge appears on the block header when this is filled in, so unresolved problems are visible from the board.
- **Inspiration**: references and sources.

### Variables
- Define name/value pairs such as `x = Alex` or `antagonist = Dr. Shadow`.
- Every whole-word match of a variable name in block content is replaced with its value in the preview.
- Rename a character once and every scene updates.

### Bookmarks
- Star any block to add it to the Bookmarks dropdown.
- Pick a bookmark to pan the canvas to that block and flash it.

### Styling
- Sixteen accent colors per block, applied to the block border and its bookmark marker.
- Adjustable block height.
- Collapsible header and toggleable side panels so the canvas can take the full window.

### Save and load
- **Save** downloads the whole project as `story-project-<timestamp>.json`.
- **Load** restores a project from that file. Older single-list project files are migrated automatically.
- No server, no account, no telemetry. The file is the only copy.

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- npm (ships with Node)

### Install and run

```bash
git clone https://github.com/<your-username>/story-writer.git
cd story-writer
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

### Lint

```bash
npm run lint
```

---

## How to use

1. **Add a block.** Click *Add Story Block* in the header. The block appears at the center of the current view, already selected.
2. **Write.** Edit the title directly on the block. Edit the content in the Properties panel on the right.
3. **Link scenes.** Click the `→` button on a block, then click the block it should lead to.
4. **Track problems.** Open the Notes tab in Properties and fill in Plot Twist or Plot Holes. The block will show a badge until you clear the field.
5. **Use variables.** Open the Variables panel on the left, add a name and value, then type the name anywhere in your content.
6. **Rate progress.** Drag the Satisfaction slider. The check-circle icon on the block changes color from red to green.
7. **Capture ideas.** Switch to the Ideas tab in the bottom bar, add ideas, set their priority, and clone the good ones back to the Story board.
8. **Save often.** Click *Save* to download the JSON file. Click *Load* to bring it back later.

---

## Project structure

```
src/
├── App.tsx                   # Top-level layout, drag/pan/connect handlers
├── main.tsx                  # React entry point
├── index.css                 # Tailwind base plus custom animations and scrollbars
├── types.ts                  # StoryBlock, Variable, AppState interfaces
├── constants.ts              # Color palette and note categories
├── hooks/
│   └── useStoryEditor.ts     # All project state: blocks, variables, save/load
├── components/
│   ├── Header.tsx            # Toolbar: bookmarks, panel toggles, add/save/load
│   ├── Canvas.tsx            # Pannable, zoomable board with SVG connection lines
│   ├── StoryBlock.tsx        # A single draggable block
│   ├── PropertiesPanel.tsx   # Content, Notes, and Style tabs for the selected block
│   ├── VariablesPanel.tsx    # Variable list editor
│   └── BottomBar.tsx         # Tab switcher, status readout, pan and zoom controls
└── utils/
    └── textFormatting.ts     # Markup rendering and satisfaction/priority colors
```

---

## Project file format

A saved project is plain JSON:

```json
{
  "storyBlocks": [ /* StoryBlock[] */ ],
  "ideaBlocks":  [ /* StoryBlock[] */ ],
  "variables":   [ { "id": "1", "name": "x", "value": "Alex" } ],
  "viewport":    { "x": 0, "y": 0, "zoom": 1 },
  "timestamp":   "2026-11-03T12:00:00.000Z"
}
```

Each block holds its position, size, title, content, notes, color, bookmark flag, outgoing connection ids, priority, and satisfaction. See [src/types.ts](src/types.ts) for the full shape. Because the format is readable JSON, projects diff cleanly in Git and can be edited or generated by other tools.

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

- Undo and redo
- Keyboard shortcuts for add, delete, and zoom
- Export the Story board to Markdown or plain text in connection order
- Autosave to browser storage as a safety net between manual saves
- Touch and trackpad gesture support for pan and pinch-zoom

Contributions and suggestions are welcome. Open an issue or a pull request.

---

## License

MIT. See [LICENSE](LICENSE) if present, or add one before publishing.
