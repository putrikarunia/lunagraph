# Visual Code Editor Architecture Plan
**Date:** November 16, 2025
**Status:** Phase 2 In Progress - Dev Server & Snapshot Rendering

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
│  - Canvas with zoom/pan                 │
│  - Edit mode (FEElement tree)           │
│  - Props/Styles panels                  │
│  - State Simulator (toggle mock values) │
│  - Bottom bar with tabs + code viewer   │
└─────────────────┬───────────────────────┘
                  ↕ HTTP + WebSocket
┌─────────────────────────────────────────┐
│  Lunagraph Dev Server (Node.js)         │
│  - Reads ComponentIndex.json            │
│  - Extracts component return JSX        │
│  - Extracts variables + initial values  │
│  - Intelligent merge with Claude CLI    │
│  - Watches for file changes             │
└─────────────────┬───────────────────────┘
                  ↕ File System + Claude CLI
┌─────────────────────────────────────────┐
│  User's Codebase                        │
│  - Components (Button, Card, etc.)      │
│  - Pages (page.tsx files)               │
│  - .lunagraph/ComponentIndex.json       │
│  - .lunagraph/components.ts             │
└─────────────────────────────────────────┘
```

### 1. CLI (Static Analysis)
**Package:** `@lunagraph/cli` ✅ **Complete**

**Commands:**
```bash
lunagraph scan    # Scan codebase for components
```

**Output:**
- `.lunagraph/ComponentIndex.json` - Component metadata with source paths
- `.lunagraph/components.ts` - Auto-generated imports for editor

**Recent improvements:**
- ✅ Fixed default export handling (uses filename as key, not "default")
- ✅ Tracks actual component definition files (not re-export files)
- ✅ Auto-generates import statements correctly

### 2. Dev Server (Runtime Bridge)
**Package:** `@lunagraph/dev-server` ✅ **Complete**

**Responsibilities:**
- HTTP server for file read/write (default port 4001)
- WebSocket server for live file watching
- Extract component return JSX + variables + initial values
- Intelligent merge using Claude CLI (hybrid approach)
- Path validation for security

**API Endpoints:**
```
GET  /api/files/:filePath  → Returns { returnJSX, variables, initialValues, props, raw }
POST /api/files/:filePath  → Accepts { elements }, merges with Claude, writes file
```

**Why separate process?**
- Framework-agnostic (works with Next.js, Vite, CRA, etc.)
- Can't access file system from browser
- Enables real-time file watching
- Can invoke Claude CLI with full codebase context

### 3. Editor (Browser UI)
**Package:** `@lunagraph/editor` 🔄 **In Progress**

**Component:** `<LunagraphEditor />`
- Connects to dev server via HTTP + WebSocket
- Canvas with zoom/pan controls
- Multi-file editing with tabs
- Visual canvas, assets panel, insert panel
- Props/Styles panels (right sidebar)
- Bottom bar with code viewer and Save button
- State Simulator panel (upcoming)

### 4. Codegen (JSX ↔ FEElement Conversion)
**Package:** `@lunagraph/codegen` ✅ **Complete**

**Functions:**
- `generateJSX(elements)` - Converts FEElement tree to formatted JSX string
- `parseJSX(jsx)` - Converts JSX string to FEElement tree
- `extractComponentReturn(code)` - Extracts return JSX, variables, initial values, props
- `extractComponentDependencies(elements)` - Finds component dependencies

---

## The Snapshot Rendering Breakthrough

### The Problem: Expressions in JSX

When opening a file for editing, we face a critical challenge:

**Component source:**
```tsx
export function ProductList() {
  const [isLoading, setIsLoading] = useState(false)
  const products = [/* ... */]

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {products.map(p => <Card key={p.id}>{p.name}</Card>)}
    </div>
  )
}
```

**The JSX contains expressions:**
- `{isLoading && <LoadingSpinner />}`
- `{products.map(...)}`
- `{p.name}`

**Initial approaches that don't work:**

❌ **Parse JSX directly:**
```typescript
parseJSX(returnJSX)  // Skips all {expressions}, results in empty components
```

❌ **Create "expression" element type:**
```typescript
{ type: 'expression', code: 'isLoading && <LoadingSpinner />' }
// How do we make this visually editable? Can't render it.
```

### The Solution: Snapshot Rendering

**Key insight:** Render the component with mock values → get fully-evaluated static JSX → parse that.

**Like Figma variants:** Toggle states to see/edit different views of the component.

**Process:**

```
1. Server extracts:
   returnJSX:      "{isLoading && <LoadingSpinner />}"
   variables:      ["isLoading", "products"]
   initialValues:  { isLoading: false, products: [...] }
   props:          []

