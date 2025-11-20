import { generateJSX } from '@lunagraph/codegen'
import type { FEElement } from './types'
import { Button } from './ui/Button'
import { Text } from './ui/Text'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { FloppyDisk } from '@phosphor-icons/react'
import { useDevServer } from '../hooks/useDevServer'
import { useState } from 'react'

export interface EditorTab {
  id: string
  name: string
  type: 'canvas' | 'file'
  elements: FEElement[]

  // For canvas tabs:
  canvasId?: string              // Slug: "homepage-hero"
  canvasPath?: string            // ".lunagraph/canvases/homepage-hero/"
  canvasSaved?: boolean          // Track if canvas needs saving

  // For file tabs (snapshot rendering):
  filePath?: string
  returnJSX?: string
  variables?: string[]
  initialValues?: Record<string, any>
  props?: string[]
  mockValues?: Record<string, any>
}

interface BottomBarProps {
  tab: EditorTab
  onSaveSuccess?: (filePath: string) => void
}

export function BottomBar({ tab, onSaveSuccess }: BottomBarProps) {
  const code = generateJSX(tab.elements)
  const { saveFile, isSaving, error } = useDevServer()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async () => {
    if (tab.type !== 'file' || !tab.filePath) {
      return
    }

    const result = await saveFile({
      filePath: tab.filePath,
      elements: tab.elements,
      stateContext: tab.mockValues,  // Pass mock values to help Claude understand snapshot context
    })

    if (result.success) {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)

      // Reload the file to get updated content
      if (onSaveSuccess && tab.filePath) {
        onSaveSuccess(tab.filePath)
      }
    } else {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const canSave = tab.type === 'file' && tab.filePath

  return (
    <div className="h-full flex flex-col border-t border-border bg-background">
      {/* Action bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <Text size="xs" className="text-muted-foreground">
          {tab.type === 'file' ? tab.filePath : 'Free Canvas'}
        </Text>
        <div className="flex items-center gap-2">
          {error && saveStatus === 'error' && (
            <Text size="xs" className="text-red-600">
              {error}
            </Text>
          )}
          {saveStatus === 'success' && (
            <Text size="xs" className="text-green-600">
              Saved!
            </Text>
          )}
          {canSave && (
            <Button
              variant="default"
              size="xs"
              onClick={handleSave}
              disabled={isSaving}
              LeftIcon={FloppyDisk}
              leftIconProps={{weight: "fill"}}
            >
              {isSaving ? 'Saving...' : 'Save to code'}
            </Button>
          )}
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
