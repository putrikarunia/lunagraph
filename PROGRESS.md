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

### Editor Features
- [x] Visual canvas for component rendering
- [x] InsertPanel for adding components to canvas
- [x] Default span child insertion for components with `children` prop
- [x] Drag and drop (can drag into/out of parents)
- [x] Text element editing (double-click to edit, input-based)
- [x] Element resizing with handles
- [x] Component wrapper fill behavior (components fill wrapper when explicitly sized)
- [x] Right sidebar - Props editor (edit component props with live updates)
- [x] Right sidebar - Styles editor (CSS text editor with live updates)
- [x] Props filtering (className and style excluded from props panel)
- [x] Live prop/style editing with canvas updates

### Project Setup
- [x] CLI tool structure (`/cli` directory)
- [x] Build process (TypeScript compilation)
- [x] `.gitignore` for CLI artifacts and generated files
- [x] ComponentIndex.json generation

### Monorepo Structure (Latest Session)
- [x] Restructured as pnpm workspace monorepo
- [x] `packages/cli` - CLI tool package (`@lunagraph/cli`)
- [x] `packages/editor` - Editor React components (`@lunagraph/editor`)
- [x] `apps/demo` - Demo Next.js app for testing
- [x] Fixed all imports to use relative paths in editor package
- [x] Editor package builds successfully (TypeScript + CSS)
- [x] CLI package builds successfully
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
- [ ] **Error Boundaries** - Wrap canvas components in error boundaries to prevent crashes
  - Show clear error messages (e.g., "DropdownMenuItem needs parent DropdownMenu")
  - Render error as draggable shell so user can drag component to correct parent
  - Preserve component position in canvas tree when errored
  - Allow component to re-render when moved to valid parent

- [ ] **Bottom Bar** - Code viewer and live updates
  - View generated code for components on canvas
  - Allow manual code edits
  - Show LIVE code updates as user drags/drops components and changes CSS from right sidebar
  - Sync between visual editor and code view

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

### Recent Changes (Latest Session - 2025-11-14)
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
│   ├── cli/              @lunagraph/cli
│   └── editor/           @lunagraph/editor
├── apps/
│   └── demo/             @lunagraph/demo
├── package.json          Root workspace
└── pnpm-workspace.yaml   Workspace config
```

---

**Last Updated:** 2025-11-14
