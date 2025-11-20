"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/Button"
import { Text } from "./ui/Text"
import { Input } from "./ui/Input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog"

interface CreateComponentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (componentName: string) => void
}

export function CreateComponentModal({
  isOpen,
  onClose,
  onConfirm,
}: CreateComponentModalProps) {
  const [componentName, setComponentName] = useState("")
  const [error, setError] = useState("")

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setComponentName("")
      setError("")
    }
  }, [isOpen])

  const handleConfirm = () => {
    const trimmed = componentName.trim()

    // Validation
    if (!trimmed) {
      setError("Component name is required")
      return
    }

    // Check PascalCase
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
      setError("Component name must be PascalCase (e.g., MyButton)")
      return
    }

    onConfirm(trimmed)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && componentName.trim()) {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Component</DialogTitle>
          <DialogDescription>
            Extract the selected element into a reusable component
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="componentName" className="block mb-2">
              <Text size="sm" className="text-muted-foreground">
                Component Name
              </Text>
            </label>
            <Input
              id="componentName"
              type="text"
              value={componentName}
              onChange={(e) => {
                setComponentName(e.target.value)
                setError("")
              }}
              onKeyDown={handleKeyDown}
              placeholder="MyButton"
              autoFocus
              aria-invalid={!!error}
            />
            {error && (
              <Text size="xs" className="text-red-500 mt-1">
                {error}
              </Text>
            )}
            <Text size="xs" className="text-muted-foreground mt-1">
              Must be PascalCase (e.g., MyButton, CardHeader)
            </Text>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirm}
            disabled={!componentName.trim()}
          >
            Create Component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
