/**
 * Component index entry structure
 */
export interface ComponentIndexEntry {
  path: string
  exportName: string
  props?: Record<string, any>
}

export type ComponentIndex = Record<string, ComponentIndexEntry>

/**
 * Generate import statements from component dependencies
 *
 * @param componentNames - Set of component names used in the JSX
 * @param componentIndex - ComponentIndex.json mapping
 * @param targetFilePath - Path of the file being generated (for relative imports)
 * @returns Array of import statements
 */
export function generateImports(
  componentNames: Set<string>,
  componentIndex: ComponentIndex,
  targetFilePath?: string
): string[] {
  const imports: string[] = []

  // Group components by their source file
  const importsByPath = new Map<string, Set<string>>()

  for (const componentName of componentNames) {
    const entry = componentIndex[componentName]

    if (!entry) {
      console.warn(`Component "${componentName}" not found in ComponentIndex`)
      continue
    }

    const { path, exportName } = entry

    if (!importsByPath.has(path)) {
      importsByPath.set(path, new Set())
    }

    importsByPath.get(path)!.add(exportName)
  }

  // Generate import statements
  for (const [path, exportNames] of importsByPath) {
    // Convert file path to import path (remove .tsx/.ts extension)
    const importPath = path.replace(/\.tsx?$/, '')

    // If multiple exports from same file, combine them
    const namedImports = Array.from(exportNames).sort().join(', ')

    // Use relative path if target file is provided
    // For now, we'll use @ alias (can be enhanced later)
    const finalPath = importPath.startsWith('@/') ? importPath : `@/${importPath}`

    imports.push(`import { ${namedImports} } from '${finalPath}'`)
  }

  return imports.sort()
}

/**
 * Get component import mappings (for use in prompts/hints)
 * Returns array of { component, importPath } objects
 */
export function getComponentImportMappings(
  componentNames: Set<string>,
  componentIndex: ComponentIndex
): Array<{ component: string; importPath: string }> {
  const mappings: Array<{ component: string; importPath: string }> = []

  for (const componentName of componentNames) {
    const entry = componentIndex[componentName]

    if (!entry) {
      console.warn(`Component "${componentName}" not found in ComponentIndex`)
      continue
    }

    const { path, exportName } = entry
    const importPath = path.replace(/\.tsx?$/, '')
    const finalPath = importPath.startsWith('@/') ? importPath : `@/${importPath}`

    mappings.push({
      component: exportName,
      importPath: finalPath
    })
  }

  return mappings
}
