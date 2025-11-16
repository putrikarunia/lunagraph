import type { FEElement } from './types.js'
import { generateJSX } from './generateJSX.js'
import { extractComponentDependencies } from './extractDependencies.js'
import { generateImports, type ComponentIndex } from './generateImports.js'

export interface GenerateFileOptions {
  componentName: string
  elements: FEElement[]
  componentIndex: ComponentIndex
  targetFilePath?: string
  includeReactImport?: boolean
}

/**
 * Generate a complete TypeScript/React component file
 */
export function generateCompleteFile(options: GenerateFileOptions): string {
  const {
    componentName,
    elements,
    componentIndex,
    targetFilePath,
    includeReactImport = false
  } = options

  const parts: string[] = []

  // Extract component dependencies
  const dependencies = extractComponentDependencies(elements)

  // Generate imports
  const imports = generateImports(dependencies, componentIndex, targetFilePath)

  // Add React import if needed (for older React versions or explicit request)
  if (includeReactImport) {
    parts.push("import React from 'react'")
  }

  // Add component imports
  if (imports.length > 0) {
    parts.push(...imports)
  }

  // Add blank line after imports
  if (parts.length > 0) {
    parts.push('')
  }

  // Generate component definition
  parts.push(`export default function ${componentName}() {`)
  parts.push('  return (')

  // Generate JSX (indented by 2 spaces for return statement)
  const jsx = generateJSX(elements, 2)
  parts.push(jsx)

  parts.push('  )')
  parts.push('}')

  return parts.join('\n')
}
