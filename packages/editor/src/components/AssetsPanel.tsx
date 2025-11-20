import React, { useState } from "react"
import { MagnifyingGlassIcon, FileTsIcon, CaretRightIcon, FolderIcon, DiamondsFourIcon, AtomIcon } from "@phosphor-icons/react"
import { Text } from "./ui/Text"
import { FEElement, ComponentElement } from "./types"
import { ComponentIndex } from "./LunagraphEditor"
import { generatePrefixedId } from "./utils/idUtils"

interface AssetsPanelProps {
  onAddElement: (element: FEElement) => void
  onEditComponent?: (componentName: string, filePath: string) => void
  componentIndex?: ComponentIndex
}

// Build folder tree structure from component paths
interface TreeNode {
  name: string
  type: 'folder' | 'file' | 'component'
  path: string
  componentName?: string
  children?: TreeNode[]
}

function buildFileTree(componentIndex: ComponentIndex): TreeNode {
  const root: TreeNode = { name: 'components', type: 'folder', path: '', children: [] }

  Object.entries(componentIndex).forEach(([componentName, data]) => {
    const pathParts = data.path.split('/')
    let current = root

    // Navigate/create folder structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i]
      let folder = current.children?.find(child => child.name === folderName && child.type === 'folder')

      if (!folder) {
        folder = { name: folderName, type: 'folder', path: pathParts.slice(0, i + 1).join('/'), children: [] }
        current.children = current.children || []
        current.children.push(folder)
      }

      current = folder
    }

    // Get the file name (e.g., "button.tsx")
    const fileName = pathParts[pathParts.length - 1]

    // Find or create file node
    let fileNode = current.children?.find(child => child.name === fileName && child.type === 'file')
    if (!fileNode) {
      fileNode = {
        name: fileName,
        type: 'file',
        path: data.path,
        children: []
      }
      current.children = current.children || []
      current.children.push(fileNode)
    }

    // Add component as child of file node
    fileNode.children = fileNode.children || []
    fileNode.children.push({
      name: componentName,
      type: 'component',
      path: data.path,
      componentName
    })
  })

  return root
}

export const AssetsPanel = ({ onAddElement, onEditComponent, componentIndex = {} }: AssetsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    'components': true // Root expanded by default
  })

  const fileTree = buildFileTree(componentIndex)
  const componentCount = Object.keys(componentIndex).length

  const togglePath = (path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const createComponentElement = (componentName: string): ComponentElement => {
    const componentInfo = componentIndex[componentName]
    const defaultProps: Record<string, any> = {}
    let hasChildrenProp = false

    if (componentInfo?.props) {
      Object.entries(componentInfo.props).forEach(([propName, propInfo]: [string, any]) => {
        if (propName === 'children') {
          hasChildrenProp = true
          return
        }

        const propType = propInfo?.type || propInfo
        const isRequired = propInfo?.required || false

        if (
          propType.includes('=>') ||
          propType.includes('() =>') ||
          propType.includes('ComponentType') ||
          propType.includes('Element') ||
          propType.includes('CSSProperties')
        ) {
          if (isRequired) {
            defaultProps[propName] = undefined
          }
          return
        }

        if (propType.includes('|') && (propType.includes('"') || propType.includes("'"))) {
          const options = propType.split('|').map((s: string) => s.trim().replace(/['"]/g, ''))
          const firstValid = options.find((opt: string) =>
            opt !== 'undefined' && opt !== 'null' && opt.length > 0
          )
          if (firstValid && isRequired) {
            defaultProps[propName] = firstValid
          }
          return
        }

        if (propType.includes('string')) {
          if (isRequired) defaultProps[propName] = propName
        } else if (propType.includes('number')) {
          if (isRequired) defaultProps[propName] = 0
        } else if (propType.includes('boolean')) {
          if (isRequired) defaultProps[propName] = false
        }
      })
    }

    const defaultChildren: FEElement[] | undefined = hasChildrenProp ? [] : undefined

    return {
      id: generatePrefixedId('component'),
      type: 'component',
      componentName,
      props: defaultProps,
      styles: {},
      children: defaultChildren,
      canvasPosition: { x: 100, y: 100 }
    }
  }

  // Recursive tree renderer
  const renderTree = (node: TreeNode, depth: number = 0): React.ReactElement | null => {
    if (node.type === 'folder' && !node.children?.length) return null
    if (node.type === 'file' && !node.children?.length) return null

    const isExpanded = expandedPaths[node.path] ?? true
    const paddingLeft = depth * 12 + 16 // 12px per level + 16px base

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            onClick={() => togglePath(node.path)}
            className="py-1.5 hover:bg-accent cursor-pointer transition-colors flex items-center gap-1.5"
            style={{ paddingLeft }}
          >
            <CaretRightIcon
              size={14}
              weight="bold"
              className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            />
            <FolderIcon size={14} weight="bold" className="text-muted-foreground shrink-0" />
            <Text size="xs" weight="medium" variant="secondary">{node.name}</Text>
          </div>
          {isExpanded && node.children?.map(child => renderTree(child, depth + 1))}
        </div>
      )
    }

    // File node
    if (node.type === 'file') {
      return (
        <div key={node.path}>
          <div
            onClick={() => togglePath(node.path)}
            className="py-1.5 hover:bg-accent cursor-pointer transition-colors flex items-center gap-1.5"
            style={{ paddingLeft }}
          >
            <CaretRightIcon
              size={14}
              weight="bold"
              className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            />
            <AtomIcon size={14} weight="bold" className="text-muted-foreground shrink-0" />
            <Text size="xs" weight="medium">{node.name}</Text>
          </div>
          {isExpanded && node.children?.map(child => renderTree(child, depth + 1))}
        </div>
      )
    }

    // Component node
    let clickTimer: NodeJS.Timeout | null = null

    const handleClick = (e: React.MouseEvent) => {
      // Clear any pending single-click action
      if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null
      }

      if (e.detail === 1) {
        // Single click - wait to see if it becomes a double-click
        clickTimer = setTimeout(() => {
          onAddElement(createComponentElement(node.componentName!))
        }, 250)
      } else if (e.detail === 2) {
        // Double click - edit component
        console.log("Double click detected!", node.componentName)
        onEditComponent?.(node.componentName!, node.path)
      }
    }

    return (
      <div
        key={node.componentName}
        onClick={handleClick}
        className="py-1.5 hover:bg-accent cursor-pointer transition-colors flex items-center gap-1.5"
        style={{ paddingLeft }}
      >
        <div className="w-3.5 shrink-0" /> {/* Spacer instead of caret */}
        <DiamondsFourIcon size={14} weight="fill" className="text-purple-500 shrink-0" />
        <Text size="xs" weight="medium">{node.name}</Text>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col flex-1 overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <MagnifyingGlassIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            weight="bold"
          />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Component tree */}
      <div className="flex-1 overflow-y-auto">
        {componentCount === 0 ? (
          <div className="px-4 py-8 text-center">
            <Text size="sm" variant="secondary">
              No components found. Run 'lunagraph scan' to index your components.
            </Text>
          </div>
        ) : (
          <div className="py-2">
            {fileTree.children?.map(child => renderTree(child, 0))}
          </div>
        )}
      </div>
    </div>
  )
}