2. Browser creates snapshot function:
   function snapshot(isLoading, products) {
     return <div>
       {isLoading && <LoadingSpinner />}
       {products.map(p => <Card key={p.id}>{p.name}</Card>)}
     </div>
   }

3. Browser renders with mock values:
   const element = snapshot(false, [
     { id: 1, name: 'Laptop' },
     { id: 2, name: 'Mouse' }
   ])

4. Convert React element to static JSX:
   const staticJSX = reactElementToJSXString(element)
   // Result: "<div><Card>Laptop</Card><Card>Mouse</Card></div>"

5. Parse static JSX to FEElements:
   const elements = parseJSX(staticJSX)
   // Now we have editable FEElement tree!
```

**State Simulator UI:**
```
┌─────────────────────────────────────────┐
│ State Simulator                         │
├─────────────────────────────────────────┤
│ isLoading:  [false ▼]                   │
│   • false (initial)                     │
│   • true                                │
├─────────────────────────────────────────┤
│ products:   [3 items ▼]                 │
│   • Empty array []                      │
│   • 3 items (initial)                   │
│   • 10 items                            │
└─────────────────────────────────────────┘
```

**Benefits:**
- Designer can toggle `isLoading: true` to see/edit loading state
- Designer can toggle `products: []` to see/edit empty state
- All states become visually editable
- Like Figma's component variants

---

## The Hybrid Merge Strategy

### Challenge: Preserve Logic When Saving

When designer edits visual structure, we need to preserve:
- React hooks (useState, useEffect, useQuery)
- Event handlers (onClick, onChange)
- Computed values (const filtered = products.filter(...))
- Type definitions and imports

### Solution: Hybrid Approach

**1. Deterministic Structure Generation**
```typescript
const generatedJSX = generateJSX(elements)
// Clean JSX structure from designer's edits
```

**2. Component Dependency Detection**
```typescript
const componentDeps = extractComponentDependencies(elements)
// Which components need to be imported
```

**3. Claude CLI Intelligent Merge**
```typescript
await mergeWithClaude({
  originalCode,     // Original file with all logic
  generatedJSX,     // New JSX structure from designer
  filePath,         // For context
  componentImports, // Required imports
  stateContext      // Which mock values were used (future)
})
```

**Claude's task:**
```
Original file:
  [full component with hooks, handlers, logic]

Generated JSX:
  <div>
    <Button>Submit</Button>  ← Designer changed from "Deploy"
    <Card>...</Card>
  </div>

