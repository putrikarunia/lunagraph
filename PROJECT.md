# 🚀 Lunagraph — CLI + Built-in Editor Project Plan

## 🌕 Overview

Lunagraph will provide a **CLI** and a **built-in React editor** that work together:

- The **CLI** indexes all components in a project, watching for file changes.
- The **Editor** (embedded inside your app) renders those components live and lets you edit props, styles, and layout visually.
- All edits are applied back to source files through the CLI using **AST-safe transformations**.

No external desktop app required — the entire experience runs within the developer’s local dev server.

---

## 🧩 Developer Experience

### Commands

```bash
# Initialize config and local assets
pnpm dlx lunagraph init

# Scan and index all components
pnpm lunagraph index

# Start patch server + open editor
pnpm lunagraph dev

# Apply saved patches manually (optional)
pnpm lunagraph apply
```

---

## 🧠 Architecture

### CLI (Node)

| Module | Purpose |
|---------|----------|
| **Scanner** | Parses `src/**` using `ts-morph` or `swc` to detect exported React components and props. |
| **Patch Server** | Runs a small WebSocket/HTTP server for the editor to send change events. |
| **AST Engine** | Applies prop/style/class edits to JSX files safely. |
| **Formatter** | Formats modified files using Prettier or Biome. |

**Outputs:**
```
.lunagraph/
  ├─ ComponentIndex.json   # component name → file path + export
  ├─ PropsSchema.json      # props + types
  └─ config.json
```

---

### Editor (React)

Lives directly inside the app repo — e.g. `/src/editor/**`.

| File | Role |
|------|------|
| `Editor.tsx` | Main layout combining sidebar + canvas + inspector. |
| `Canvas.tsx` | Renders the selected component live via dynamic import. |
| `Sidebar.tsx` | Lists available components (from index). |
| `Inspector.tsx` | Auto-generated form for editing props and styles. |
| `Overlay.tsx` | Draws selection/hover rectangles and handles drag/resize. |
| `useLunagraph.ts` | WebSocket hook to talk to the CLI patch server. |

---

## ⚙️ Data Flow

```
Codebase → (CLI scan) → ComponentIndex / PropsSchema
Editor UI → (select component) → render live
Editor UI → (change props/styles) → send Patch
CLI (AST Engine) → apply Patch → write file → trigger HMR
```

---

## 🧱 File Structure

```
/.lunagraph/
  ComponentIndex.json
  PropsSchema.json
  config.json
/scripts/
  lunagraph-cli/
    index.ts
    server.ts
    patch.ts
src/
  components/
  editor/
    Editor.tsx
    Canvas.tsx
    Sidebar.tsx
    Inspector.tsx
    Overlay.tsx
app/
  edit/page.tsx
```

---

## 🎯 MVP Scope

1. **Indexing**
   - Detect exported components from `src/components/**`.
   - Extract file path, export name, and prop definitions.

2. **Editor**
   - `/edit` route shows `<Editor/>`.
   - Sidebar lists components dynamically.
   - Canvas renders selected component.
   - Inspector displays generated prop fields.
   - “Apply” button sends patch to CLI.

3. **Patching**
   - Locate JSX node by file + export name.
   - Update props or className safely.
   - Format file and trigger Next.js HMR.

---

## 🚀 Phase 2–3 (Stretch)

- Map nested JSX elements for deep edits.
- Implement drag/resize overlays.
- Add prop presets / variants.
- Inline text editing.
- Monaco diff preview before apply.
- Support RSC-safe boundaries.

---

## 🛡 Safeguards

- All writes are AST-safe + formatted.
- Git check: block writes on dirty tree unless `--force`.
- `.lunagraphignore` for skipped paths.
- Validate all prop values against type schema.

---

## ✅ Success Criteria

- Designer opens `/edit` and tweaks a real component visually.
- Changes reflect instantly in code via AST edits.
- Dev server hot-reloads updated files.
- Git diff shows minimal, clean JSX updates.
