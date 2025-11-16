# Snapshot Rendering Architecture

**Date:** 2025-11-15
**Status:** In Progress

## Overview

The Snapshot Rendering approach allows users to visually edit React components while preserving all their logic, state, and dynamic behavior. Similar to Figma's variants feature, users can toggle between different states (e.g., `isLoading: true/false`) to see and edit different views of the same component.

## The Problem

When opening a component file for visual editing, we need to:
1. Show the component's visual structure on the canvas
2. Allow drag-and-drop, resizing, and style editing
3. Preserve all logic: state, hooks, conditionals, loops, event handlers
4. Support editing different states (loading, error, success, etc.)

**Challenge:** Components contain dynamic expressions that can't be directly edited visually:
- `{title}` - variables
- `{isLoading && <div>Loading</div>}` - conditionals
- `{products.map(p => <Card>...)}` - loops
- `{onClick={() => handleClick())}` - event handlers

## The Hybrid Solution

### Architecture: Deterministic Structure + Claude Intelligence

**Backend (Dev Server):**
- Extract component return JSX with all expressions intact
- Find all variables used in the JSX
- Extract initial values from the component's code
- Send raw data to browser

**Frontend (Browser):**
- Render component with mock data → get fully-evaluated static JSX
- Parse static JSX → editable FEElements
- User edits visually
- On save: send both original file + edited JSX + state context to Claude

**Claude (Merge):**
- Receives original file (with all logic)
- Receives edited static JSX (with structural changes)
- Receives state context (which mock values were used)
- Intelligently merges: applies structural changes while preserving logic

## Backend Implementation (✅ Complete)

### 1. Component Return Extraction

**File:** `packages/codegen/src/extractComponentReturn.ts`

**What it does:**
- Parses component source code with Babel
- Extracts the return statement JSX (with expressions intact)
- Finds all identifiers used in JSX expressions
- Identifies which are props vs internal variables
- Extracts initial values from declarations

**Example Input:**
```tsx
export default function ProductList() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const products = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 }
  ]

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {products.map(p => <Card key={p.id}>{p.name}</Card>)}
    </div>
  )
}
```

**Example Output:**
```json
{
  "returnJSX": "<div>\n  {isLoading && <div>Loading...</div>}\n  {products.map(p => <Card key={p.id}>{p.name}</Card>)}\n</div>",
  "variables": ["isLoading", "products", "p"],
  "props": [],
  "initialValues": {
    "isLoading": false,
    "selectedId": null,
    "products": [
      { "id": 1, "name": "Laptop", "price": 999 },
      { "id": 2, "name": "Mouse", "price": 29 }
    ]
  }
}
```

### 2. Variable Extraction Cases

**Handled Cases:**

1. **useState declarations**
   ```tsx
   const [isLoading, setIsLoading] = useState(false)
   // → isLoading: false
   ```

2. **Const variable declarations**
   ```tsx
   const products = [{ id: 1, name: 'Laptop' }]
   // → products: [{ id: 1, name: 'Laptop' }]
   ```

3. **Arrow function constants**
   ```tsx
   const handleClick = () => { console.log('clicked') }
   // → handleClick: () => {}  (placeholder)
   ```

4. **Function declarations**
   ```tsx
   function handleAddToCart(id: number) { ... }
   // → handleAddToCart: () => {}  (placeholder)
   ```

5. **Object destructuring from hooks**
   ```tsx
   const { data, isLoading } = useQuery()
   // → data: undefined, isLoading: undefined
   ```

6. **Props from function parameters**
   ```tsx
   function GreetingCard({ title, ctaText }: Props)
   // → props: ["title", "ctaText"]
   ```

7. **Let variables**
   ```tsx
   let count = 0
   // → count: 0
   ```

