# Lunagraph Development Progress

## ✅ Completed

### CLI Component Scanner
- [x] Basic component scanning (function components, arrow functions)
- [x] Props extraction from function parameters
- [x] Support for `React.forwardRef` components
- [x] Support for `PropsWithChildren` utility type
- [x] Deduplication when components exported from multiple files
- [x] Inline intersection type support (`ComponentProps<"button"> & { custom: string }`)
- [x] HTML element prop filtering (show only custom props + style + children)
- [x] Library component prop filtering (Radix UI, etc. - show only inline props + style + children)
- [x] Children prop detection triggers default span child in editor
- [x] Re-export tracking fix (tracks actual component definition files, not re-export files)
- [x] Auto-generates `.lunagraph/components.ts` with imports and exports
- [x] Simplified editor usage (single import instead of manual imports)

### Editor Features
- [x] Visual canvas for component rendering
- [x] InsertPanel for adding components to canvas (HTML elements only)
- [x] AssetsPanel for browsing and adding scanned components (file tree structure)
- [x] Default span child insertion for components with `children` prop
- [x] Drag and drop (can drag into/out of parents)
- [x] Text element editing (double-click to edit, input-based)
- [x] Element resizing with handles
- [x] Component wrapper fill behavior (components fill wrapper when explicitly sized)
- [x] Right sidebar - Props editor (edit component props with live updates)
- [x] Right sidebar - Styles editor (CSS text editor with live updates)
- [x] Props filtering (className and style excluded from props panel)
- [x] Live prop/style editing with canvas updates
- [x] Canvas zoom and pan controls (mouse wheel zoom, middle-click pan, space+click pan)
- [x] Bottom bar code viewer with live JSX code generation
- [x] Multi-file editing with tabs (Canvas 1, component files)
- [x] URL param tracking for editing state (?file=component.tsx)
- [x] Canvas header showing "Editing 💎ComponentName" when editing files
- [x] Double-click component in Assets panel to open in new tab

### Project Setup
- [x] CLI tool structure (`/cli` directory)
- [x] Build process (TypeScript compilation)
- [x] `.gitignore` for CLI artifacts and generated files
- [x] ComponentIndex.json generation

### Monorepo Structure
- [x] Restructured as pnpm workspace monorepo
- [x] `packages/cli` - CLI tool package (`@lunagraph/cli`)
- [x] `packages/editor` - Editor React components (`@lunagraph/editor`)
- [x] `packages/codegen` - JSX ↔ FEElement conversion (`@lunagraph/codegen`)
- [x] `apps/demo` - Demo Next.js app for testing
- [x] Fixed all imports to use relative paths in editor package
- [x] Editor package builds successfully (TypeScript + CSS)
- [x] CLI package builds successfully
- [x] Codegen package builds successfully
- [x] Self-contained CSS bundle for editor (26KB)
  - Includes full Tailwind utilities
  - Includes theme CSS variables (light/dark mode)
  - Users just import: `import '@lunagraph/editor/styles.css'`
- [x] Workspace dependencies properly linked
- [x] Hot reload working with Turbopack + transpilePackages
- [x] CLI accessible in demo app via `pnpm scan`

### Dev Server & Snapshot Rendering
- [x] Created `@lunagraph/dev-server` package with Express + WebSocket + Claude CLI integration
- [x] File read endpoint extracts component return JSX, variables, initial values, and props
- [x] File write endpoint with Claude CLI intelligent merge (preserves logic/state/hooks)
- [x] WebSocket connection for live file watching
- [x] Bottom bar Save button with loading/success/error states
- [x] Variable initial value extraction from useState, const declarations, function definitions
- [x] CLI bug fix: default exports now properly handled in ComponentIndex.json
- [x] **Browser-side snapshot rendering** (COMPLETE)
  - [x] Render component with mock values → React element (using Babel.transform + new Function)
  - [x] Convert React element → static JSX string (react-element-to-jsx-string)
  - [x] Parse static JSX → FEElements for canvas editing
  - [x] Smart default mock value generation (title → "Title", isLoading → false, etc.)
  - [x] Fixed rest parameters detection (`...props`)
  - [x] Fixed JSX spread attributes detection (`<Card {...props}>`)
  - [x] Fixed HTML element props parsing (className now preserved)
