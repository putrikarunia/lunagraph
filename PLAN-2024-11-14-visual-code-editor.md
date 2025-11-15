# Visual Code Editor Architecture Plan
**Date:** November 14, 2024

## Overview

Lunagraph is a visual code editor for designers to create and edit React UIs without writing code. The key difference from Figma: **all output is real code** that lives in the codebase, enabling designers to contribute directly via PRs.

## Core Principle

**Designers work visually, but all changes are real code modifications**
- No proprietary format like Figma
- No "handoff" friction between design and dev
- Designers create PRs with production-ready code
- Frontend devs wire up logic, designers handle all visual/layout details

---

## Architecture

### Three Components

```
┌─────────────────────────────────────────┐
│  Browser: /editor page                  │
│  - LunagraphEditor component            │
│  - Preview mode (iframe)                │
│  - Edit mode (FEElement tree)           │
│  - Props/Styles panels                  │
└─────────────────┬───────────────────────┘
                  ↕ WebSocket
┌─────────────────────────────────────────┐
│  Lunagraph Dev Server (Node.js)         │
│  - Reads ComponentIndex.json            │
│  - Parses JSX → FEElement tree          │
│  - Writes changes back to files         │
│  - Watches for file changes             │
└─────────────────┬───────────────────────┘
                  ↕ File System
┌─────────────────────────────────────────┐
│  User's Codebase                        │
│  - Components (Button, Card, etc.)      │
│  - Pages (page.tsx files)               │
│  - Layouts (layout.tsx files)           │
└─────────────────────────────────────────┘
```

### 1. CLI (Static Analysis)
**Package:** `@lunagraph/cli`

**Commands:**
```bash
lunagraph scan    # Scan codebase for components
lunagraph dev     # Start dev server
```

**Output:**
- `.lunagraph/ComponentIndex.json` - Component metadata
- `.lunagraph/PageIndex.json` - Page metadata (future)
- `.lunagraph/components.ts` - Auto-generated imports (future)

### 2. Dev Server (Runtime Bridge)
**Package:** `@lunagraph/dev-server`

**Responsibilities:**
- WebSocket server (default port 4001)
- Parse JSX files to FEElement trees
- Convert FEElement trees back to JSX
- Read/write source files
- Watch for file changes and broadcast updates

**Why separate process?**
- Framework-agnostic (works with Next.js, Vite, CRA, etc.)
- Can't access file system from browser
- Enables real-time file watching

### 3. Editor (Browser UI)
**Package:** `@lunagraph/editor`

**Component:** `<LunagraphEditor />`
- Connects to dev server via WebSocket
- Two modes: Preview and Edit
- Visual canvas, layers panel, props/styles panels
- Same editing experience as current implementation

---

## The FEElement Abstraction

**Why FEElement instead of direct DOM editing?**

### Problem: DOM ≠ JSX Structure

**JSX source:**
```jsx
{items.map(item => <Card key={item.id}>{item.name}</Card>)}
```

**Rendered DOM:**
```html
<div class="card">Product 1</div>
<div class="card">Product 2</div>
<div class="card">Product 3</div>
```

If designer edits DOM directly, we can't reliably convert back to clean JSX.

### Solution: FEElement Tree

**FEElement** represents JSX structure directly:
```typescript
type FEElement = HtmlElement | ComponentElement | TextLeafNode

interface HtmlElement {
  id: string
  type: 'html'
  tag: string
  styles?: React.CSSProperties
  children?: FEElement[]
  source?: { file: string, line: number }
}

interface ComponentElement {
  id: string
  type: 'component'
  componentName: string
  props?: Record<string, any>
  styles?: React.CSSProperties
  children?: FEElement[]
  source?: { file: string, line: number }
}
```

**Benefits:**
- 1:1 mapping to JSX source
- Deterministic code generation (no AI needed for structure)
- Can track changes easily
- Represents JSX concepts (props, components, children slots)

---

## Two Operating Modes

### Mode 1: Preview Mode (Default)

**Purpose:** See the full rendered page with real layout, data, and context

**UI:**
```
┌─────────────────────────────────────────┐
│ Preview: /dashboard                     │
│ ┌─────────────────────────────────────┐ │
│ │ iframe (localhost:3000/dashboard)   │ │
│ │                                     │ │
│ │ [Sidebar from layout.tsx]           │ │
│ │                                     │ │
│ │ Dashboard                           │ │
│ │ ┌─────────────────────────────┐     │ │
│ │ │ GreetingCard                │     │ │
│ │ │ [Cancel] [Deploy]           │     │ │
│ │ └─────────────────────────────┘     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Top bar: [Preview Mode ▼] [Edit page.tsx]
```