Your task:
- Replace the return statement with the new JSX
- Preserve ALL hooks, handlers, and logic
- Update imports if new components added
- Maintain code style and formatting
```

**Why Claude CLI, not API:**
- ✅ Uses user's existing Claude subscription (cost savings)
- ✅ Claude Code can read entire codebase for context
- ✅ Better understanding of project conventions
- ✅ Can detect Claude CLI availability, fallback to deterministic

**Fallback (no Claude):**
- Simple AST manipulation to replace return statement
- Basic import management
- Works but may require manual cleanup for complex changes

---

## Variable Extraction via AST

### The Challenge

Components have many types of variables:
- Props: `function Card({ title, children })`
- State: `const [isOpen, setIsOpen] = useState(false)`
- Computed: `const filtered = items.filter(x => x.active)`
- Handlers: `const handleClick = () => { ... }`
- Hook data: `const { data, isLoading } = useQuery()`

We need to:
1. Find all variables used in JSX
2. Extract their initial values
3. Distinguish props from internal variables

### Solution: Multi-Pass AST Analysis

**Implementation:** `packages/codegen/src/extractComponentReturn.ts`

**Pass 1: Find component function**
```typescript
traverse(ast, {
  FunctionDeclaration(path) { /* ... */ },
  ArrowFunctionExpression(path) { /* ... */ }
})
```

**Pass 2: Extract props from parameters**
```typescript
function Component({ title, children }) {
  //                  ^^^^^^^^^^^^^^^^^ extract these
}
```

**Pass 3: Find return statement JSX**
```typescript
return (
  <div>{title}</div>  ← Extract this JSX
)
```

**Pass 4: Find all variables used in JSX**
```typescript
// Traverse JSX, find identifiers in {expressions}
{title}          → variables.add('title')
{products.map}   → variables.add('products')
{isLoading && ...} → variables.add('isLoading')
```

**Pass 5: Extract initial values**

```typescript
// useState
const [isLoading, setIsLoading] = useState(false)
→ initialValues.isLoading = false

// const declarations
const products = [{ id: 1, name: 'Laptop' }]
→ initialValues.products = [{ id: 1, name: 'Laptop' }]

// Arrow functions
const handleClick = () => {}
→ initialValues.handleClick = () => {}

// Function declarations
function handleSubmit() {}
→ initialValues.handleSubmit = () => {}

// Hook destructuring
const { data, isLoading } = useQuery()
→ initialValues.data = undefined
→ initialValues.isLoading = undefined
```

**Result:**
```typescript
{
  returnJSX: "<div>{isLoading && <LoadingSpinner />}...</div>",
  variables: ["isLoading", "products", "handleClick"],
  initialValues: {
    isLoading: false,
    products: [{ id: 1, name: 'Laptop' }, ...],
    handleClick: () => {}
  },
  props: []  // or ["title", "children"] if it has props
}
```

---

## The FEElement Abstraction

### Why FEElement instead of direct DOM editing?

**Problem: DOM ≠ JSX Structure**

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

interface TextLeafNode {
  id: string
  type: 'text'
  text: string
}
```

**Benefits:**
- 1:1 mapping to JSX source
- Deterministic code generation
- Can track changes easily
- Represents JSX concepts (props, components, children slots)
- Works with snapshot rendering (post-evaluation)

---

## Current Implementation Status

### ✅ Completed (Phase 1 & 2)

**CLI Package:**
- ✅ Component scanning (function components, arrow functions, forwardRef)
- ✅ Props extraction from parameters
- ✅ Support for inline intersection types
- ✅ HTML/library component prop filtering
- ✅ Re-export tracking fix
- ✅ Auto-generates `.lunagraph/components.ts`
- ✅ Default export handling fix

**Dev Server Package:**
- ✅ Express HTTP server + WebSocket
- ✅ File read endpoint (extract return JSX + variables)
- ✅ File write endpoint with Claude CLI integration
- ✅ Variable initial value extraction (useState, const, functions)
- ✅ Path validation for security
- ✅ Hybrid merge strategy (deterministic + Claude)

**Codegen Package:**
- ✅ generateJSX() - FEElement tree → formatted JSX
- ✅ parseJSX() - JSX string → FEElement tree
- ✅ extractComponentReturn() - Extract return JSX + variables + initial values
- ✅ Multi-line style formatting
- ✅ Component dependency extraction

**Editor Package:**
- ✅ Visual canvas with FEElement rendering
- ✅ Drag and drop (into/out of parents)
- ✅ Element resizing with handles
- ✅ Text editing (double-click, input-based)
- ✅ InsertPanel for HTML elements
- ✅ AssetsPanel for browsing components (file tree)
- ✅ Right sidebar - Props editor
- ✅ Right sidebar - Styles editor (CSS text editor)
- ✅ Canvas zoom and pan controls
- ✅ Bottom bar with code viewer (live JSX generation)
- ✅ Bottom bar Save button with loading/success/error states
- ✅ Multi-file editing with tabs
- ✅ URL param tracking (?file=component.tsx)
- ✅ Canvas header showing "Editing 💎ComponentName"
- ✅ Double-click component in Assets panel to open in new tab