- [x] **State Panel UI** (COMPLETE)
  - [x] Right sidebar tabs: "State" | "Element" (Props/Styles)
  - [x] State panel showing all variables used in component JSX
  - [x] Type-appropriate inputs (string, number, boolean, JSON textarea for arrays/objects)
  - [x] Null value editing with text input (parses JSON or string on blur)
  - [x] Computed/derived variables marked with "computed" badge and disabled
  - [x] Live canvas updates when mock values change
  - [x] JSON editor validates on blur (not on keystroke) for better UX
  - [x] "Edit JSON" toggle for complex types (arrays/objects)
  - [x] Props tagged with visual "prop" badge
- [x] **Auto-reload after save**
  - [x] File automatically reloads after successful save
  - [x] Snapshot re-renders with updated JSX from disk
  - [x] mockValues reset to new initialValues after reload
- [x] **Smart save flow with state context** (COMPLETE)
  - [x] Dev server accepts `stateContext` (mock values used during editing)
  - [x] Claude prompt explains snapshot rendering context to prevent replacing dynamic code
  - [x] Instructs Claude to preserve all loops, conditionals, and JSX expressions
  - [x] Instructs Claude to convert inline styles to Tailwind if project uses Tailwind
  - [x] Bottom bar sends mockValues to dev server when saving
  - [x] Using Sonnet model (Haiku failed to follow instructions)

### VSCode-Style Tab Architecture
- [x] Refactored tab architecture to eliminate circular updates
  - Removed separate `elements` state
  - Made `elements` derived from active tab (`const elements = activeTab.elements`)
  - Smart `setElements` supports both value and updater functions
- [x] Moved tabs to wrap entire canvas area (VSCode-style)
  - Tabs at top showing file names
  - Each tab renders own Canvas instance
  - Sidebars stay constant, only center content switches
- [x] Updated BottomBar to show single tab (no internal tabs)
- [x] Tab close button with Phosphor icon
- [x] URL params track active tab (`?file=components/GreetingCard.tsx`)
- [x] Removed redundant "Editing ◆ ComponentName" header

### Monorepo Dev Scripts
- [x] `pnpm dev` - Runs editor watch + demo in parallel
- [x] `pnpm dev:server` - Runs dev server with hot reload (tsx watch)
- [x] `pnpm dev:all` - Runs everything in parallel
- [x] `pnpm scan` - Scans components in demo app

## 🔄 In Progress

Nothing currently in progress.

## 📋 Pending Tasks

### High Priority

- [ ] **Error Boundaries** - Wrap canvas components in error boundaries to prevent crashes
  - Show clear error messages (e.g., "DropdownMenuItem needs parent DropdownMenu")
  - Render error as draggable shell so user can drag component to correct parent
  - Preserve component position in canvas tree when errored
  - Allow component to re-render when moved to valid parent

- [ ] **Code Editor Improvements**
  - Allow manual code edits in bottom bar (currently read-only)
  - Sync code edits back to canvas (parse JSX → update FEElement tree)

### Medium Priority
- [ ] Test hot reload functionality (edit packages/editor/src components and verify changes reflect in demo)
- [ ] Test CLI + Editor workflow in external project (e.g., `/Users/putri/code/content`)
- [ ] Update `/code/content` symlink to point to new monorepo structure
- [ ] Test editor with various component patterns
- [ ] Handle edge cases in component scanning (if any discovered)
- [ ] Performance testing with large ComponentIndex files
- [ ] Document package usage for external developers

### Low Priority / Future Ideas
- [ ] Component metadata for composition requirements (`requiresParent`, `compositionOnly`)
- [ ] Templates/snippets for complex components (e.g., "Dropdown Menu Template")
- [ ] Mock context providers for safer component rendering
- [ ] Validation layer showing warnings for invalid component structure

## 🐛 Known Issues

None currently tracked.

## 📝 Notes