**Interactions:**
- **Hover** → Shows source file tooltip via React DevTools
  - "GreetingCard from components/GreetingCard.tsx:5"
- **Double-click Card** → Opens GreetingCard.tsx in Edit mode
- **Double-click h1** → Opens page.tsx in Edit mode
- **Click [Edit page.tsx]** → Opens page.tsx in Edit mode

**Implementation:**
- Iframe showing user's running app
- Inspection overlay using React DevTools or data-source attributes
- Source mapping to trace DOM elements back to files

### Mode 2: Edit Mode (Structure Editing)

**Purpose:** Edit a specific file's JSX structure

**UI:**
```
┌─────────────────────────────────────────┐
│ Editing: components/GreetingCard.tsx    │
│                                         │
│ [FEElement rendering on Canvas]         │
│ └─ Card                                 │
│    ├─ CardHeader                        │
│    │  └─ CardTitle "Create project"    │
│    └─ CardContent                       │
│       └─ div                            │
│          ├─ Button "Cancel"             │
│          └─ Button "Deploy"             │
└─────────────────────────────────────────┘

Top bar: [← Back to Preview] [Save]

Layers panel:
└─ Card
   ├─ CardHeader
   │  └─ CardTitle
   └─ CardContent
      └─ div
         ├─ Button "Cancel"
         └─ Button "Deploy"
```

**Interactions:**
- Edit text, props, styles using existing panels
- Drag to reorder elements
- Add new elements from insert panel
- Delete elements
- **Double-click component instance** → Opens that component's file
  - e.g., double-click Button → opens Button.tsx

**Implementation:**
1. Dev server parses file JSX → FEElement tree
2. Browser renders using existing `renderElement()` function
3. Designer edits using existing canvas/panels
4. On save: Convert FEElement tree → JSX → write to file

---

## Complete User Flows

### Flow 1: Edit a Component on a Page

```
1. Designer opens "Pages" panel
2. Clicks [Open] on "app/dashboard/page.tsx"
3. Canvas shows Preview mode (iframe of /dashboard)
4. Designer hovers over GreetingCard component
   → Tooltip: "GreetingCard.tsx:5"
5. Designer double-clicks GreetingCard
6. Canvas switches to Edit mode
   → Now editing GreetingCard.tsx as FEElement tree
7. Designer changes "Deploy" button to "Submit"
8. Designer clicks [Save]
9. Dev server converts FEElement → JSX
10. Dev server writes to GreetingCard.tsx
11. Next.js HMR reloads the page
12. Designer clicks [← Back to Preview]
13. Canvas returns to Preview mode, sees updated button
```

### Flow 2: Edit the Page Structure

```
1. Designer in Preview mode viewing /dashboard
2. Designer clicks [Edit page.tsx] button
3. Canvas switches to Edit mode
   → Now editing page.tsx as FEElement tree
4. Canvas shows:
   └─ div
      ├─ h1 "Dashboard"
      ├─ DataTable (component instance - opaque)
      └─ GreetingCard (component instance - opaque)
5. Designer selects h1, changes text to "Today's Sales"
6. Designer drags h1 below DataTable
7. Designer clicks [Save]
8. Changes written to page.tsx
9. Designer clicks [← Back to Preview] to see result
```

### Flow 3: Compose New UI from Scratch

```
1. Designer creates new file or opens blank canvas
2. Canvas in Edit mode (no Preview needed for new files)
3. Designer drags components from "Insert" panel:
   - Card
   - Button
   - Input
4. Designer arranges layout, edits props/styles
5. Designer clicks [Save as...]
6. Saves as new component or page file
7. File created in codebase, ready to import/use
```

---

## File Types - All Handled Identically

From editor's perspective, ALL are just .tsx files:

```
Files:
├─ 📦 Components
│  ├─ GreetingCard.tsx  [Edit]
│  ├─ Card.tsx          [Edit]
│  └─ Button.tsx        [Edit]
│
├─ 📄 Pages
│  ├─ app/page.tsx            [Preview] [Edit]
│  ├─ app/dashboard/page.tsx  [Preview] [Edit]
│  └─ app/profile/page.tsx    [Preview] [Edit]
│
└─ 🎨 Layouts
   ├─ app/layout.tsx          [Preview] [Edit]
   └─ app/dashboard/layout.tsx [Preview] [Edit]
```