**Monorepo Structure:**
- ✅ pnpm workspace with packages/cli, editor, codegen, dev-server
- ✅ apps/demo for testing
- ✅ Self-contained CSS bundle for editor (26KB)
- ✅ Hot reload with Turbopack + transpilePackages

### 🔄 In Progress (Phase 2 - Snapshot Rendering)

**Browser-side Snapshot Rendering:**
- ✅ Install `react-element-to-jsx-string` in editor package
- ✅ Create `useComponentSnapshot` hook
  - ✅ Step 1: Create snapshot function from returnJSX
  - ✅ Step 2: Render with mock values → React element
  - ✅ Step 3: Convert React element → static JSX string
  - ✅ Step 4: Parse static JSX → FEElements for canvas
- ✅ Integrate with `LunagraphEditor` for file loading
- ✅ Update save flow to pass stateContext to Claude
  - ✅ Dev server accepts `stateContext` (mock values used during editing)
  - ✅ Claude prompt explains snapshot rendering context
  - ✅ Instructs Claude to preserve dynamic code (loops, conditionals, expressions)
  - ✅ Instructs Claude to convert inline styles to Tailwind if project uses Tailwind
  - ✅ Using Sonnet model (Haiku failed to follow instructions)

### 📋 Pending (Phase 3 & Beyond)

**High Priority:**
- [ ] State Simulator UI panel
  - [ ] Display all variables with current values
  - [ ] Toggle controls for different states
  - [ ] Preset state combinations (loading, empty, error, etc.)
- [ ] Error Boundaries
  - Wrap canvas components to prevent crashes
  - Show clear error messages
  - Render error as draggable shell
  - Allow re-render when moved to valid parent

**Code Editor Improvements:**
- [ ] Allow manual code edits in bottom bar (currently read-only)
- [ ] Sync code edits back to canvas (parse JSX → update FEElement tree)

**Preview Mode (Phase 3):**
- [ ] Preview mode with iframe
- [ ] Source mapping injection (Babel/Vite plugin)
- [ ] Inspection overlay on iframe
- [ ] Navigate from Preview → Edit modes
- [ ] Breadcrumb navigation

**Future (Phase 4):**
- [ ] Multi-file context (show page with layout)
- [ ] Live component reloading (HMR integration)
- [ ] Git integration (commit, PR creation from editor)
- [ ] Collaborative editing (multiplayer)
- [ ] Component variants and states (extended state simulator)
- [ ] Responsive design modes
- [ ] A11y warnings and fixes

---

## Complete User Flows

### Flow 1: Open and Edit Existing Component (Current)

```
1. Designer opens Lunagraph editor
2. Dev server running on localhost:4001
3. Designer double-clicks "ProductList" in Assets panel
4. Editor sends GET /api/files/components/ProductList.tsx
5. Dev server extracts:
   - returnJSX with expressions
   - variables: ["isLoading", "products", "selectedId"]
   - initialValues: { isLoading: false, products: [...], selectedId: null }
   - props: []
6. Browser creates snapshot function
7. Browser renders with initialValues → React element
8. Browser converts React element → static JSX
9. Browser parses static JSX → FEElements
10. Canvas displays editable component
11. Designer changes button text "Add to Cart" → "Buy Now"
12. Designer clicks Save
13. Editor sends POST /api/files/components/ProductList.tsx
    with updated elements
14. Dev server generates JSX from elements
15. Dev server calls Claude CLI to merge with original file
16. Claude preserves all hooks/logic, updates return JSX
17. Dev server writes merged code to file
18. Success message shown to designer
```

### Flow 2: Edit Different Component States (Upcoming)

