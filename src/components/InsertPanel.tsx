import { useState } from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { Text } from "./ui/Text"
import { FEElement, ComponentElement } from "./types"
import { htmlTags, createElementFromTag } from "./htmlTagsData"
import { InsertItem } from "./InsertItem"
import { ComponentIndex } from "./LunagraphEditor"

interface InsertPanelProps {
  onAddElement: (element: FEElement) => void
  componentIndex?: ComponentIndex
}

export const InsertPanel = ({ onAddElement, componentIndex = {} }: InsertPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"components" | "html">("components")

  // Convert componentIndex to array format
  const components = Object.entries(componentIndex).map(([name, data]) => ({
    name,
    ...data
  }))

  const filteredComponents = components.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTags = htmlTags.filter(tag =>
    tag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createComponentElement = (componentName: string): ComponentElement => {
    // Get component info from index
    const componentInfo = componentIndex[componentName]

    // Generate default props based on prop types
    const defaultProps: Record<string, any> = {}
    let hasChildrenProp = false

    if (componentInfo?.props) {
      Object.entries(componentInfo.props).forEach(([propName, propInfo]: [string, any]) => {
        // Check if this is the children prop
        if (propName === 'children') {
          hasChildrenProp = true
          return // Don't add to props, handle separately
        }

        const propType = propInfo?.type || propInfo
        const isRequired = propInfo?.required || false

        // Skip complex types that can't be auto-generated
        if (
          propType.includes('=>') ||  // Functions
          propType.includes('() =>') ||
          propType.includes('ComponentType') ||
          propType.includes('Element') ||
          propType.includes('CSSProperties')
        ) {
          if (isRequired) {
            // If required, need to provide something - use undefined for now
            defaultProps[propName] = undefined
          }
          return
        }

        // Handle union types (e.g., 'primary' | 'secondary' | 'ghost')
        if (propType.includes('|')) {
          const options = propType.split('|').map((s: string) => s.trim().replace(/['"]/g, ''))
          // Pick first non-undefined option
          const firstValid = options.find((opt: string) => opt !== 'undefined' && opt.length > 0)
          if (firstValid) {
            defaultProps[propName] = firstValid
          } else if (isRequired) {
            defaultProps[propName] = options[0]
          }
          return
        }

        // Common prop name defaults
        if (propName === 'variant') {
          defaultProps[propName] = 'default'
          return
        }
        if (propName === 'size') {
          defaultProps[propName] = 'default'
          return
        }

        // Generate defaults based on type
        if (isRequired || propType.includes('string')) {
          if (propType === 'string') {
            defaultProps[propName] = propName // Use prop name as placeholder
          }
        } else if (propType.includes('number')) {
          if (isRequired) defaultProps[propName] = 0
        } else if (propType.includes('boolean')) {
          if (isRequired) defaultProps[propName] = false
        }
      })
    }

    // Add default text child for components that have children prop
    const defaultChildren: FEElement[] | undefined = hasChildrenProp ? [{
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      tag: 'span',
      text: componentName, // Use component name as default text
    }] : undefined

    return {
      id: `component-${Date.now()}-${Math.random()}`,
      type: 'component',
      componentName,
      props: defaultProps,
      styles: {},
      children: defaultChildren,
      canvasPosition: { x: 100, y: 100 }
    }
  }

  return (
    <div className="w-full flex flex-col flex-1 overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={() => setActiveTab("components")}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === "components"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Components ({components.length})
        </button>
        <button
          onClick={() => setActiveTab("html")}
          className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors ${
            activeTab === "html"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          HTML Elements
        </button>
      </div>

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
            placeholder={activeTab === "components" ? "Search components..." : "Search elements..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "components" ? (
          filteredComponents.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Text size="sm" variant="secondary">
                {components.length === 0
                  ? "No components found. Run 'lunagraph scan' to index your components."
                  : "No components match your search"
                }
              </Text>
            </div>
          ) : (
            filteredComponents.map((comp) => (
              <div
                key={comp.name}
                onClick={() => onAddElement(createComponentElement(comp.name))}
                className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border transition-colors"
              >
                <Text size="sm" weight="medium">{comp.name}</Text>
                <Text size="xs" variant="secondary" className="mt-1">
                  {comp.path}
                </Text>
              </div>
            ))
          )
        ) : (
          filteredTags.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Text size="sm" variant="secondary">
                No elements found
              </Text>
            </div>
          ) : (
            filteredTags.map((tagData) => (
              <InsertItem
                key={tagData.tag}
                tagData={tagData}
                onClick={() => onAddElement(createElementFromTag(tagData))}
              />
            ))
          )
        )}
      </div>
    </div>
  )
}
