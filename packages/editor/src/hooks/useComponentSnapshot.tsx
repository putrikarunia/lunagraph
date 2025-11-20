import { useMemo } from 'react'
import * as Babel from '@babel/standalone'
import reactElementToJSXString from 'react-element-to-jsx-string'
import { parseJSX, type FEElement } from '@lunagraph/codegen'
import type { ComponentIndex } from '../components/LunagraphEditor'

interface UseComponentSnapshotOptions {
  returnJSX: string | null
  variables: string[]
  mockValues: Record<string, any>
  components: Record<string, React.ComponentType<any>>
  componentIndex: ComponentIndex
}

/**
 * Generate sensible default mock values for variables based on their names
 */
function generateDefaultMockValue(variableName: string): any {
  const lowerName = variableName.toLowerCase()

  // Props object (rest parameters like ...props)
  if (lowerName === 'props') {
    return {}
  }

  // Boolean patterns
  if (lowerName.startsWith('is') || lowerName.startsWith('has') || lowerName.startsWith('should')) {
    return false
  }

  // Number patterns
  if (lowerName.includes('count') || lowerName.includes('index') || lowerName.includes('number')) {
    return 0
  }

  // Array patterns
  if (lowerName.includes('items') || lowerName.includes('list') || lowerName.endsWith('s')) {
    return []
  }

  // Children
  if (lowerName === 'children') {
    return null
  }

  // String patterns (default for most props)
  return variableName.charAt(0).toUpperCase() + variableName.slice(1) // e.g., "title" → "Title"
}

/**
 * Creates a rendered snapshot of a component with mock data
 * Converts: JSX with expressions → Rendered React element → Static JSX string → FEElements
 */
export function useComponentSnapshot({
  returnJSX,
  variables,
  mockValues,
  components,
  componentIndex,
}: UseComponentSnapshotOptions): FEElement[] {
  return useMemo(() => {
    if (!returnJSX) {
      return []
    }

    try {
      // Step 1: Find which components are used in the returnJSX
      const usedComponents = new Set<string>()
      const componentNamePattern = /<([A-Z][a-zA-Z0-9]*)/g
      let match
      while ((match = componentNamePattern.exec(returnJSX)) !== null) {
        const compName = match[1]
        if (components[compName]) {
          usedComponents.add(compName)
        }
      }

      // Step 2: Transform JSX to JavaScript using Babel
      const varNames = variables.join(', ')
      const componentNames = Array.from(usedComponents).join(', ')

      // Create JSX code with function wrapper
      const jsxCode = `
        function SnapshotComponent(${varNames}) {
          ${componentNames ? `const { ${componentNames} } = components;` : ''}
          return ${returnJSX};
        }
      `

      // Debug: Log the generated code
      console.log('[useComponentSnapshot] Used components:', Array.from(usedComponents))
      console.log('[useComponentSnapshot] Generated JSX code:')
      console.log(jsxCode)

      // Transform JSX to JavaScript
      const transformed = Babel.transform(jsxCode, {
        presets: ['react'],
        filename: 'snapshot.jsx',
      })

      console.log('[useComponentSnapshot] Transformed successfully')

      // Import React for JSX
      const React = require('react')

      // Create the snapshot function from transformed code
      // eslint-disable-next-line no-new-func
      const createSnapshotFn = new Function(
        'React',
        'components',
        transformed.code + '\nreturn SnapshotComponent;'
      )

      const snapshotFn = createSnapshotFn(React, components)

      // Step 2: Render with mock values (use provided mockValues or generate defaults)
      const varValues = variables.map(v => {
        if (v in mockValues) {
          return mockValues[v]
        }
        return generateDefaultMockValue(v)
      })
      const element = snapshotFn(...varValues)

      // Step 3: Convert React element to JSX string
      const jsxString = reactElementToJSXString(element, {
        showDefaultProps: false,
        showFunctions: true,
        functionValue: () => '() => {}',
        filterProps: (prop: string) => {
          // Keep all props except React internals
          return !['key', 'ref', '__self', '__source'].includes(prop)
        },
        displayName: (el: any) => {
          // Try to match element type back to original component name
          for (const [name, comp] of Object.entries(components)) {
            if (el.type === comp) {
              return name
            }
          }

          // Preserve component names for function components
          if (typeof el.type === 'function') {
            return el.type.displayName || el.type.name || 'Unknown'
          }

          // Handle forwardRef components (el.type is an object with $$typeof)
          if (el.type && typeof el.type === 'object') {
            // Check displayName on the type object FIRST (set via Component.displayName = 'Name')
            if (el.type.displayName) {
              return el.type.displayName
            }
            // ForwardRef components have a render property with the actual component
            if (el.type.render && typeof el.type.render === 'function') {
              return el.type.render.displayName || el.type.render.name || 'Unknown'
            }
          }

          // Fallback to string conversion for HTML elements
          return typeof el.type === 'string' ? el.type : 'Unknown'
        },
      })

      console.log('[useComponentSnapshot] JSX string from reactElementToJSXString:')
      console.log(jsxString)

      // Step 4: Parse JSX string to FEElements
      const elements = parseJSX(jsxString)
      return elements
    } catch (error) {
      console.error('[useComponentSnapshot] Failed to create component snapshot:', error)
      return []
    }
  }, [returnJSX, variables, mockValues, components, componentIndex])
}