**Same workflow for all:**
1. Dev server parses file → FEElement tree
2. Browser renders FEElement tree
3. Designer edits
4. Convert back to JSX → save

**Difference:**
- **Components:** Only Edit mode (no route to preview)
- **Pages/Layouts:** Both Preview and Edit modes

---

## Component Instance Opacity

**Key design decision:** Component instances are opaque boxes

**When editing page.tsx:**
```
page.tsx:
└─ div
   ├─ h1 "Dashboard" ← Can edit
   └─ GreetingCard   ← Opaque box, can only edit props
      [Double-click to edit internals]
```

**To edit GreetingCard's internals:**
- Double-click → opens GreetingCard.tsx

**This matches Figma's component behavior:**
- Component instances are black boxes
- To edit component, edit the source component
- Changes propagate to all instances

---

## Source Mapping

**Critical for Preview mode:** Map DOM elements back to source files

### Option A: Build-time Injection (Recommended)

**Babel/SWC plugin adds data attributes:**
```jsx
// Source
<h1>Dashboard</h1>

// Compiled
<h1 data-source="page.tsx:6">Dashboard</h1>
```

### Option B: React DevTools Protocol

```typescript
import { attachDevTools } from 'react-devtools-inline'

const devtools = attachDevTools(iframeWindow)
const fiber = devtools.getFiberFromDOM(element)
const source = fiber._debugSource
// { fileName: 'page.tsx', lineNumber: 6 }
```

**Option A is cleaner** - no runtime overhead, works in production builds (with flag).

---

## Implementation Phases

### Phase 1: MVP - Edit Mode Only (Current)
**Status:** Partially complete

**What works:**
- ✅ FEElement tree structure
- ✅ Canvas rendering via `renderElement()`
- ✅ Layers panel
- ✅ Props/Styles panels
- ✅ Drag & drop, resize
- ✅ Component instances

**What's needed:**
- [ ] Dev server with WebSocket
- [ ] JSX parser → FEElement converter
- [ ] FEElement → JSX converter
- [ ] File read/write operations
- [ ] "Edit file" workflow

**User experience:**
- Designer can compose NEW UIs
- Designer can edit existing components by manually loading them
- No Preview mode yet
- Manual component imports required

### Phase 2: Add Dev Server & File Editing

**New capabilities:**
- [ ] Dev server starts with `npx lunagraph dev`
- [ ] WebSocket connection from browser to dev server
- [ ] Parse any .tsx file to FEElement tree
- [ ] Edit and save changes back to files
- [ ] Auto-reload on file changes

**User experience:**
- Designer clicks "Edit Button.tsx" → loads file
- Designer makes changes → saves → writes to file
- Still no Preview mode
- No more manual imports (dev server handles loading components)

### Phase 3: Add Preview Mode

**New capabilities:**
- [ ] Preview mode with iframe
- [ ] Source mapping injection (Babel/Vite plugin)
- [ ] Inspection overlay on iframe
- [ ] Navigate from Preview → Edit modes
- [ ] Breadcrumb navigation

**User experience:**
- Designer opens page in Preview mode by default
- Sees full rendered page with layout
- Hovers to see source files
- Double-clicks to edit specific file
- Complete visual code editor experience

### Phase 4: Advanced Features (Future)

- [ ] Multi-file context (show page with layout, but mark layout as read-only)
- [ ] Live component reloading (HMR integration)
- [ ] Git integration (commit, PR creation from editor)
- [ ] Collaborative editing (multiplayer)
- [ ] Component variants and states
- [ ] Responsive design modes
- [ ] A11y warnings and fixes

---

## Technical Decisions

### Why WebSocket Instead of HTTP?

**WebSocket benefits:**
- Real-time file watching and updates
- Bidirectional communication
- Lower latency for rapid edits
- Can push updates from server to browser

**HTTP would work but:**
- Need polling for file changes
- Higher latency
- More complex state management

### Why Separate Dev Server?

