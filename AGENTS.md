# AI Agent Context - Lunagraph Project

> **For AI assistants:** This document provides essential context about the Lunagraph project. Read this first when starting a new session. Check [PROGRESS.md](./PROGRESS.md) for current status and pending tasks.

## Project Overview
Lunagraph is a visual React component editor/builder with two main parts:
1. **CLI Tool** (`/cli`) - Scans React components and extracts their metadata
2. **Editor UI** (`/app/editor`) - Visual canvas for building UIs with components

## Key Concepts

### Component Scanning
- CLI scans React components and generates `.lunagraph/ComponentIndex.json`
- Extracts component props with intelligent filtering
- Handles multiple React patterns: forwardRef, PropsWithChildren, intersection types, etc.

### Prop Filtering Strategy
**For HTML element components** (e.g., `Button` extends `ComponentProps<"button">`):
- Show only: custom props + `style` + `children`
- Filter out standard HTML props (onClick, className, etc.)

**For library components** (e.g., Radix UI - `ComponentProps<typeof Primitive>`):
- Show only: inline custom props + `style` + `children`
- Filter out all inherited library props

**For custom components** (no HTML/library extension):
- Show all props

### Why these filtering rules?
- Users don't need to see 100+ HTML props in the editor
- Custom props are what make components unique
- `style` is useful for layout/positioning
- `children` prop triggers default span child insertion on canvas

## Architecture

### CLI (`/cli`)
```
cli/
├── src/
│   ├── scanner/
│   │   └── component-scanner.ts    # Main scanning logic
│   ├── commands/
│   │   └── scan.ts                 # CLI scan command
│   └── index.ts
├── dist/                           # Built output
└── package.json
```

**Key file:** `cli/src/scanner/component-scanner.ts`
- `extractProps()` - Main prop extraction with filtering logic
- `extractInlineProps()` - Extracts props from intersection type literals
- `detectHTMLElement()` - Detects `ComponentProps<"element">` pattern
- `getBaseHTMLElementProps()` - Gets base HTML element props for filtering

### Editor (`/app/editor`)
```
app/
├── editor/
│   └── page.tsx                    # Main editor page
├── components/
│   └── ui/                         # UI components (Text, Button, etc.)
└── ...
```

**Key file:** `app/editor/page.tsx`
- Canvas rendering
- InsertPanel for adding components
- Uses ComponentIndex.json to show available components

### Shared Understanding
```
src/
├── components/
│   └── InsertPanel.tsx             # Detects `children` prop, adds default span
├── types/
│   └── canvas.ts                   # FEElement type for canvas elements
└── ...
```

## Development Workflow

### Building CLI
```bash
cd /Users/putri/code/lunagraph/cli
npm run build
```

### Running CLI in a project
```bash
cd /path/to/your/nextjs/project
npx lunagraph scan --pattern "components/**/*.tsx"
# Generates .lunagraph/ComponentIndex.json
```

### Testing scanner changes
1. Make changes to `cli/src/scanner/component-scanner.ts`
2. Build: `cd cli && npm run build`
3. Test on content project: `cd /Users/putri/code/content && npx lunagraph scan --pattern "components/**/*.tsx"`
4. Verify results: `cat .lunagraph/ComponentIndex.json | grep -A 20 '"ComponentName"'`

## Important Decisions Made

### Deduplication
When components are exported from multiple files (e.g., `Button.tsx` and `index.ts`):
- Prioritize entries WITH props over entries without props
- Prevents index.ts re-exports from overwriting actual component metadata

### forwardRef Handling
For `React.forwardRef<Ref, Props>` components:
- Extract props from the second type parameter
- Fall back to function parameter if type params not available

### PropsWithChildren
Components using `PropsWithChildren<{...}>`:
- Automatically add `children` prop to extracted metadata
- Triggers default span child insertion in editor

### Library Component Detection
Pattern: `/ComponentProps(?:WithoutRef|WithRef)?<typeof/`
- Radix UI and similar libraries use this pattern
- Extract ONLY inline props, not inherited library props
- Prevents bloated prop lists (100+ props → 2-5 props)

## Git Setup
- Main branch: `main`
- Current branch: `putri/all-tags-and-text-leaf`
- `.gitignore` includes: `.lunagraph/`, `cli/node_modules`, `cli/dist`

## Test Projects
- **Main project:** `/Users/putri/code/lunagraph`
- **Test project:** `/Users/putri/code/content` (Next.js with shadcn UI)

## Common Tasks

### Check specific component props
```bash
cd /Users/putri/code/content
cat .lunagraph/ComponentIndex.json | grep -A 20 '"ComponentName"'
```

### Debug scanner type detection
Look at the `typeText` variable in `extractProps()` - it shows the source annotation

### Add new prop filtering rule
Modify `extractProps()` in `component-scanner.ts`
- For HTML components: update the filtering logic around `baseProps.has(name)`
- For library components: update `isLibraryComponent` regex or filtering

## Known Patterns

### Shadcn UI Components
```typescript
// Button with inline intersection
React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

// Radix wrapper components
React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { inset?: boolean, variant?: "default" | "destructive" }
```

Scanner extracts: custom props (asChild, inset, variant) + style + children

### Custom Components
```typescript
// Text component with forwardRef
const Text = React.forwardRef<HTMLSpanElement, PropsWithChildren<{}>>(...)
```

Scanner extracts: children prop from PropsWithChildren

## Next Session Tips
- CLI scanner is stable and working well
- Main development is likely in the editor UI (`/app/editor`)
- Check [PROGRESS.md](./PROGRESS.md) for pending tasks
- Run `git status` to see current changes before starting
