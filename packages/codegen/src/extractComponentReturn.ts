import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import generateModule from '@babel/generator'
import * as t from '@babel/types'

const traverse = (traverseModule as any).default || traverseModule
const generate = (generateModule as any).default || generateModule

export interface ExtractedComponent {
  returnJSX: string
  variables: string[]
  initialValues: Record<string, any>
  props: string[]
}

/**
 * Check if a CallExpression is a React.forwardRef or forwardRef call
 */
function isForwardRefCall(node: any): boolean {
  const callee = node.callee

  // React.forwardRef
  if (t.isMemberExpression(callee) &&
      t.isIdentifier(callee.object, { name: 'React' }) &&
      t.isIdentifier(callee.property, { name: 'forwardRef' })) {
    return true
  }

  // forwardRef (direct import)
  if (t.isIdentifier(callee, { name: 'forwardRef' })) {
    return true
  }

  return false
}

/**
 * Extracts the return statement JSX and finds all variables used in it
 */
export function extractComponentReturn(code: string): ExtractedComponent | null {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    const variables = new Set<string>()
    const props = new Set<string>()
    const initialValues: Record<string, any> = {}
    let result: { returnJSX: string } | null = null as { returnJSX: string } | null

    // Find the component function and its return statement
    traverse(ast, {
      // Handle function declarations: function MyComponent() { ... }
      FunctionDeclaration(path: any) {
        if (!result) {
          result = extractFromFunction(path, variables, props, initialValues)
        }
      },

      // Handle arrow functions: const MyComponent = () => { ... }
      // Also handles: const MyComponent = React.forwardRef(() => { ... })
      ArrowFunctionExpression(path: any) {
        if (!result) {
          result = extractFromFunction(path, variables, props, initialValues)
        }
      },

      // Handle React.forwardRef: const MyComponent = React.forwardRef(...)
      CallExpression(path: any) {
        if (!result && isForwardRefCall(path.node)) {
          console.log('[extractComponentReturn] Found forwardRef call')
          // The callback is the first argument to forwardRef
          const callbackPath = path.get('arguments.0')
          console.log('[extractComponentReturn] Callback path exists:', !!callbackPath)
          console.log('[extractComponentReturn] Callback is function:', callbackPath && (callbackPath.isArrowFunctionExpression() || callbackPath.isFunctionExpression()))
          if (callbackPath && (callbackPath.isArrowFunctionExpression() || callbackPath.isFunctionExpression())) {
            result = extractFromFunction(callbackPath, variables, props, initialValues)
            console.log('[extractComponentReturn] Result from extractFromFunction:', !!result)
          }
        }
      },
    })

    if (!result) {
      return null
    }

    return {
      returnJSX: result.returnJSX,
      variables: Array.from(variables),
      initialValues,
      props: Array.from(props),
    }
  } catch (error) {
    console.error('Failed to extract component return:', error)
    return null
  }
}

function extractFromFunction(
  path: any,
  variables: Set<string>,
  props: Set<string>,
  initialValues: Record<string, any>
): { returnJSX: string } | null {
  console.log('[extractFromFunction] Called')
  // Extract props from function parameters
  extractPropsFromParams(path.node.params, props)

  // Find return statement
  const returnStatement = findReturnStatement(path)
  console.log('[extractFromFunction] Found return statement:', !!returnStatement)
  let returnJSX: string | null = null

  if (returnStatement) {
    returnJSX = extractJSXFromReturn(returnStatement)
    console.log('[extractFromFunction] Got returnJSX:', !!returnJSX)
    if (returnJSX) {
      findVariablesInJSX(returnStatement.argument, variables)
    }
  }
  // Handle implicit return: const MyComponent = () => (<div>...</div>)
  else if (t.isJSXElement(path.node.body) || t.isJSXFragment(path.node.body)) {
    returnJSX = generate(path.node.body).code
    findVariablesInJSX(path.node.body, variables)
  }

  if (!returnJSX) return null

  // Extract initial values from function body
  extractInitialValues(path, variables, initialValues, props)

  return { returnJSX }
}

function findReturnStatement(path: any): any {
  let returnStmt: any = null

  path.traverse({
    ReturnStatement(returnPath: any) {
      const arg = returnPath.node.argument
      // Accept JSX or createElement calls
      if (!returnStmt) {
        if (t.isJSXElement(arg) || t.isJSXFragment(arg)) {
          returnStmt = returnPath.node
        } else if (t.isCallExpression(arg) && isCreateElementCall(arg)) {
          returnStmt = returnPath.node
        }
      }
    },
  })

  return returnStmt
}

