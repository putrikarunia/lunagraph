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
      ArrowFunctionExpression(path: any) {
        if (!result) {
          result = extractFromFunction(path, variables, props, initialValues)
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
  // Extract props from function parameters
  extractPropsFromParams(path.node.params, props)

  // Find return statement
  const returnStatement = findReturnStatement(path)
  let returnJSX: string | null = null

  if (returnStatement) {
    returnJSX = extractJSXFromReturn(returnStatement)
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
      // Get the first return statement we find
      if (!returnStmt && (t.isJSXElement(returnPath.node.argument) || t.isJSXFragment(returnPath.node.argument))) {
        returnStmt = returnPath.node
      }
    },
  })

  return returnStmt
}

function extractJSXFromReturn(returnStatement: any): string | null {
  if (!returnStatement.argument) return null

  // Handle parenthesized expressions: return (<div>...</div>)
  let jsxNode = returnStatement.argument
  if (t.isParenthesizedExpression(jsxNode)) {
    jsxNode = jsxNode.expression
  }

  if (t.isJSXElement(jsxNode) || t.isJSXFragment(jsxNode)) {
    return generate(jsxNode).code
  }

  return null
}

function findVariablesInJSX(node: any, variables: Set<string>) {
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