### Recent Changes (2025-11-16 - Part 2: State Panel Implementation)

**State Panel Complete:**
- Created `StatePanel.tsx` component with intelligent variable editors:
  - String inputs for text values
  - Number inputs for numeric values
  - Boolean checkboxes with true/false labels
  - JSON textarea for arrays and objects with syntax validation
  - Null value editing (accepts JSON or plain text, parses on blur)
  - Function values shown as read-only `() => {...}`
- Type-appropriate inputs automatically selected based on value type
- "Edit JSON" toggle button for complex types (arrays/objects)
- JSON validation on blur instead of keystroke (better UX for editing)
- Computed/derived variables (like `totalProducts`, `inStockCount`) marked with gray "computed" badge
- Computed variables have disabled inputs (read-only)
- Props tagged with blue "prop" badge for visibility
- Live canvas updates when mock values change (re-triggers snapshot rendering)

**Right Sidebar Tabs:**
- Tab 1: "State" - Shows all variables with editable mock values
- Tab 2: "Element" - Shows Props/Styles for selected element
- Clean tab UI matching left sidebar style

**Auto-reload After Save:**
- Added `onSaveSuccess` callback to BottomBar component
- Automatically reloads file after successful save operation
- Updates tab with new `returnJSX`, `variables`, `initialValues`, `props`
- Resets `mockValues` to new initial values from file
- Snapshot re-renders automatically with updated content
- Fixes issue where saved changes weren't reflected in canvas

**UX Improvements:**
- JSON editor doesn't crash when typing incomplete JSON
- Null values are now editable (type a value and it converts on blur)
- Clear visual distinction between editable and computed values
- Smooth workflow: edit state → see changes → save → auto-refresh

### Recent Changes (2025-11-16 - Part 1: Snapshot Rendering & Tab Architecture)

**Snapshot Rendering Complete:**
- Implemented full browser-side snapshot rendering pipeline:
  - JSX with expressions (`{title}`, `{...props}`) → Babel transforms to React.createElement
  - Execute with mock values → React element tree
  - react-element-to-jsx-string → static JSX string
  - parseJSX → FEElements for canvas editing
- Added smart default mock value generation:
  - `title` → `"Title"` (capitalized string)
  - `isLoading` → `false` (boolean pattern)
  - `items` → `[]` (array pattern)
  - `props` → `{}` (rest parameter)
  - `children` → `null`
- Fixed critical bugs in component extraction:
  - Rest parameters detection: `function Comp({ title, ...props })` now captures `props`
  - JSX spread attributes: `<Card {...props}>` now captured as variable
  - Added `@babel/standalone` for JSX → JS transformation in browser
- Fixed HTML element props not being preserved:
  - Added `props` field to `HtmlElement` type
  - Updated `parseJSX` to store props (className, id, etc.)
  - Updated `generateJSX` to output props for HTML elements
  - Now `<div className="...">` correctly shows in code editor

**VSCode-Style Tab Architecture:**
- Completely refactored tab system to eliminate circular updates:
  - Removed separate `elements` state - now derived from active tab
  - Each tab owns its elements, no syncing needed
  - `setElements` is smart updater that modifies active tab
- Restructured UI to match VSCode:
  - Tabs moved to top of canvas area (not bottom bar)
  - Each tab renders its own Canvas instance
  - Sidebars (Layers/Assets, Props/Style) stay constant
  - Only center content (canvas + code) switches per tab
- Tab UI improvements:
  - Bigger tabs with better padding (`px-4 py-2.5`)
  - Phosphor X icon for close button (not nested button)
  - Removed redundant "Editing ◆ ComponentName" header
  - URL params automatically track active file

**Monorepo Dev Scripts:**
- Added `pnpm dev` - Runs editor watch + demo dev in parallel
- Added `pnpm dev:server` - Runs dev server with tsx hot reload from apps/demo
- Added `pnpm dev:all` - Runs everything (editor + demo + dev-server)
- Added `pnpm scan` - Runs component scanner
- Dev server now runs from correct directory (apps/demo) to find components
- Hot reload working with tsx watch for dev server changes

