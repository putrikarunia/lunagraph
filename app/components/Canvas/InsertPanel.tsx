import { useState } from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { Text } from "../ui/Text"
import { FEElement } from "./types"
import { htmlTags, createElementFromTag } from "./htmlTagsData"
import { InsertItem } from "./InsertItem"

export const InsertPanel = ({onAddElement}: {
  onAddElement: (element: FEElement) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTags = htmlTags.filter(tag =>
    tag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Text size="xs" weight="semibold" variant="primary">
          HTML Elements
        </Text>
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
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Elements list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTags.length === 0 ? (
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
        )}
      </div>
    </div>
  )
}