**Benefits:**
- Framework-agnostic (Next.js, Vite, CRA, etc.)
- Clean separation of concerns
- Can access file system (browser can't)
- Doesn't break framework features (like Next.js optimization)

**Alternative considered:** Next.js API routes
- Only works with Next.js
- Can't push updates (no WebSocket)
- Couples editor to Next.js

### Why Not Use JSX Tool's Approach?

JSX Tool is similar but focused on developers editing code. Our differences:

**Lunagraph (Designer-focused):**
- Visual-first editing
- FEElement abstraction for deterministic codegen
- Component opacity (like Figma)
- No code visibility required

**JSX Tool (Developer-focused):**
- Code-first with visual preview
- Direct code editing
- See all rendered elements

We can learn from their dev server architecture but need different UX.

---

## User Setup (Any Framework)

### 1. Install
```bash
pnpm add @lunagraph/editor
pnpm add -D @lunagraph/cli
```

### 2. Scan Components
```bash
npx lunagraph scan
# Generates .lunagraph/ComponentIndex.json
```

### 3. Create Editor Route

**Next.js:** `app/editor/page.tsx`
```tsx
import { LunagraphEditor } from '@lunagraph/editor'

export default function EditorPage() {
  return <LunagraphEditor />
}
```

**Vite:** `src/pages/Editor.tsx`
```tsx
import { LunagraphEditor } from '@lunagraph/editor'

export function EditorPage() {
  return <LunagraphEditor />
}
```

### 4. Run Dev Server
```bash
# Terminal 1: User's app
npm run dev

# Terminal 2: Lunagraph dev server
npx lunagraph dev
```

Or with concurrently:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"npx lunagraph dev\""
  }
}
```

### 5. Open Editor
```
Navigate to: http://localhost:3000/editor (or wherever you created the route)
```

---

## Key Constraints & Assumptions

### What Designers CAN Do
- ✅ Edit any visual/layout aspects
- ✅ Add/remove/reorder elements
- ✅ Change component props
- ✅ Edit styles (inline, CSS, Tailwind classes)
- ✅ Create new pages/components from scratch
- ✅ Commit and create PRs

### What Designers DON'T Handle
- ❌ React hooks (useState, useEffect)
- ❌ API calls and data fetching
- ❌ Event handlers (onClick logic)
- ❌ Business logic
- ❌ Type definitions
- ❌ State management

**Division of labor:**
- **Designers:** All presentational structure and styling
- **Developers:** Wire up data, state, and interactions

### Stripping Logic During Parsing

When parsing a page for editing, strip non-visual code:

```tsx
// Original page.tsx
export default function Dashboard() {
  const [data, setData] = useState([])     // STRIP

  useEffect(() => {                         // STRIP
    fetchData()
  }, [])

  const handleClick = () => {               // STRIP
    alert('clicked')
  }

  return (
    <div className="container">             // KEEP
      <h1>Dashboard</h1>                    // KEEP
      <Button onClick={handleClick}>        // KEEP structure, STRIP onClick
        Click me
      </Button>
    </div>
  )
}
```

**Parsed to FEElement:**
```typescript
[
  {
    type: 'html',
    tag: 'div',
    styles: { /* from className */ },
    children: [
      { type: 'html', tag: 'h1', children: [{ type: 'text', text: 'Dashboard' }] },
      { type: 'component', componentName: 'Button', props: {}, children: [...] }
    ]
  }
]
```

**When saving:** Preserve logic, only update JSX structure
- Use AST manipulation to replace return statement
- Keep hooks, handlers, etc. untouched

---

## Success Metrics

### Designer Productivity
- Time from design → production-ready code
- Number of design-dev handoff iterations (goal: zero)
- Designer PR merge rate

### Code Quality
- Generated code passes linting
- No manual cleanup needed by developers
- Design changes don't break functionality

### Adoption
- Designers actively using editor (vs. Figma)
- Number of design PRs per week
- Developer satisfaction with designer contributions

---

## Open Questions

1. **How to handle Tailwind vs inline styles vs CSS modules?**
   - Auto-detect existing patterns in codebase?
   - Let designer choose?
   - AI to maintain consistency?

2. **How to handle responsive design?**
   - Show multiple breakpoints side-by-side?
   - Tailwind responsive classes?
   - CSS media queries?

3. **How to handle dark mode / themes?**
   - Show theme toggle in editor?
   - Edit both themes simultaneously?

4. **How granular should undo/redo be?**
   - Per-property change?
   - Per-save?
   - Git-based (revert commits)?

5. **Should we support "design tokens" / design system?**
   - Extract colors, spacing, typography?
   - Enforce design system constraints?

---

## Next Steps

**Immediate (This Week):**
1. Set up dev server package structure
2. Implement WebSocket server
3. Implement JSX parser → FEElement converter
4. Test with simple component file

**Short-term (This Month):**
1. Implement FEElement → JSX converter
2. File read/write operations
3. Complete Edit mode workflow
4. Test with real project

**Medium-term (Next Month):**
1. Add Preview mode
2. Source mapping injection
3. Navigation between modes
4. Polish UX

**Long-term (Future):**
1. Git integration
2. Collaborative editing
3. Design system features
4. Plugin ecosystem
