import type { FEElement } from './types.js'

/**
 * Extract unique component names from FEElement tree
 */
export function extractComponentDependencies(elements: FEElement[]): Set<string> {
  const components = new Set<string>()

  function traverse(element: FEElement) {
    if (element.type === 'component') {
      components.add(element.componentName)
    }

    if ('children' in element && element.children) {
      element.children.forEach(traverse)
    }
  }

  elements.forEach(traverse)

  return components
}
