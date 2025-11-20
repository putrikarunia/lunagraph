import { useState } from 'react'
import type { CanvasData } from '@lunagraph/codegen'
import type { FEElement } from '../components/types'

const DEV_SERVER_URL = process.env.NEXT_PUBLIC_LUNAGRAPH_DEV_SERVER || 'http://localhost:4001'

interface SaveCanvasParams {
  id?: string
  name: string
  elements: FEElement[]
  zoom?: number
  pan?: { x: number; y: number }
  metadata?: {
    description?: string
    tags?: string[]
  }
}

interface CreateComponentParams {
  canvasId: string
  componentName: string
  code: string
}

export function useCanvasPersistence() {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveCanvas = async (params: SaveCanvasParams) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${DEV_SERVER_URL}/api/canvas/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save canvas')
      }

      return {
        success: true,
        canvas: result.canvas as CanvasData,
      }
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

  const loadCanvas = async (canvasId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${DEV_SERVER_URL}/api/canvas/${canvasId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load canvas')
      }

      return {
        success: true,
        canvas: result.canvas as CanvasData,
      }
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

  const listCanvases = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${DEV_SERVER_URL}/api/canvas`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to list canvases')
      }

      return {
        success: true,
        canvases: result.canvases as CanvasData[],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
        canvases: [],
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createComponent = async (params: CreateComponentParams) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `${DEV_SERVER_URL}/api/canvas/${params.canvasId}/component`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            componentName: params.componentName,
            code: params.code,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create component')
      }

      return {
        success: true,
        componentName: result.componentName,
        path: result.path,
      }
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
    saveCanvas,
    loadCanvas,
    listCanvases,
    createComponent,
    isSaving,
    isLoading,
    error,
  }
}
