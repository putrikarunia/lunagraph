import { useState } from 'react'

const DEV_SERVER_URL = 'http://localhost:4001'

interface SaveFileOptions {
  filePath: string
  elements: any[]
  stateContext?: Record<string, any>  // Mock values used during editing
}

interface SaveFileResponse {
  success: boolean
  filePath?: string
  code?: string
  error?: string
}

interface LoadFileResponse {
  success: boolean
  filePath?: string
  returnJSX?: string
  variables?: string[]
  initialValues?: Record<string, any>
  props?: string[]
  raw?: string
  error?: string
}

export function useDevServer() {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = async (filePath: string): Promise<LoadFileResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${DEV_SERVER_URL}/api/files/${filePath}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load file')
      }

      // Return raw snapshot data (returnJSX, variables, initialValues, props)
      // Snapshot rendering happens in LunagraphEditor using useComponentSnapshot
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const saveFile = async (options: SaveFileOptions): Promise<SaveFileResponse> => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${DEV_SERVER_URL}/api/files/${options.filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elements: options.elements,
          stateContext: options.stateContext,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save file')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsSaving(false)
    }
  }

  return {
    loadFile,
    saveFile,
    isLoading,
    isSaving,
    error,
  }
}
