import { useState } from "react"
import { MagnifyingGlassIcon, TextT } from "@phosphor-icons/react"
import { Text } from "./ui/Text"
import { FEElement } from "./types"
import { htmlTags, createElementFromTag } from "./htmlTagsData"
import { InsertItem } from "./InsertItem"
import { generatePrefixedId } from "./utils/idUtils"

interface InsertPanelProps {
  onAddElement: (element: FEElement) => void
}

export const InsertPanel = ({ onAddElement }: InsertPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("")

  const createTextNode = (): FEElement => ({
    id: generatePrefixedId('text'),
    type: 'text',
    tag: 'span',
    text: 'Text',
    styles: {},
    canvasPosition: { x: 100, y: 100 }
  })

  const filteredTags = htmlTags.filter(tag =>
    tag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if "text" matches the search query
  const showTextNode = searchQuery === '' ||
    'text'.includes(searchQuery.toLowerCase())

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
            placeholder="Search HTML elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {/* HTML elements list */}
      <div className="flex-1 overflow-y-auto">
        {!showTextNode && filteredTags.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Text size="sm" variant="secondary">
              No elements found
            </Text>
          </div>
        ) : (
          <>
            {/* Text node at the top */}
            {showTextNode && (
              <div
                className="py-3 px-4 hover:bg-accent cursor-pointer transition-colors flex items-center gap-3 border-b border-border"
                onClick={() => onAddElement(createTextNode())}
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                  style={{ background: '#6b7280' }}
                >
                  <TextT size={20} weight="bold" className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Text</div>
                  <div className="text-xs text-muted-foreground">Plain text node</div>
                </div>
              </div>
            )}

            {/* HTML elements */}
            {filteredTags.map((tagData) => (
              <InsertItem
                key={tagData.tag}
                tagData={tagData}
                onClick={() => onAddElement(createElementFromTag(tagData))}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