**Initial Value Evaluation:**
- Literals: `true`, `42`, `"hello"`, `null`
- Arrays: `[1, 2, 3]`, `[{ id: 1 }]`
- Objects: `{ id: 1, name: "test" }`
- Functions: Stored as `() => {}` placeholder
- Complex expressions: `undefined` (can't safely evaluate)

### 3. Dev Server Endpoints

**GET /api/files/:filePath**

Returns:
```typescript
{
  success: boolean
  filePath: string
  returnJSX: string          // JSX with {expressions}
  variables: string[]        // All variables used
  initialValues: Record<string, any>  // Extracted values
  props: string[]           // Which variables are props
  raw: string              // Original file content
}
```

**POST /api/files/:filePath**

Accepts:
```typescript
{
  elements: FEElement[]     // Edited structure
  stateContext?: {          // Optional: which mock values were used
    isLoading: true,
    products: [...]
  }
}
```

Uses Claude CLI to merge changes while preserving logic.

## Frontend Implementation (🔄 In Progress)

### 1. Snapshot Rendering Flow

**Goal:** Convert `returnJSX` with expressions → static JSX without expressions

**Steps:**

1. **Create Snapshot Function**
   ```typescript
   // Dynamically create function from returnJSX
   const snapshotFn = new Function(
     'React',
     'components',  // { Card, Button, ... }
     'title',       // mock values as params
     'isLoading',
     'products',
     `
     const { Card, Button } = components;
     return ${returnJSX};
     `
   )
   ```

2. **Render with Mock Values**
   ```typescript
   const element = snapshotFn(
     React,
     components,
     'Sample Title',  // initialValues.title
     false,           // initialValues.isLoading
     [...]            // initialValues.products
   )
   ```

3. **Convert React Element → Static JSX**
   ```typescript
   import reactElementToJSXString from 'react-element-to-jsx-string'

   const staticJSX = reactElementToJSXString(element, {
     showDefaultProps: false,
     showFunctions: false,
     displayName: (el) => el.type.name || el.type
   })
   ```

4. **Parse Static JSX → FEElements**
   ```typescript
   const elements = parseJSX(staticJSX)
   // Now expressions are evaluated!
   // {title} → "Sample Title"
   // {isLoading && ...} → nothing (false)
   // {products.map(...)} → <Card>...</Card><Card>...</Card>
   ```

### 2. State Simulator UI (Pending)

**Location:** Right sidebar panel (below Props and Styles)

**Features:**
- Shows all variables with their current mock values
- Distinguishes props vs internal state
- Allow user to edit values:
  - Booleans: Toggle switch
  - Strings: Text input
  - Numbers: Number input
  - Arrays/Objects: JSON editor
- On change: re-render snapshot with new values → update canvas

**Example UI:**
```
┌─ State Simulator ────────────┐
│ Props:                       │
│  title:     [Sample Title ]  │
│  ctaText:   [Click Me     ]  │
│                              │
│ State:                       │
│  isLoading: [ ] false        │
│  selectedId: null            │
│                              │
│ Data:                        │
│  products: [Edit JSON...]    │
└──────────────────────────────┘
```

### 3. Tab State Management

**EditorTab Interface:**
```typescript
interface EditorTab {
  id: string
  name: string
  type: 'canvas' | 'file'
  filePath?: string

  // For file tabs:
  returnJSX?: string              // Original JSX with expressions
  variables?: string[]            // All variables used
  props?: string[]               // Which are props
  initialValues?: Record<string, any>  // Default values
  mockValues?: Record<string, any>     // Current user-set values

  elements: FEElement[]          // Rendered snapshot
}
```

**Flow:**
1. User opens component file
2. Load file data from dev server
3. Store `returnJSX`, `variables`, `initialValues` in tab
4. Set `mockValues = initialValues`
5. Render snapshot → `elements`
6. When user changes mock value → re-render → update `elements`

## Key Insights & Findings

### Finding 1: Props vs Internal Variables

**Problem:** Need to distinguish props from internal variables.

**Solution:** Parse function parameters to identify props.

**Why it matters:**
- Props have no initial values (come from parent)
- Internal variables have values we can extract
- UI should show them differently

**Example:**
```tsx
function GreetingCard({ title }: { title: string }) {
  const [isOpen, setIsOpen] = useState(false)
  // ...
}
```
- `title` is a prop → user must provide mock value
- `isOpen` is internal → we extracted `false` as initial value

### Finding 2: Default Exports Broke Imports

**Problem:** CLI stored default exports as:
```json
"default": { "path": "...", "exportName": "default" }
```

This generated broken imports:
```tsx
import { default } from './ProductList'  // ❌ Invalid!
```

**Solution:** Use filename as key for default exports:
```json
"ProductList": { "path": "...", "exportName": "default" }
```

Generates correct imports:
```tsx
import ProductList from './ProductList'  // ✅ Correct
```

### Finding 3: Can't Directly Parse returnJSX

**Attempted:** Directly `parseJSX(returnJSX)` in browser.

**Problem:** `parseJSX` skips all expressions:
```tsx
// Input
<CardTitle>{title}</CardTitle>

// parseJSX output
<CardTitle />  // Empty! {title} was skipped
```

**Lesson:** Must render with mock data first to evaluate expressions.

### Finding 4: Variable Extraction is Comprehensive

**Cases we handle:**
- ✅ useState
- ✅ const declarations (primitives, arrays, objects)
- ✅ Arrow functions
- ✅ Function declarations
- ✅ Object destructuring
- ✅ Let variables

**Cases we DON'T handle (intentionally):**
- ❌ Computed values like `const total = products.reduce(...)`
  - Too complex to evaluate safely
  - Set to `undefined`, user can provide mock value
- ❌ Hook return values that aren't destructured
  - Same reason
- ❌ Imported constants
  - Would need cross-file analysis

### Finding 5: Security with new Function()

**Concern:** Using `new Function()` to create snapshot function from string.

**Mitigation:**
- Only runs in browser (user's own code)
- No external input (code comes from user's files)
- Sandboxed in React render context
- Same security model as eval but cleaner

**Alternative considered:** Using Babel to transform → rejected (too heavy for browser).

## Save Flow with State Context

### When User Clicks Save

1. **Capture Current State:**
   ```typescript
   {
     originalFile: "components/ProductList.tsx",
     originalCode: "export default function...",
     editedElements: [...],
     stateContext: {
       isLoading: true,      // User was editing loading state
       products: [...]       // With these mock products
     }
   }
   ```

2. **Generate New JSX:**
   ```typescript
   const editedJSX = generateJSX(editedElements)
   ```

3. **Send to Dev Server:**
   ```typescript
   POST /api/files/components/ProductList.tsx
   {
     elements: editedElements,
     stateContext: { isLoading: true, products: [...] }
   }
   ```

4. **Dev Server Prompts Claude:**
   ```
   Original file has this structure with logic:
   {isLoading && <div className="...">Loading...</div>}

   User edited the snapshot when isLoading=true to:
   <div className="new-classes">Loading Please Wait...</div>

   Update the conditional to match the edited version while preserving
   the isLoading condition.
   ```

5. **Claude Merges:**
   - Understands the state context
   - Applies changes to the correct branch
   - Preserves all logic
   - Maintains code style

## Edge Cases & Considerations

### Edge Case 1: Multiple States Affect Same Element

```tsx
{isLoading ? <Spinner /> : error ? <Error /> : <Success />}
```

**Challenge:** User edits `<Spinner />` when `isLoading=true`. How does Claude know to update the isLoading branch?

**Solution:** State context includes all variable values. Claude infers which branch was active.

### Edge Case 2: Loops with Dynamic Data

```tsx
{products.map(product => <Card>{product.name}</Card>)}
```

**Challenge:** User edits one Card in the rendered output. How do we know it's the template?

**Solution:** Claude recognizes the pattern. When editing a Card from a `.map()`, it updates the template.

### Edge Case 3: Nested Conditionals

```tsx
{isLoggedIn && (
  isAdmin ? <AdminPanel /> : <UserPanel />
)}
```

**Challenge:** Need correct mock values for both `isLoggedIn` and `isAdmin` to see `<AdminPanel />`.

**Solution:** State simulator allows toggling all variables independently.

### Edge Case 4: Children Prop

```tsx
<Card>{children}</Card>
```

**Challenge:** `children` is a special prop that can be anything.

**Solution:**
- Mark as prop (not internal)
- Allow user to provide mock children in simulator
- Default: `null` (no children shown)

### Edge Case 5: Event Handlers

```tsx
<Button onClick={() => handleAddToCart(product.id)}>Add</Button>
```

**Challenge:** Canvas can't execute event handlers.

**Solution:**
- Extract as `handleAddToCart: () => {}` placeholder
- Canvas shows button but onClick does nothing
- Claude preserves full handler when saving

## Future Enhancements

### 1. Smart Mock Value Suggestions

Based on variable names and types:
- `isLoading` → suggest `true` and `false` as quick toggles
- `products` → suggest "Empty", "Single Item", "Multiple Items" presets
- `error` → suggest `null` and `Error('Test error')` presets

### 2. State Snapshots (Named Variants)

Like Figma variants:
- "Loading State" → `{ isLoading: true, data: null }`
- "Error State" → `{ isLoading: false, error: Error('...') }`
- "Success State" → `{ isLoading: false, data: [...] }`

Save these as named configurations for quick switching.

### 3. Multi-State Editing

Show multiple states side-by-side:
```
┌─ Loading ─┐  ┌─ Success ─┐  ┌─ Error ──┐
│ <Spinner> │  │ <Data>    │  │ <Error>  │
└───────────┘  └───────────┘  └──────────┘
```

Edit all at once, save applies changes to all branches.

### 4. Props Preview Mode

For components with props, allow "Preview Mode":
- Use actual parent component's prop values
- Render in context of real usage
- Still editable, changes apply to component definition

### 5. Time-Travel State Changes

Record state changes as user toggles values:
```
t=0: isLoading=false, products=[]
t=1: isLoading=true             (user toggled)
t=2: products=[{...}]           (user added data)
t=3: isLoading=false            (user toggled)
```

Allows undo/redo of state changes separately from structural edits.

## Testing Plan

### Test Case 1: Simple Component with Props
- Component: GreetingCard
- Props: title, ctaText
- Expected: User provides mock values, sees rendered card, can edit

### Test Case 2: Component with useState
- Component: Counter with increment button
- State: count = 0
- Expected: Shows count value, user can toggle to see different numbers

### Test Case 3: Component with Conditionals
- Component: ProductCard
- Conditional: `{inStock ? <Button>Buy</Button> : <span>Out of Stock</span>}`
- Expected: Toggle inStock, see both versions, can edit each

### Test Case 4: Component with Loops
- Component: ProductList
- Loop: `products.map(p => <Card>...)`
- Expected: Shows all cards, editing one updates the template

### Test Case 5: Complex Component
- Component: ProductList (full version)
- Multiple states, loops, conditionals
- Expected: Can toggle loading, add/remove products, see all variations

## Performance Considerations

### Concern 1: Re-rendering on State Change

**Impact:** Every mock value change triggers full snapshot render.

**Mitigation:**
- Debounce state changes (wait 300ms after user stops typing)
- Use React.memo for snapshot component
- Only re-render if values actually changed

### Concern 2: Large Data Sets

**Impact:** `products = [1000 items]` slow to render.

**Mitigation:**
- Limit mock array sizes to 10 items by default
- Show "..." indicator for truncated data
- Allow user to increase if needed

### Concern 3: Complex Components

**Impact:** Deeply nested components with many states slow to parse.

**Mitigation:**
- Cache snapshot function (only rebuild if returnJSX changes)
- Lazy-load react-element-to-jsx-string
- Consider WebWorker for heavy parsing

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────┐                    │
│  │ Load File    │────▶│ Dev Server   │                    │
│  │ Request      │     │ GET /files/* │                    │
│  └──────────────┘     └──────┬───────┘                    │
│                              │                             │
│                              ▼                             │
│  ┌─────────────────────────────────────────┐              │
│  │ Returns:                                │              │
│  │ • returnJSX (with {expressions})       │              │
│  │ • variables ["isLoading", "products"]  │              │
│  │ • initialValues { isLoading: false }   │              │
│  │ • props ["title", "ctaText"]           │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Create Snapshot Function                │              │
│  │ new Function('React', 'components', ... │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Render with Mock Values                 │              │
│  │ snapshotFn(React, components, ...)      │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ React Element                           │              │
│  │ <div><Card>Sample Title</Card></div>    │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ reactElementToJSXString()               │              │
│  │ Converts to static JSX string           │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Static JSX (no expressions)             │              │
│  │ "<div><Card>Sample Title</Card></div>"  │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ parseJSX()                              │              │
│  │ Parse to FEElement[]                    │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Canvas - Editable Elements              │              │
│  │ User can drag, resize, edit styles      │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ State Simulator Panel                   │              │
│  │ User toggles: isLoading = true          │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     └──────────┐                           │
│                                │                           │
│                                ▼                           │
│  ┌─────────────────────────────────────────┐              │
│  │ Re-render Snapshot                      │              │
│  │ (loops back to "Render with Mock")      │              │
│  └─────────────────────────────────────────┘              │
│                                                             │
│  When user clicks Save:                                    │
│  ┌─────────────────────────────────────────┐              │
│  │ POST /files/* with:                     │              │
│  │ • elements (edited FEElements)          │              │
│  │ • stateContext { isLoading: true }      │              │
│  └──────────────────┬──────────────────────┘              │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Dev Server                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐              │
│  │ Generate JSX from edited elements       │              │
│  │ generateJSX(elements)                   │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Prompt Claude CLI:                      │              │
│  │ • Original file with logic              │              │
│  │ • New JSX structure                     │              │
│  │ • State context                         │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Claude merges intelligently             │              │
│  │ • Applies structural changes            │              │
│  │ • Preserves logic/state/hooks           │              │
│  │ • Maintains code style                  │              │
│  └──────────────────┬──────────────────────┘              │
│                     │                                      │
│                     ▼                                      │
│  ┌─────────────────────────────────────────┐              │
│  │ Write updated file to disk              │              │
│  └─────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Conclusion

The Snapshot Rendering architecture provides a powerful way to visually edit React components while preserving their full functionality. By combining deterministic structure generation with Claude's intelligent merging, we achieve the best of both worlds: visual editing ease + code integrity.

Key principles:
1. **Extract, don't guess** - Pull initial values from actual code
2. **Render, then parse** - Evaluate expressions before parsing
3. **Preserve, don't replace** - Claude merges changes, doesn't overwrite
4. **Context is key** - State context tells Claude which branch was edited

This approach scales from simple presentational components to complex stateful components with loops, conditionals, and dynamic behavior.
