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

## 🔄 In Progress

Nothing currently in progress. Ready for next tasks.

## 📋 Pending Tasks

### High Priority
- [ ] **Dev Server** - Backend for file read/write operations
  - Create `@lunagraph/dev-server` package with Express + WebSocket
  - File read endpoint (load .tsx file → parse to FEElement[])
  - File write endpoint (save FEElement[] → generate JSX → write .tsx file)
  - WebSocket connection for live updates
  - Support multi-file editing workflow

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
│   ├── cli/              @lunagraph/cli       - Component scanner
│   ├── editor/           @lunagraph/editor    - React editor components
│   └── codegen/          @lunagraph/codegen   - JSX ↔ FEElement conversion
├── apps/
│   └── demo/             @lunagraph/demo      - Test application
├── package.json          Root workspace
└── pnpm-workspace.yaml   Workspace config
```

---

**Last Updated:** 2025-11-14
