"use client";

import React, { useState, useEffect } from "react";
import { FEElement, ComponentElement } from "./types";
import { findElement } from "./utils/treeUtils";
import { ComponentIndex } from "./LunagraphEditor";

interface PropsPanelProps {
  selectedElementId: string | null;
  elements: FEElement[];
  componentIndex?: ComponentIndex;
  onUpdateElementProps: (elementId: string, props: Record<string, any>) => void;
}

export default function PropsPanel({
  selectedElementId,
  elements,
  componentIndex,
  onUpdateElementProps
}: PropsPanelProps) {
  const [propValues, setPropValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedElementId) {
      setPropValues({});
      return;
    }

    const element = findElement(elements, selectedElementId);
    if (!element || element.type !== 'component') {
      setPropValues({});
      return;
    }

    // Initialize prop values from element.props
    const componentElement = element as ComponentElement;
    const currentProps = componentElement.props || {};

    // Convert all values to strings for input fields
    const stringValues: Record<string, string> = {};
    Object.entries(currentProps).forEach(([key, value]) => {
      // Skip style and className - they're handled separately
      if (key === 'style' || key === 'className') return;
      stringValues[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    });

    setPropValues(stringValues);
  }, [selectedElementId, elements]);

  if (!selectedElementId) {
    return null;
  }

  const element = findElement(elements, selectedElementId);
  if (!element || element.type !== 'component') {
    return null;
  }

  const componentElement = element as ComponentElement;
  const componentName = componentElement.componentName;
  const componentInfo = componentIndex?.[componentName];
  const availableProps = componentInfo?.props || {};

  // Filter out style and className props
  const editableProps = Object.entries(availableProps).filter(
    ([key]) => key !== 'style' && key !== 'className'
  );

  if (editableProps.length === 0) {
    return null;
  }

  const handlePropChange = (propName: string, value: string) => {
    setPropValues(prev => ({ ...prev, [propName]: value }));

    // Parse value and update element props
    let parsedValue: any = value;

    // Try to parse as JSON for objects/arrays
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string if invalid JSON
      }
    } else if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      // Parse numbers
      parsedValue = Number(value);
    }

    const newProps = {
      ...componentElement.props,
      [propName]: parsedValue,
    };

    onUpdateElementProps(selectedElementId, newProps);
  };

  return (
    <div className="border-b border-border">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Props</h3>
        <p className="text-xs text-muted-foreground mt-1">{componentName}</p>
      </div>

      <div className="p-3 space-y-3 max-h-[300px] overflow-auto">
        {editableProps.map(([propName, propInfo]) => {
          const isRequired = (propInfo as any).required;
          const propType = (propInfo as any).type || 'string';
          const currentValue = propValues[propName] || '';

          return (
            <div key={propName}>
              <label className="block text-xs font-medium mb-1">
                {propName}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => handlePropChange(propName, e.target.value)}
                onKeyDown={(e) => {
                  // Prevent delete/backspace from deleting elements
                  e.stopPropagation();
                }}
                className="w-full px-2 py-1 text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={propType}
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">{propType}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
