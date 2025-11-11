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

### Project Setup
- [x] CLI tool structure (`/cli` directory)
- [x] Build process (TypeScript compilation)
- [x] `.gitignore` for CLI artifacts and generated files
- [x] ComponentIndex.json generation

## 🔄 In Progress

Nothing currently in progress. Ready for next tasks.

## 📋 Pending Tasks

### High Priority
- [ ] **Error Boundaries** - Wrap canvas components in error boundaries to prevent crashes
  - Show clear error messages (e.g., "DropdownMenuItem needs parent DropdownMenu")
  - Render error as draggable shell so user can drag component to correct parent
  - Preserve component position in canvas tree when errored
  - Allow component to re-render when moved to valid parent

- [ ] **Right Sidebar** - Props and CSS style editor
  - Edit component props (based on ComponentIndex metadata)
  - Edit CSS styles for selected component
  - Live updates to canvas as props/styles change

- [ ] **Bottom Bar** - Code viewer and live updates
  - View generated code for components on canvas
  - Allow manual code edits
  - Show LIVE code updates as user drags/drops components and changes CSS from right sidebar
  - Sync between visual editor and code view

### Medium Priority
- [ ] Test editor with various component patterns
- [ ] Handle edge cases in component scanning (if any discovered)
- [ ] Performance testing with large ComponentIndex files

### Low Priority / Future Ideas
- [ ] Component metadata for composition requirements (`requiresParent`, `compositionOnly`)
- [ ] Templates/snippets for complex components (e.g., "Dropdown Menu Template")
- [ ] Mock context providers for safer component rendering
- [ ] Validation layer showing warnings for invalid component structure

## 🐛 Known Issues

None currently tracked.

## 📝 Notes

### Recent Changes (Latest Session)
- Fixed library component filtering (Radix UI components)
- Scanner now handles `ComponentProps<typeof Primitive>` pattern
- Extracts only inline custom props from intersection types
- Tested successfully on shadcn UI components (Button, Badge, DropdownMenuItem, etc.)

### Testing Status
- ✅ Tested on lunagraph main project components
- ✅ Tested on shadcn UI components in `/Users/putri/code/content`
- ✅ HTML element components (Button, Input, Textarea) - working
- ✅ Library wrapper components (DropdownMenuItem, Badge) - working
- ✅ Custom components (Text with forwardRef) - working

### Decision Log
See AGENTS.md for detailed decision rationale. Key decisions:
- User rejected hardcoded prop lists - prefer dynamic comparison
- Filter to keep: custom props + style + children (NOT className)
- Prioritize entries with props in deduplication
- Use source type annotation (typeNode) not resolved type for detection

## 🎯 Current Branch
`putri/all-tags-and-text-leaf`

## 📦 Unstaged Changes
- `M .gitignore` - Added CLI artifacts
- `?? app/components/ui/index.ts` - New export file
- `?? app/editor/` - Editor page
- `?? cli/` - CLI tool directory
- `?? src/` - Shared source files

---

**Last Updated:** 2025-11-10
