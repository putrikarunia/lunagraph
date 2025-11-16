import { parse } from '@babel/parser'
import generateModule from '@babel/generator'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'
import type { FEElement } from './types.js'
import { extractComponentDependencies } from './extractDependencies.js'
import { generateImports, type ComponentIndex } from './generateImports.js'

// Handle both CJS and ESM exports
const traverse = (traverseModule as any).default || traverseModule
const generate = (generateModule as any).default || generateModule

export interface UpdateFileOptions {
  existingCode: string
  elements: FEElement[]
  componentIndex: ComponentIndex
  targetFilePath?: string
}

/**
 * Update an existing file by replacing the JSX in the return statement
 * and updating imports accordingly
 */
export function updateExistingFile(options: UpdateFileOptions): string {
  const { existingCode, elements, componentIndex, targetFilePath } = options

  // Parse existing code to AST
  const ast = parse(existingCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  // Extract new component dependencies
  const newDependencies = extractComponentDependencies(elements)

  // Parse the new JSX to get Babel AST nodes
  const newJSXCode = buildJSXElementsString(elements)
  const newJSXAst = parse(`const temp = (${newJSXCode})`, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  // Extract the JSX expression from the temp variable
  let newJSXNode: t.Expression | null = null
  traverse(newJSXAst, {
    VariableDeclarator(path: any) {
      if (t.isIdentifier(path.node.id) && path.node.id.name === 'temp' && path.node.init) {
        newJSXNode = path.node.init
        path.stop()
      }
    }
  })

  if (!newJSXNode) {
    throw new Error('Failed to parse new JSX')
  }

  // Find and replace the return statement in the component
  let replaced = false
  traverse(ast, {
    FunctionDeclaration(path: any) {
      if (!replaced) {
        replaceReturnStatement(path, newJSXNode!)
        replaced = true
      }
    },
    ArrowFunctionExpression(path: any) {
      if (!replaced) {
        replaceReturnStatement(path, newJSXNode!)
        replaced = true
      }
    },
    FunctionExpression(path: any) {
      if (!replaced) {
        replaceReturnStatement(path, newJSXNode!)
        replaced = true
      }
    }
  })

  // Update imports
  updateImports(ast, newDependencies, componentIndex, targetFilePath)

  // Generate code from updated AST
  const output = generate(ast, {
    retainLines: false,
    compact: false,
  })

  return output.code
}

/**
 * Replace the return statement's JSX with new JSX
 */
function replaceReturnStatement(path: any, newJSXNode: t.Expression) {
  const body = path.node.body

  // Handle arrow functions with direct return: () => <div />
  if (t.isExpression(body)) {
    path.node.body = newJSXNode
    return
  }

  // Handle block statements: () => { return <div /> }
  if (t.isBlockStatement(body)) {
    for (const statement of body.body) {
      if (t.isReturnStatement(statement)) {
        statement.argument = newJSXNode
        break
      }
    }
  }
}

/**
 * Update imports in the AST
 */
function updateImports(
  ast: t.File,
  newDependencies: Set<string>,
  componentIndex: ComponentIndex,
  targetFilePath?: string
) {
  // Generate new import statements
  const newImports = generateImports(newDependencies, componentIndex, targetFilePath)

  // Parse new imports to AST nodes
  const newImportNodes: t.ImportDeclaration[] = []
  for (const importStatement of newImports) {
    const importAst = parse(importStatement, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    const importDecl = importAst.program.body[0]
    if (t.isImportDeclaration(importDecl)) {
      newImportNodes.push(importDecl)
    }
  }

  // Find existing component imports (those from componentIndex)
  const componentPaths = new Set(
    Object.values(componentIndex).map(entry => entry.path.replace(/\.tsx?$/, ''))
  )

  const existingImportIndices: number[] = []
  ast.program.body.forEach((node, index) => {
    if (t.isImportDeclaration(node)) {
      const source = node.source.value
      // Check if this import is for a component (either @ alias or relative)
      const normalizedSource = source.replace(/^@\//, '')
      if (componentPaths.has(normalizedSource) || source.includes('/components/')) {
        existingImportIndices.push(index)
      }
    }
  })

  // Remove old component imports
  existingImportIndices.reverse().forEach(index => {
    ast.program.body.splice(index, 1)
  })

  // Find where to insert new imports (after React import, or at the top)
  let insertIndex = 0
  for (let i = 0; i < ast.program.body.length; i++) {
    const node = ast.program.body[i]
    if (t.isImportDeclaration(node)) {
      insertIndex = i + 1
    } else {
      break
    }
  }

  // Insert new imports
  newImportNodes.reverse().forEach(importNode => {
    ast.program.body.splice(insertIndex, 0, importNode)
  })
}

/**
 * Helper to build JSX string from FEElement (for parsing)
 */
function buildJSXElementsString(elements: FEElement[]): string {
  if (elements.length === 0) {
    return '<div />'
  }

  if (elements.length === 1) {
    return buildJSXElement(elements[0])
  }

  // Multiple root elements - wrap in fragment
  const children = elements.map(buildJSXElement).join('\n')
  return `<>\n${children}\n</>`
}

function buildJSXElement(element: FEElement): string {
  if (element.type === 'text') {
    return element.text || ''
  }

  const tagName = element.type === 'html' ? element.tag : element.componentName
  const attrs = buildAttributes(element)
  const children = element.children?.map(buildJSXElement).join('') || ''

  if (!children) {
    return `<${tagName}${attrs} />`
  }

  return `<${tagName}${attrs}>${children}</${tagName}>`
}

function buildAttributes(element: FEElement): string {
  let attrs = ''

  // Add style
  if (element.styles && Object.keys(element.styles).length > 0) {
    const styleStr = JSON.stringify(element.styles)
    attrs += ` style={${styleStr}}`
  }

  // Add props
  if (element.type === 'component' && element.props) {
    Object.entries(element.props).forEach(([key, value]) => {
      if (key === 'style') return
      if (typeof value === 'string') {
        attrs += ` ${key}="${value}"`
      } else if (typeof value === 'boolean' && value) {
        attrs += ` ${key}`
      } else {
        attrs += ` ${key}={${JSON.stringify(value)}}`
      }
    })
  }

  return attrs
}