```
1. Designer opens ProductList component
2. State Simulator shows:
   - isLoading: false (initial)
   - products: 3 items (initial)
   - selectedId: null (initial)
3. Designer toggles isLoading: true
4. Canvas re-renders with loading state
5. Designer sees LoadingSpinner appears
6. Designer edits LoadingSpinner message
7. Designer toggles products: [] (empty)
8. Canvas re-renders with empty state
9. Designer adds EmptyState component
10. Designer saves changes
11. Both loading and empty states preserved in code
```

### Flow 3: Compose New Component from Scratch

```
1. Designer clicks [New Component]
2. Canvas shows empty canvas
3. Designer drags Card from Assets panel
4. Designer drags Button into Card
5. Designer edits text, props, styles
6. Designer clicks [Save as...]
7. Enters: components/FeatureCard.tsx
8. Editor generates clean JSX
9. Dev server writes new file:
   export function FeatureCard() {
     return <Card>...</Card>
   }
10. File created in codebase
11. Next lunagraph scan picks it up
12. Component appears in Assets panel
```

---

## Technical Decisions & Rationale

### Why WebSocket + HTTP (Not Just HTTP)?

**HTTP endpoints for:**
- File read/write operations
- Request-response pattern fits well
- Easier to test and debug

**WebSocket for (future):**
- Real-time file watching
- Push updates from server to browser
- Live collaboration features

**Current status:** HTTP working, WebSocket scaffolded but not actively used yet.

### Why Browser-Side Snapshot Rendering?

**Options considered:**

1. **Server-side rendering:**
   - Pro: Secure, no `new Function()` in browser
   - Con: Slow roundtrips for state changes
   - Con: Server needs all component dependencies loaded
   - Con: Complex setup