**Bug Fixes:**
- Fixed nested `<button>` HTML error in tab close buttons
- Fixed "Maximum update depth exceeded" from circular tab/elements sync
- Fixed console.log causing Next.js async params error
- Fixed dev server running from wrong directory (couldn't find components)

### Recent Changes (2025-11-15)

**Dev Server Package:**
- Created `@lunagraph/dev-server` package for file read/write operations
- Express HTTP server + WebSocket for live file watching
- Claude CLI integration for intelligent code merging
  - Hybrid approach: deterministic structure generation + Claude for preserving logic/state/hooks
  - Detects Claude CLI availability, falls back to deterministic merge
  - Prompts Claude with original file + new JSX + component imports
- Security: Path validation to prevent directory traversal attacks

**Component Return Extraction:**
- Added `extractComponentReturn()` to codegen package
- Extracts return statement JSX from component functions
- Finds all variables used in JSX (state, props, computed values)
- Identifies which variables are props vs internal
- Extracts initial values from:
  - `useState(initialValue)` → captures initial state
  - `const variable = [...]` → captures arrays/objects/primitives
  - `const handleClick = () => {}` → captures arrow functions
  - `function handleClick() {}` → captures function declarations
  - `const { data, isLoading } = useQuery()` → captures destructured values
- Evaluates literal values (strings, numbers, booleans, arrays, objects)

**CLI Bug Fix:**
- Fixed default export handling in scanner
- Before: ComponentIndex.json had `"default": { ... }` which broke imports
- After: Uses filename as key: `"ProductList": { "exportName": "default" }`
- Auto-generated components.ts now properly imports: `import ProductList from './ProductList'`

**Bottom Bar Improvements:**
- Added Save button with loading/success/error states
- Integrated with dev server file write endpoint
- Only shows Save button for file tabs (not free canvas)
- Visual feedback: "Saving..." → "Saved!" → auto-hide

**Snapshot Rendering Approach (In Progress):**
- Goal: Render components with mock data to get fully-evaluated static JSX
- Server sends: `returnJSX` (with {expressions}), `variables`, `initialValues`, `props`
- Browser will:
  1. Create snapshot function from returnJSX
  2. Render with mock values from initialValues
  3. Convert React element → static JSX (react-element-to-jsx-string)
  4. Parse static JSX → FEElements for canvas
- Allows editing different states (isLoading: true/false, products: [...], etc.)
- Similar to Figma variants - toggle states to see/edit different views

**Package Structure:**
- Added `packages/dev-server/` to monorepo
- Dependencies: express, ws, chokidar, chalk, cors
- Uses @lunagraph/codegen for JSX parsing and generation

### Recent Changes (2025-11-14 - Part 2)

**CLI Improvements:**
- Fixed re-export tracking bug - scanner now tracks actual component definition files
  - Before: `components/ui/index.tsx` for all components
  - After: `components/ui/button.tsx`, `components/ui/card.tsx`, etc.
  - Uses `declaration.getSourceFile()` to find actual source location
- Auto-generates `.lunagraph/components.ts` file with all imports and exports
  - Eliminates need for manual component imports in editor
  - Single import: `import * as lunagraph from './.lunagraph/components'`
  - Automatically keeps imports in sync with scanned components

**Bottom Bar Code Viewer:**
- Created `@lunagraph/codegen` package for JSX ↔ FEElement conversion
  - `generateJSX()` - converts FEElement tree to formatted JSX string
  - `parseJSX()` - converts JSX string to FEElement tree (for dev server)
  - Shared types between editor and dev server
- Live code generation as user edits canvas
- Multi-line style formatting for readability (2+ properties)
  ```jsx
  style={{
    "width": "200px",
    "height": "100px"
  }}
  ```
- Copy button to clipboard

**Multi-File Editing with Tabs:**
- Tabs UI in bottom bar showing all open files
- Default "Canvas 1" tab for free canvas editing
- Double-click component in Assets panel → opens in new tab
- Tab management:
  - Click tab to switch active file
  - Hover tab → X button to close (when 2+ tabs)
  - Auto-switch to adjacent tab when closing active tab
  - Each tab maintains its own element tree
- URL param tracking (`?file=component.tsx`) for persistence on refresh

**Canvas Improvements:**
- Added zoom and pan controls using `react-zoom-pan-pinch`
  - Mouse wheel to zoom in/out
  - Middle-click drag to pan
  - Space + left-click to pan
  - Zoom controls widget in corner
- Canvas header when editing component files
  - Shows "Editing 💎ComponentName" with purple diamond icon
  - X button to close and return to free canvas
- Overlays rendered outside transform component (don't scale with zoom)
- Drag preview scales with canvas zoom for accurate positioning

**Assets Panel:**
- File tree structure showing component organization
- Purple diamond icons for components, folder icons for directories
- Single-click to add component to canvas
- Double-click to open component for editing
- Search functionality for finding components

**UX Improvements:**
- Separated HTML elements (Insert panel) from components (Assets panel)
- Improved code readability with multi-line style formatting
- Persistent editing state via URL params
- Visual indication of active tab and editing mode

### Previous Session (2025-11-14 - Part 1)
**Right Sidebar Implementation:**
- Added PropsPanel component for editing component props
- Added StylesPanel component with CSS text editor
- Props and Styles panels stack vertically in right sidebar (Figma-style)
- Props editor filters out `style` and `className` (handled separately)
- Live updates to canvas as props/styles change
- Auto-parsing of prop types (string, number, boolean, JSON objects)
- Component wrapper fill behavior - components automatically fill wrapper when explicitly sized

**Component Improvements:**
- Updated GreetingCard to forward props (`...props`) for style/className support
- Components now receive `width: 100%`/`height: 100%` when wrapper has explicit dimensions
- Text editing switched from contentEditable to input-based (more stable)

### Previous Session (2025-11-11)
**Monorepo Restructuring:**
- Converted project to pnpm workspace monorepo
- Created `packages/cli` and `packages/editor` as standalone packages
- Created `apps/demo` as internal test application
- Fixed all import paths to use relative imports instead of `@/` aliases
- Set up proper package.json exports for both packages

**CSS Bundling:**
- Made editor package self-contained with bundled CSS (26KB)
- Includes full Tailwind utilities + theme CSS variables
- Supports light and dark mode out of the box
- No dependency on user's Tailwind configuration
- Users import styles: `import '@lunagraph/editor/styles.css'`

**Build System:**
- Both packages build successfully (TypeScript + CSS for editor)
- Hot reload working with Turbopack and `transpilePackages`
- CLI accessible as `lunagraph` command in workspace apps

### Testing Status
- ✅ Tested on lunagraph main project components
- ✅ Tested on shadcn UI components in `/Users/putri/code/content`
- ✅ HTML element components (Button, Input, Textarea) - working
- ✅ Library wrapper components (DropdownMenuItem, Badge) - working
- ✅ Custom components (Text with forwardRef) - working
- ✅ Monorepo builds successfully
- ✅ Demo app runs with editor package
- ⏳ Hot reload - needs testing
- ⏳ External project usage - needs testing

### Decision Log
See AGENTS.md for detailed decision rationale. Key decisions:
- User rejected hardcoded prop lists - prefer dynamic comparison
- Filter to keep: custom props + style + children (NOT className)
- Prioritize entries with props in deduplication
- Use source type annotation (typeNode) not resolved type for detection
- **CSS strategy: Bundle self-contained CSS (not require user's Tailwind)**

## 🎯 Current Branch
`main`

## 📦 Monorepo Structure
```
lunagraph/
├── packages/
│   ├── cli/              @lunagraph/cli         - Component scanner
│   ├── editor/           @lunagraph/editor      - React editor components
│   ├── codegen/          @lunagraph/codegen     - JSX ↔ FEElement conversion
│   └── dev-server/       @lunagraph/dev-server  - File operations backend
├── apps/
│   └── demo/             @lunagraph/demo        - Test application
├── package.json          Root workspace
└── pnpm-workspace.yaml   Workspace config
```

---

**Last Updated:** 2025-11-16
