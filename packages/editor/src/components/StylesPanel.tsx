"use client";

import React, { useEffect, useState } from "react";
import { FEElement } from "./types";
import { findElement } from "./utils/treeUtils";

interface StylesPanelProps {
  selectedElementId: string | null;
  elements: FEElement[];
  onUpdateElementStyles: (elementId: string, styles: React.CSSProperties) => void;
}

export default function StylesPanel({ selectedElementId, elements, onUpdateElementStyles }: StylesPanelProps) {
  const [cssText, setCssText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    // Only sync from state when not actively editing
    if (isEditing) return;

    if (!selectedElementId) {
      setCssText('');
      return;
    }

    // Find the element in state
    const element = findElement(elements, selectedElementId);
    if (!element) {
      setCssText('');
      return;
    }

    // Convert element.styles to CSS text format
    const styles = element.styles || {};
    const cssStr = Object.entries(styles)
      .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
      .join('\n');

    setCssText(cssStr);
  }, [selectedElementId, elements, isEditing]);

  const handleCssChange = (newCssText: string) => {
    setCssText(newCssText);
    setError('');

    if (!selectedElementId) return;

    // Parse CSS text into styles object
    try {
      const styles: React.CSSProperties = {};
      const lines = newCssText.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const prop = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove trailing semicolon
        if (value.endsWith(';')) {
          value = value.slice(0, -1).trim();
        }

        if (prop && value) {
          // Convert kebab-case to camelCase
          const camelProp = kebabToCamel(prop);
          (styles as any)[camelProp] = value;
        }
      }

      onUpdateElementStyles(selectedElementId, styles);
    } catch (e) {
      setError('Invalid CSS format');
    }
  };

  if (!selectedElementId) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4">
        Select an element to edit its styles
      </div>
    );
  }

  const element = findElement(elements, selectedElementId);
  const elementType = element?.type === 'component'
    ? `Component: ${(element as any).componentName}`
    : element?.type === 'html'
    ? `HTML: <${(element as any).tag}>`
    : 'Text';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="border-b border-border p-3">
        <h3 className="text-sm font-semibold">Styles</h3>
        <p className="text-xs text-muted-foreground mt-1">{elementType}</p>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <textarea
          value={cssText}
          onChange={(e) => handleCssChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            // Allow Enter key for newlines
            if (e.key === 'Enter') {
              e.stopPropagation();
            }
          }}
          className="w-full h-full font-mono text-xs bg-background border border-border rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="width: 100px;&#10;height: 100px;&#10;background-color: blue;"
          spellCheck={false}
        />
        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}
      </div>

      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        <p>Edit CSS properties in the format:</p>
        <code className="block mt-1 text-[10px] bg-neutral-100 p-1 rounded">property-name: value;</code>
      </div>
    </div>
  );
}

// Helper functions
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
