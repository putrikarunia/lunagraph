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
      // Step 1: Transform JSX to JavaScript using Babel
      const varNames = variables.join(', ')
      const componentNames = Object.keys(components).join(', ')

      // Create JSX code with function wrapper
      const jsxCode = `
        function SnapshotComponent(${varNames}) {
          const { ${componentNames} } = components;
          return ${returnJSX};
        }
      `

      // Transform JSX to JavaScript
      const transformed = Babel.transform(jsxCode, {
        presets: ['react'],
        filename: 'snapshot.jsx',
      })

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
          // Preserve component names instead of expanding them
          if (typeof el.type === 'function') {
            return el.type.displayName || el.type.name || 'Unknown'
          }
          return el.type
        },
      })

      // Step 4: Parse JSX string to FEElements
      const elements = parseJSX(jsxString)
      return elements
    } catch (error) {
      console.error('[useComponentSnapshot] Failed to create component snapshot:', error)
      return []
    }
  }, [returnJSX, variables, mockValues, components, componentIndex])
}