function extractJSXFromReturn(returnStatement: any): string | null {
  if (!returnStatement.argument) {
    console.log('[extractJSXFromReturn] No return argument')
    return null
  }

  // Handle parenthesized expressions: return (<div>...</div>)
  let jsxNode = returnStatement.argument
  if (t.isParenthesizedExpression(jsxNode)) {
    jsxNode = jsxNode.expression
  }

  console.log('[extractJSXFromReturn] Return node type:', jsxNode.type)

  if (t.isJSXElement(jsxNode) || t.isJSXFragment(jsxNode)) {
    console.log('[extractJSXFromReturn] Found JSX')
    return generate(jsxNode).code
  }

  // Handle createElement calls: return createElement('div', props, children)
  if (t.isCallExpression(jsxNode)) {
    console.log('[extractJSXFromReturn] Is CallExpression')
    const isCreateElem = isCreateElementCall(jsxNode)
    console.log('[extractJSXFromReturn] Is createElement:', isCreateElem)
    if (isCreateElem) {
      const jsx = convertCreateElementToJSX(jsxNode)
      console.log('[extractJSXFromReturn] Converted JSX:', jsx)
      return jsx
    }
  }

  console.log('[extractJSXFromReturn] No JSX found')
  return null
}

/**
 * Check if a call expression is createElement or React.createElement
 */
function isCreateElementCall(node: any): boolean {
  const callee = node.callee

  // React.createElement
  if (t.isMemberExpression(callee) &&
      t.isIdentifier(callee.object, { name: 'React' }) &&
      t.isIdentifier(callee.property, { name: 'createElement' })) {
    return true
  }

  // createElement (direct import)
  if (t.isIdentifier(callee, { name: 'createElement' })) {
    return true
  }

  return false
}

/**
 * Convert createElement(tag, props, children) to JSX string
 */
function convertCreateElementToJSX(node: any): string | null {
  const args = node.arguments
  if (args.length === 0) return null

  // First argument is the tag (string literal or expression)
  const tagArg = args[0]
  let tag = 'div'

  if (t.isStringLiteral(tagArg)) {
    tag = tagArg.value
  } else if (t.isIdentifier(tagArg)) {
    // Check if it's a known component (starts with uppercase)
    // If not, it's a variable like 'Comp' that we can't resolve - use default
    const name = tagArg.name
    if (/^[A-Z]/.test(name)) {
      tag = name // Component name
    } else {
      // Variable like 'Comp' - we can't determine the value, use default
      tag = 'div'
    }
  } else if (t.isLogicalExpression(tagArg) && tagArg.operator === '??') {
    // Handle `as ?? 'span'` - use the fallback value (right side)
    if (t.isStringLiteral(tagArg.right)) {
      tag = tagArg.right.value
    } else {
      tag = 'div' // Default fallback
    }
  } else if (t.isConditionalExpression(tagArg)) {
    // Handle `condition ? 'div' : 'span'` - use the consequent (first option)
    if (t.isStringLiteral(tagArg.consequent)) {
      tag = tagArg.consequent.value
    } else if (t.isStringLiteral(tagArg.alternate)) {
      tag = tagArg.alternate.value
    } else {
      tag = 'div'
    }
  } else {
    // Other complex expressions - default to div
    tag = 'div'
  }

  // Second argument is props (optional)
  const propsArg = args[1]
  let propsStr = ''
  if (propsArg && !t.isNullLiteral(propsArg)) {
    // For now, we'll skip props since they're complex to convert
    // The component will use its default props
    propsStr = ''
  }

  // Third argument is children (optional)
  const childrenArg = args[2]
  let childrenStr = ''
  if (childrenArg) {
    if (t.isStringLiteral(childrenArg)) {
      childrenStr = childrenArg.value
    } else if (t.isMemberExpression(childrenArg)) {
      // props.children - treat as expression
      childrenStr = `{${generate(childrenArg).code}}`
    } else {
      childrenStr = `{${generate(childrenArg).code}}`
    }
  }

  // Generate JSX
  if (childrenStr) {
    return `<${tag}${propsStr}>${childrenStr}</${tag}>`
  } else {
    return `<${tag}${propsStr} />`
  }
}

