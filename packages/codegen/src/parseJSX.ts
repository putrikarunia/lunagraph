import { parse } from '@babel/parser'
import * as t from '@babel/types'
import type { FEElement } from './types.js'

let idCounter = 0

function generateId(): string {
  return `el-${Date.now()}-${idCounter++}`
}

/**
 * Parse JSX code into FEElement tree
 */
export function parseJSX(code: string): FEElement[] {
  // Reset ID counter for consistent IDs in tests
  idCounter = 0

  // Wrap code in a component if it's not already
  const wrappedCode = code.trim().startsWith('<')
    ? `function Component() { return (${code}) }`
    : code

  try {
    const ast = parse(wrappedCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    // Find the JSX in the return statement
    const jsxElements: FEElement[] = []

    // Walk the AST to find JSX elements
    const walk = (node: any) => {
      if (t.isJSXElement(node)) {
        const element = parseJSXElement(node)
        if (element) {
          jsxElements.push(element)
        }
        return // Don't traverse children (they're handled in parseJSXElement)
      }

      if (t.isJSXFragment(node)) {
        // Handle fragments by extracting children
        const children = node.children
          .map((child: any) => parseJSXChild(child))
          .filter((el: any): el is FEElement => el !== null)
        jsxElements.push(...children)
        return
      }

      // Recursively walk child nodes
      for (const key in node) {
        const child = node[key]
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            child.forEach(walk)
          } else {
            walk(child)
          }
        }
      }
    }

    walk(ast)

    return jsxElements
  } catch (error) {
    console.error('Failed to parse JSX:', error)
    throw new Error(`Invalid JSX: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function parseJSXElement(node: t.JSXElement): FEElement | null {
  const openingElement = node.openingElement
  const tagName = getTagName(openingElement.name)

  if (!tagName) return null

  // Determine if it's a component (starts with uppercase) or HTML element
  const isComponent = /^[A-Z]/.test(tagName)

  // Extract attributes
  const { styles, props } = parseAttributes(openingElement.attributes)

  // Parse children
  const children = node.children
    .map(child => parseJSXChild(child))
    .filter((el): el is FEElement => el !== null)

  if (isComponent) {
    return {
      id: generateId(),
      type: 'component',
      componentName: tagName,
      props,
      styles,
      children: children.length > 0 ? children : undefined,
    }
  } else {
    return {
      id: generateId(),
      type: 'html',
      tag: tagName.toLowerCase(),
      styles,
      children: children.length > 0 ? children : undefined,
    }
  }
}

function parseJSXChild(child: t.JSXElement['children'][0]): FEElement | null {
  if (t.isJSXElement(child)) {
    return parseJSXElement(child)
  }

  if (t.isJSXText(child)) {
    const text = child.value.trim()
    if (!text) return null

    return {
      id: generateId(),
      type: 'text',
      tag: 'span',
      text,
    }
  }

  if (t.isJSXExpressionContainer(child)) {
    // For now, skip expression containers (they'll be handled by dev later)
    // TODO: Handle {variable} expressions
    return null
  }

  if (t.isJSXFragment(child)) {
    // Fragments don't have their own element, just return children
    // This is a simplification - we'd need to handle this better
    return null
  }

  return null
}

function getTagName(name: t.JSXElement['openingElement']['name']): string | null {
  if (t.isJSXIdentifier(name)) {
    return name.name
  }

  if (t.isJSXMemberExpression(name)) {
    // Handle <Foo.Bar />
    const parts: string[] = []
    let current: t.JSXMemberExpression | t.JSXIdentifier = name

    while (t.isJSXMemberExpression(current)) {
      if (t.isJSXIdentifier(current.property)) {
        parts.unshift(current.property.name)
      }
      current = current.object
    }

    if (t.isJSXIdentifier(current)) {
      parts.unshift(current.name)
    }

    return parts.join('.')
  }

  return null
}

function parseAttributes(attributes: t.JSXElement['openingElement']['attributes']): {
  styles?: Record<string, any>
  props?: Record<string, any>
} {
  const styles: Record<string, any> = {}
  const props: Record<string, any> = {}

  for (const attr of attributes) {
    if (t.isJSXAttribute(attr)) {
      const name = t.isJSXIdentifier(attr.name) ? attr.name.name : null
      if (!name) continue

      const value = parseAttributeValue(attr.value)

      if (name === 'style' && typeof value === 'object') {
        Object.assign(styles, value)
      } else if (name !== 'style') {
        props[name] = value
      }
    }

    if (t.isJSXSpreadAttribute(attr)) {
      // Handle {...spread} - we'd need to evaluate this at runtime
      // For now, skip it
      continue
    }
  }

  return {
    styles: Object.keys(styles).length > 0 ? styles : undefined,
    props: Object.keys(props).length > 0 ? props : undefined,
  }
}

function parseAttributeValue(value: t.JSXAttribute['value']): any {
  if (!value) return true // Boolean attribute like <input disabled />

  if (t.isStringLiteral(value)) {
    return value.value
  }

  if (t.isJSXExpressionContainer(value)) {
    const expression = value.expression

    if (t.isStringLiteral(expression)) {
      return expression.value
    }

    if (t.isNumericLiteral(expression)) {
      return expression.value
    }

    if (t.isBooleanLiteral(expression)) {
      return expression.value
    }

    if (t.isObjectExpression(expression)) {
      // Parse object literal
      const obj: Record<string, any> = {}
      for (const prop of expression.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const key = prop.key.name
          if (t.isStringLiteral(prop.value)) {
            obj[key] = prop.value.value
          } else if (t.isNumericLiteral(prop.value)) {
            obj[key] = prop.value.value
          } else if (t.isBooleanLiteral(prop.value)) {
            obj[key] = prop.value.value
          }
        }
      }
      return obj
    }

    // For other expressions, return a placeholder
    // TODO: Handle more expression types
    return undefined
  }

  return undefined
}
