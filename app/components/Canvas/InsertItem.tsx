import { HTMLTagData, createElementFromTag } from "./htmlTagsData"
import { Text } from "../ui/Text"
import { createElement } from "react"

interface InsertItemProps {
  tagData: HTMLTagData
  onClick: () => void
}

const renderPreview = (tagData: HTMLTagData) => {
  // Create the element with text content
  const element = createElementFromTag(tagData)

  // Only handle HTML elements (not components)
  if (element.type !== 'html') {
    return <div>Component</div>
  }

  // Override styles to fit in the preview box
  const previewStyles: React.CSSProperties = {
    ...element.styles,
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: '100%',
    position: 'static',
    margin: '0',
    fontSize: '6px',
    padding: '2px',
  }

  // Void elements that cannot have children
  const voidElements = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']
  const isVoidElement = voidElements.includes(element.tag?.toLowerCase() || '')

  // Special elements that use value prop instead of children
  const valueElements = ['textarea', 'select']
  const usesValueProp = valueElements.includes(element.tag?.toLowerCase() || '')

  // Get text content from children (TextLeafNode)
  const textChild = element.children?.find(child => child.type === 'text')
  const textContent = textChild?.type === 'text' ? textChild.text : undefined

  // Build props for the element
  const elementProps: any = {
    style: previewStyles,
  }

  if (usesValueProp && textContent) {
    elementProps.defaultValue = textContent
  }

  // Render the element using createElement
  return (
    <div className="pointer-events-none text-[6px] leading-tight">
      {createElement(
        element.tag ?? 'div',
        elementProps,
        isVoidElement || usesValueProp ? undefined : textContent
      )}
    </div>
  )
}

export const InsertItem = ({ tagData, onClick }: InsertItemProps) => {
  return (
    <div
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors border-b border-border cursor-pointer"
    >
      {/* Preview box */}
      <div className="shrink-0 w-10 h-10 rounded border border-border flex items-center justify-center bg-secondary">
        {renderPreview(tagData)}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 text-left">
        <Text size="sm" weight="medium" variant="primary" className="mb-0.5 block">
          {tagData.title}
        </Text>
        <Text size="xs" variant="secondary" className="truncate block">
          {tagData.description}
        </Text>
      </div>

      {/* Tag label */}
      <div className="shrink-0">
        <Text size="2xs" variant="tertiary" className="font-mono">
          &lt;{tagData.tag}&gt;
        </Text>
      </div>
    </div>
  )
}
