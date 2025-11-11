import { Project, SyntaxKind, Node } from 'ts-morph'
import * as path from 'path'
import * as fs from 'fs'

export interface ComponentInfo {
  path: string
  exportName: string
  props?: Record<string, any>
}

export interface ComponentIndex {
  [componentName: string]: ComponentInfo
}

/**
 * Scans a directory for React components and extracts their metadata
 */
export class ComponentScanner {
  private project: Project
  private componentIndex: ComponentIndex = {}

  constructor(private rootDir: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(rootDir, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true,
    })
  }

  /**
   * Scan a glob pattern for components
   */
  async scan(pattern: string = 'app/components/**/*.{ts,tsx}'): Promise<ComponentIndex> {
    console.log(`Scanning: ${pattern}`)

    // Add source files
    const sourceFiles = this.project.addSourceFilesAtPaths(pattern)

    console.log(`Found ${sourceFiles.length} files`)

    for (const sourceFile of sourceFiles) {
      this.scanFile(sourceFile.getFilePath())
    }

    return this.componentIndex
  }

  /**
   * Check if a node is a React component
   */
  private isReactComponent(node: Node): boolean {
    // Check for function components
    if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node) || Node.isFunctionExpression(node)) {
      const returnType = node.getReturnType()
      const returnTypeText = returnType.getText()

      // Check if it returns JSX or React elements
      if (
        returnTypeText.includes('JSX.Element') ||
        returnTypeText.includes('React.ReactElement') ||
        returnTypeText.includes('ReactElement') ||
        returnTypeText.includes('React.ReactNode') ||
        returnTypeText.includes('ReactNode')
      ) {
        return true
      }

      // Check if function body contains JSX
      if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node)) {
        const body = node.getBody()
        if (body) {
          const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement)
          const jsxSelfClosing = body.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
          if (jsxElements.length > 0 || jsxSelfClosing.length > 0) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Extract props from a type node (for forwardRef type parameters)
   */
  private extractPropsFromTypeNode(typeNode: Node): Record<string, any> | undefined {
    const props: Record<string, any> = {}

    // Handle type reference (e.g., ButtonProps, TextProps)
    if (Node.isTypeReference(typeNode)) {
      const typeName = typeNode.getTypeName()
      if (Node.isIdentifier(typeName)) {
        // Get the type declaration
        const type = typeNode.getType()
        const symbol = type.getSymbol()
        const declarations = symbol?.getDeclarations()

        if (declarations && declarations.length > 0) {
          const declaration = declarations[0]

          // Handle interface declaration
          if (Node.isInterfaceDeclaration(declaration)) {
            const members = declaration.getMembers()
            for (const member of members) {
              if (Node.isPropertySignature(member)) {
                const name = member.getName()
                const type = member.getType().getText()
                props[name] = {
                  type,
                  required: !member.hasQuestionToken(),
                }
              }
            }
          }

          // Handle type alias (e.g., type TextProps = PropsWithChildren<{...}>)
          else if (Node.isTypeAliasDeclaration(declaration)) {
            const aliasTypeNode = declaration.getTypeNode()

            // Check if it's PropsWithChildren or similar utility type
            if (aliasTypeNode && Node.isTypeReference(aliasTypeNode)) {
              const utilityTypeName = aliasTypeNode.getTypeName()
              if (Node.isIdentifier(utilityTypeName)) {
                const utilityName = utilityTypeName.getText()

                // Handle PropsWithChildren<{...}>
                if (utilityName === 'PropsWithChildren') {
                  props['children'] = {
                    type: 'React.ReactNode',
                    required: false,
                  }

                  // Extract props from the type argument
                  const typeArgs = aliasTypeNode.getTypeArguments()
                  if (typeArgs.length > 0) {
                    const innerType = typeArgs[0]
                    if (Node.isTypeLiteral(innerType)) {
                      const members = innerType.getMembers()
                      for (const member of members) {
                        if (Node.isPropertySignature(member)) {
                          const name = member.getName()
                          const type = member.getType().getText()
                          props[name] = {
                            type,
                            required: !member.hasQuestionToken(),
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            // Direct type literal
            else if (aliasTypeNode && Node.isTypeLiteral(aliasTypeNode)) {
              const members = aliasTypeNode.getMembers()
              for (const member of members) {
                if (Node.isPropertySignature(member)) {
                  const name = member.getName()
                  const type = member.getType().getText()
                  props[name] = {
                    type,
                    required: !member.hasQuestionToken(),
                  }
                }
              }
            }
          }
        }

        // Also check for extended types (interface extends X)
        const properties = type.getProperties()
        for (const prop of properties) {
          const name = prop.getName()
          if (!props[name]) {  // Don't overwrite already extracted props
            const propType = prop.getTypeAtLocation(typeNode)
            props[name] = {
              type: propType.getText(),
              required: !prop.isOptional(),
            }
          }
        }
      }
    }

    return Object.keys(props).length > 0 ? props : undefined
  }

  /**
   * Detect HTML element name from type text (e.g., "button" from ComponentProps<"button">)
   */
  private detectHTMLElement(typeText: string): string | null {
    const match = typeText.match(/ComponentProps(?:WithoutRef|WithRef)?<["'](\w+)["']>/)
    return match ? match[1] : null
  }

  /**
   * Get base HTML element props by creating a temporary type
   */
  private getBaseHTMLElementProps(elementName: string): Set<string> {
    try {
      // Create a temporary source file with the element type
      const tempFile = this.project.createSourceFile(
        '__temp__.tsx',
        `import React from 'react'; type Props = React.ComponentProps<'${elementName}'>`,
        { overwrite: true }
      )

      const typeAlias = tempFile.getTypeAliases()[0]
      if (typeAlias) {
        const type = typeAlias.getType()
        const props = type.getProperties()
        const propNames = new Set(props.map(p => p.getName()))

        // Clean up
        this.project.removeSourceFile(tempFile)

        return propNames
      }

      this.project.removeSourceFile(tempFile)
    } catch (error) {
      // If we can't resolve it, return empty set
    }

    return new Set<string>()
  }

  /**
   * Extract props from inline type literals in an intersection type
   */
  private extractInlineProps(typeNode: Node): Record<string, any> | undefined {
    const props: Record<string, any> = {}

    // Handle intersection type: A & B & C
    if (Node.isIntersectionTypeNode(typeNode)) {
      for (const typeRef of typeNode.getTypeNodes()) {
        // Extract from inline type literals only
        if (Node.isTypeLiteral(typeRef)) {
          const members = typeRef.getMembers()
          for (const member of members) {
            if (Node.isPropertySignature(member)) {
              const name = member.getName()
              const type = member.getType().getText()
              props[name] = {
                type,
                required: !member.hasQuestionToken(),
              }
            }
          }
        }
      }
    }
    // Single inline type literal
    else if (Node.isTypeLiteral(typeNode)) {
      const members = typeNode.getMembers()
      for (const member of members) {
        if (Node.isPropertySignature(member)) {
          const name = member.getName()
          const type = member.getType().getText()
          props[name] = {
            type,
            required: !member.hasQuestionToken(),
          }
        }
      }
    }

    return Object.keys(props).length > 0 ? props : undefined
  }

  /**
   * Extract props from a component
   */
  private extractProps(node: Node): Record<string, any> | undefined {
    const allProps: Record<string, any> = {}

    if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node) || Node.isFunctionExpression(node)) {
      const params = node.getParameters()
      if (params.length > 0) {
        const firstParam = params[0]
        const typeNode = firstParam.getTypeNode()
        const paramType = firstParam.getType()

        // Check if this type extends HTML element props or library component props
        // Use typeNode (source annotation) not paramType (resolved type)
        const typeText = typeNode ? typeNode.getText() : ''
        const htmlElement = this.detectHTMLElement(typeText)

        // Check if it's extending a library component (ComponentProps<typeof ...>)
        const isLibraryComponent = /ComponentProps(?:WithoutRef|WithRef)?<typeof/.test(typeText)

        // If it's a library component, extract ONLY inline props + style + children
        if (isLibraryComponent) {
          const result: Record<string, any> = {}

          // Extract inline props if there's an intersection
          if (typeNode && Node.isIntersectionTypeNode(typeNode)) {
            const inlineProps = this.extractInlineProps(typeNode)
            if (inlineProps) {
              Object.assign(result, inlineProps)
            }
          }

          // Add style and children if they exist in the full type
          const properties = paramType.getProperties()
          const hasStyle = properties.some(p => p.getName() === 'style')
          const hasChildren = properties.some(p => p.getName() === 'children')

          if (hasStyle && !result['style']) {
            result['style'] = {
              type: 'React.CSSProperties | undefined',
              required: false,
            }
          }
          if (hasChildren && !result['children']) {
            result['children'] = {
              type: 'React.ReactNode',
              required: false,
            }
          }

          // Return only if we have at least style or children or custom props
          return Object.keys(result).length > 0 ? result : undefined
        }

        // Get all properties from the parameter type
        const properties = paramType.getProperties()
        for (const prop of properties) {
          const name = prop.getName()
          const propType = prop.getTypeAtLocation(typeNode || firstParam)
          allProps[name] = {
            type: propType.getText(),
            required: !prop.isOptional(),
          }
        }

        // If it's an HTML element, filter to keep only custom props
        if (htmlElement) {
          // Get base HTML element props
          const baseProps = this.getBaseHTMLElementProps(htmlElement)

          // Filter to keep only: custom props + style + children
          const filtered: Record<string, any> = {}
          for (const [name, value] of Object.entries(allProps)) {
            // Always keep style and children
            if (name === 'style' || name === 'children') {
              filtered[name] = value
            }
            // Keep if it's NOT in base HTML props (= custom prop)
            else if (!baseProps.has(name)) {
              filtered[name] = value
            }
          }

          return Object.keys(filtered).length > 0 ? filtered : undefined
        }

        // Not extending HTML props or library - keep all props
        return Object.keys(allProps).length > 0 ? allProps : undefined
      }
    }

    return undefined
  }

  /**
   * Scan a single file for exported React components
   */
  private scanFile(filePath: string) {
    const sourceFile = this.project.getSourceFile(filePath)
    if (!sourceFile) return

    const relativePath = path.relative(this.rootDir, filePath)

    // Find all exported declarations
    const exports = sourceFile.getExportedDeclarations()

    exports.forEach((declarations, exportName) => {
      for (const declaration of declarations) {
        // Check function declarations
        if (Node.isFunctionDeclaration(declaration)) {
          if (this.isReactComponent(declaration)) {
            const newEntry = {
              path: relativePath,
              exportName,
              props: this.extractProps(declaration),
            }
            // Only overwrite if new entry has props or existing doesn't exist
            if (!this.componentIndex[exportName] || newEntry.props) {
              this.componentIndex[exportName] = newEntry
            }
          }
        }

        // Check variable declarations (const Component = () => {})
        if (Node.isVariableDeclaration(declaration)) {
          const initializer = declaration.getInitializer()

          // Handle React.forwardRef
          if (initializer && Node.isCallExpression(initializer)) {
            const expression = initializer.getExpression()
            const expressionText = expression.getText()

            // Check if it's React.forwardRef or forwardRef
            if (expressionText === 'React.forwardRef' || expressionText === 'forwardRef') {
              // Extract props from the type parameters of forwardRef<Ref, Props>
              const typeArgs = initializer.getTypeArguments()
              let propsFromForwardRef = undefined

              // Second type argument is the Props type
              if (typeArgs.length >= 2) {
                const propsTypeNode = typeArgs[1]
                propsFromForwardRef = this.extractPropsFromTypeNode(propsTypeNode)
              }

              // If we couldn't get props from type args, try the function parameter
              if (!propsFromForwardRef) {
                const args = initializer.getArguments()
                if (args.length > 0) {
                  const firstArg = args[0]
                  if (Node.isArrowFunction(firstArg) || Node.isFunctionExpression(firstArg)) {
                    propsFromForwardRef = this.extractProps(firstArg)
                  }
                }
              }

              const newEntry = {
                path: relativePath,
                exportName,
                props: propsFromForwardRef,
              }
              // Only overwrite if new entry has props or existing doesn't exist
              if (!this.componentIndex[exportName] || newEntry.props) {
                this.componentIndex[exportName] = newEntry
              }
            }
          }
          // Regular arrow function or function expression
          else if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            if (this.isReactComponent(initializer)) {
              const newEntry = {
                path: relativePath,
                exportName,
                props: this.extractProps(initializer),
              }
              // Only overwrite if new entry has props or existing doesn't exist
              if (!this.componentIndex[exportName] || newEntry.props) {
                this.componentIndex[exportName] = newEntry
              }
            }
          }
        }
      }
    })
  }

  /**
   * Write the component index to a JSON file
   */
  async writeIndex(outputPath: string) {
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(this.componentIndex, null, 2),
      'utf-8'
    )
  }
}
