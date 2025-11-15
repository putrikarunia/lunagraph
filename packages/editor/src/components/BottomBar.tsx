import { generateJSX } from '@lunagraph/codegen'
import type { FEElement } from './types'
import { Button } from './ui/Button'
import { Text } from './ui/Text'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { X } from '@phosphor-icons/react'
import { cn } from '../lib/utils'

export interface EditorTab {
  id: string
  name: string
  type: 'canvas' | 'file'
  filePath?: string
  elements: FEElement[]
}

interface BottomBarProps {
  tabs: EditorTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

export function BottomBar({ tabs, activeTabId, onTabChange, onTabClose }: BottomBarProps) {
  const activeTab = tabs.find(tab => tab.id === activeTabId)
  const code = activeTab ? generateJSX(activeTab.elements) : ''

  return (
    <div className="h-full flex flex-col border-t border-border bg-background">
      {/* Tabs bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2",
                  "border-r border-border cursor-pointer",
                  "transition-colors hover:bg-accent/50",
                  isActive
                    ? "bg-background border-b-2 border-b-primary"
                    : "bg-transparent"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <Text size="xs" weight={isActive ? "medium" : "regular"}>
                  {tab.name}
                </Text>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTabClose(tab.id)
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100",
                      "hover:bg-accent rounded p-0.5",
                      "transition-opacity"
                    )}
                  >
                    <X size={12} weight="bold" className="text-muted-foreground" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigator.clipboard.writeText(code)}
          >
            Copy
          </Button>
        </div>
      </div>

      {/* Code editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={code || '<empty canvas>'}
          height="100%"
          extensions={[javascript({ jsx: true })]}
          editable={false}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: false,
            highlightActiveLine: false,
            foldGutter: false,
          }}
        />
      </div>
    </div>
  )
}