function findVariablesInJSX(node: any, variables: Set<string>) {
  // Handle createElement calls - extract variables from arguments
  if (t.isCallExpression(node) && isCreateElementCall(node)) {
    // Third argument is children - extract variables from it
    const childrenArg = node.arguments[2]
    if (childrenArg && t.isExpression(childrenArg)) {
      traverse(
        t.file(t.program([t.expressionStatement(childrenArg)])),
        {
          Identifier(path: any) {
            // Skip property names in member expressions (e.g., 'children' in props.children)
            if (t.isMemberExpression(path.parent) && path.parent.property === path.node) {
              return
            }
            const name = path.node.name
            if (!['undefined', 'null', 'true', 'false', 'React', 'Fragment'].includes(name)) {
              variables.add(name)
            }
          },
        },
        undefined,
        {}
      )
    }
    return
  }

  // Traverse the JSX to find all identifiers
  traverse(
    t.file(t.program([t.expressionStatement(node)])),
    {
      JSXExpressionContainer(path: any) {
        // Find identifiers in expressions like {count}, {data.map(...)}
        path.traverse({
          Identifier(idPath: any) {
            // Skip property names in member expressions (e.g., 'map' in data.map)
            if (t.isMemberExpression(idPath.parent) && idPath.parent.property === idPath.node) {
              return
            }
            // Skip JSX component names
            if (t.isJSXIdentifier(idPath.node)) {
              return
            }

            const name = idPath.node.name

            // Skip common built-ins
            if (['undefined', 'null', 'true', 'false', 'React', 'Fragment'].includes(name)) {
              return
            }

            variables.add(name)
          },
        })
      },
      // Handle JSX spread attributes: <Card {...props}>
      JSXSpreadAttribute(path: any) {
        if (t.isIdentifier(path.node.argument)) {
          variables.add(path.node.argument.name)
        }
      },
    },
    undefined,
    {}
  )
}

function extractPropsFromParams(params: any[], props: Set<string>) {
  for (const param of params) {
    if (t.isIdentifier(param)) {
      // Simple param: function Comp(props)
      props.add(param.name)
    } else if (t.isObjectPattern(param)) {
      // Destructured: function Comp({ prop1, prop2 })
      for (const prop of param.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          props.add(prop.key.name)
        } else if (t.isRestElement(prop)) {
          // Rest element: function Comp({ prop1, ...props })
          if (t.isIdentifier(prop.argument)) {
            props.add(prop.argument.name)
          }
        }
      }
    }
  }
}

function extractInitialValues(
  path: any,
  variables: Set<string>,
  initialValues: Record<string, any>,
  props: Set<string>
) {
  // Traverse function body to find variable declarations
  path.traverse({
    VariableDeclarator(declPath: any) {
      const id = declPath.node.id
      const init = declPath.node.init

      // Handle: const [state, setState] = useState(initialValue)
      if (t.isArrayPattern(id) && t.isCallExpression(init)) {
        if (t.isIdentifier(init.callee) && init.callee.name === 'useState') {
          const stateVar = id.elements[0]
          if (t.isIdentifier(stateVar) && variables.has(stateVar.name)) {
            const initialValue = evaluateInitialValue(init.arguments[0])
            initialValues[stateVar.name] = initialValue
          }
        }
      }

      // Handle: const { data, isLoading } = useQuery()
      if (t.isObjectPattern(id)) {
        for (const prop of id.properties) {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            const varName = prop.key.name
            if (variables.has(varName) && !props.has(varName)) {
              // For destructured values from hooks, use undefined as default
              // User can set proper values later
              initialValues[varName] = undefined
            }
          }
        }
      }

      // Handle: const data = [...] or const handleClick = () => {...}
      if (t.isIdentifier(id) && variables.has(id.name) && !props.has(id.name)) {
        const value = evaluateInitialValue(init)
        initialValues[id.name] = value
      }
    },

    // Handle: function handleClick(e) { ... }
    FunctionDeclaration(funcPath: any) {
      // Skip nested component functions, only get helper functions
      if (funcPath.node.id && t.isIdentifier(funcPath.node.id)) {
        const name = funcPath.node.id.name
        if (variables.has(name)) {
          initialValues[name] = () => {} // Placeholder function
        }
      }
    },
  })
}

function evaluateInitialValue(node: any): any {
  if (!node) return undefined

  try {
    // Literal values
    if (t.isStringLiteral(node)) return node.value
    if (t.isNumericLiteral(node)) return node.value
    if (t.isBooleanLiteral(node)) return node.value
    if (t.isNullLiteral(node)) return null

    // Array: [1, 2, 3]
    if (t.isArrayExpression(node)) {
      return node.elements.map((el: any) => evaluateInitialValue(el))
    }

    // Object: { id: 1, name: 'test' }
    if (t.isObjectExpression(node)) {
      const obj: Record<string, any> = {}
      for (const prop of node.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          obj[prop.key.name] = evaluateInitialValue(prop.value)
        }
      }
      return obj
    }

    // Arrow function or function expression
    if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
      return () => {}
    }

    // For complex expressions, return undefined
    return undefined
  } catch (error) {
    return undefined
  }
}
