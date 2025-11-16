import type { FEElement } from './types.js'

/**
 * Generate JSX code from FEElement tree
 */
export function generateJSX(elements: FEElement[], indent = 0): string {
  return elements.map(el => generateElement(el, indent)).join('\n')
}

function generateElement(element: FEElement, indent: number): string {
  const spaces = '  '.repeat(indent)

  // Handle text nodes
  if (element.type === 'text') {
    return `${spaces}${element.text || ''}`
  }

  // Handle HTML elements
  if (element.type === 'html') {
    const attrs = generateAttributes(element.styles, element.props || {})
    const opening = `${spaces}<${element.tag}${attrs}>`

    if (!element.children || element.children.length === 0) {
      return `${opening}</${element.tag}>`
    }

    const children = generateJSX(element.children, indent + 1)
    return `${opening}\n${children}\n${spaces}</${element.tag}>`
  }

  // Handle component elements
  if (element.type === 'component') {
    const attrs = generateAttributes(element.styles, element.props || {})
    const opening = `${spaces}<${element.componentName}${attrs}`

    if (!element.children || element.children.length === 0) {
      return `${opening} />`
    }

    const children = generateJSX(element.children, indent + 1)
    return `${opening}>\n${children}\n${spaces}</${element.componentName}>`
  }

  return ''
}

function generateAttributes(
  styles?: Record<string, any>,
  props?: Record<string, any>
): string {
  let attrs = ''

  // Add style attribute if present
  if (styles && Object.keys(styles).length > 0) {
    const styleEntries = Object.entries(styles)
    if (styleEntries.length === 1) {
      // Single property - keep inline
      const styleStr = JSON.stringify(styles)
      attrs += ` style={${styleStr}}`
    } else {
      // Multiple properties - format with newlines
      const formattedStyles = styleEntries
        .map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
        .join(',\n')
      attrs += ` style={{\n${formattedStyles}\n  }}`
    }
  }

  // Add other props
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'style') return // Already handled above

      if (typeof value === 'string') {
        attrs += ` ${key}="${escapeAttribute(value)}"`
      } else if (typeof value === 'boolean') {
        if (value) {
          attrs += ` ${key}`
        }
      } else {
        attrs += ` ${key}={${JSON.stringify(value)}}`
      }
    })
  }

  return attrs
}

function escapeAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