2. **Browser-side rendering:** ✅ **Chosen**
   - Pro: Instant state toggling (no server roundtrip)
   - Pro: Components already loaded in browser
   - Pro: Simpler architecture
   - Con: Uses `new Function()` (but safe - only user's own code)

**Security note:** `new Function()` is safe here because:
- Only executes user's own component code
- No external input injected
- Sandboxed in React rendering context
- Same security model as developer's local environment

### Why Claude CLI Instead of Claude API?

**Benefits:**
- ✅ Uses user's existing Claude subscription (cost savings)
- ✅ Claude Code can read entire codebase (better context)
- ✅ Understands project conventions and patterns
- ✅ No API key management needed
- ✅ Better for complex merge decisions

**Fallback:** If Claude CLI not available, fall back to simple AST replacement.

### Why Separate Dev Server Package?

**Benefits:**
- Framework-agnostic (Next.js, Vite, CRA, etc.)
- Clean separation of concerns
- Can access file system (browser can't)
- Can invoke Claude CLI
- Doesn't interfere with framework features

**Alternative considered:** Next.js API routes
- Only works with Next.js
- No WebSocket support
- Couples editor to framework

---

## User Setup (Any Framework)

### 1. Install

```bash
pnpm add @lunagraph/editor
pnpm add -D @lunagraph/cli @lunagraph/dev-server
```

### 2. Scan Components

```bash
npx lunagraph scan
# Generates .lunagraph/ComponentIndex.json
# Generates .lunagraph/components.ts
```

### 3. Create Editor Route

**Next.js:** `app/editor/page.tsx`
```tsx
import { LunagraphEditor } from '@lunagraph/editor'
import '@lunagraph/editor/styles.css'

export default function EditorPage() {
  return <LunagraphEditor />
}
```

**Vite:** `src/pages/Editor.tsx`
```tsx
import { LunagraphEditor } from '@lunagraph/editor'
import '@lunagraph/editor/styles.css'

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
Navigate to: http://localhost:3000/editor
Dev server: http://localhost:4001
```

---

## Key Insights & Learnings

### 1. Snapshot Rendering Discovery

**Problem:** How to handle expressions in JSX like `{isLoading && <Spinner />}`?

**Breakthrough:** Render with mock values → get static JSX → parse that. Like Figma variants.

**Impact:** Makes stateful components visually editable. Designer can see and edit all states.

### 2. Variable Extraction is Critical

**Initial approach:** Hardcode guesses (isLoading = false, data = [])

**Better approach:** Extract actual initial values from code using AST.

**Impact:** Accurate initial state, better developer experience, fewer surprises.

### 3. Hybrid Merge Strategy

**Initial approach:** Fully deterministic code generation.

**Better approach:** Generate structure, use Claude CLI to preserve logic.

**Impact:** Clean separation of concerns, leverages AI for hard parts, maintains code quality.

### 4. Default Export Handling

**Bug:** Scanner was using "default" as key → broken imports.

**Fix:** Use filename as key for default exports.

**Lesson:** Edge cases in TypeScript AST analysis are important.

### 5. FEElement vs DOM

**Why FEElement matters:** 1:1 mapping to JSX source enables deterministic codegen.

**Why not just edit DOM:** Can't convert arbitrary DOM back to clean JSX.

**Trade-off:** Requires snapshot rendering, but worth it for clean output.

---

## Open Questions & Future Considerations

### 1. State Simulator UX

**Questions:**
- How to present complex state objects in UI?
- Should we auto-generate state combinations (loading + empty, error + retry, etc.)?
- How to handle deeply nested state?

**Possible solutions:**
- JSON editor for complex objects
- Preset state combinations
- State history/timeline

### 2. Responsive Design

**Questions:**
- How to edit mobile/tablet/desktop layouts?
- Tailwind responsive classes vs CSS media queries?
- Show multiple breakpoints side-by-side?

**Possible solutions:**
- Breakpoint toggle in editor
- Split view for multiple sizes
- Auto-detect existing responsive patterns

### 3. Styling Approach

**Questions:**
- How to handle Tailwind vs inline styles vs CSS modules?
- How to maintain consistency with existing codebase?

**Current approach:**
- Props panel for inline styles
- Can add className support later
- Claude CLI helps maintain existing patterns

### 4. Performance

**Questions:**
- How fast is snapshot rendering with complex components?
- Do we need to cache rendered snapshots?
- What about components with expensive rendering?

**Mitigations:**
- Memoize snapshot rendering
- Debounce state changes
- Lazy load components

### 5. Collaboration

**Questions:**
- How to handle multiple designers editing same file?
- Operational Transform or CRDT for real-time collab?
- Git-based collaboration sufficient?

**Future consideration:** Phase 4 feature.

---

## Success Metrics

### Designer Productivity
- Time from design idea → production-ready code
- Number of design-dev handoff iterations (goal: zero)
- Designer PR merge rate
- Designer satisfaction with editing experience

### Code Quality
- Generated code passes linting
- No manual cleanup needed by developers
- Design changes don't break functionality
- Claude merge success rate

### Adoption
- Designers actively using editor (vs. Figma)
- Number of design PRs per week
- Developer satisfaction with designer contributions
- Components created/edited per week

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete dev server with variable extraction
2. ✅ Fix CLI default export bug
3. ✅ Integrate Save button in bottom bar
4. ✅ Install react-element-to-jsx-string
5. ✅ Implement useComponentSnapshot hook
6. ✅ Test snapshot rendering with ProductList

### Short-term (Next Week)
1. ✅ Complete browser-side snapshot rendering
2. Build State Simulator UI panel
3. Test state toggling with complex components (needs State Simulator)
4. ✅ Update save flow to pass stateContext
5. Add error boundaries for canvas components

### Medium-term (Next Month)
1. Polish State Simulator UX
2. Add code editor (manual edits in bottom bar)
3. Sync code edits back to canvas
4. Test with external projects
5. Performance optimization

### Long-term (Future Phases)
1. Add Preview mode (Phase 3)
2. Source mapping injection
3. Navigation between modes
4. Git integration
5. Collaborative editing
6. Design system features
7. Plugin ecosystem

---

## Architecture Documentation

**Related files:**
- `ARCHITECTURE_SNAPSHOT_RENDERING.md` - Deep dive into snapshot rendering
- `PROGRESS.md` - Detailed progress tracking
- This file - Overall plan and vision

**Last Updated:** November 16, 2025
