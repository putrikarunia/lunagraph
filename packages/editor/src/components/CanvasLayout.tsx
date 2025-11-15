"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import React, { PropsWithChildren } from "react";

export default function CanvasLayout({
  leftChildren,
  rightChildren,
  bottomChildren,
  children
}: PropsWithChildren<{
  leftChildren: React.ReactNode;
  rightChildren?: React.ReactNode;
  bottomChildren?: React.ReactNode;
}>) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <PanelGroup direction="horizontal">
        {/* Left Sidebar */}
        <Panel defaultSize={20} minSize={10} maxSize={40}>
          <div className="h-full w-full bg-background border-r border-border overflow-hidden">
            {leftChildren}
          </div>
        </Panel>

        <PanelResizeHandle className="w-px bg-border hover:bg-zinc-600 transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={60} minSize={30}>
          <PanelGroup direction="vertical">
            {/* Canvas Area */}
            <Panel defaultSize={70} minSize={30}>
              <div className="h-full w-full bg-neutral-200">
                {children}
              </div>
            </Panel>

            <PanelResizeHandle className="h-px bg-border hover:bg-zinc-600 transition-colors" />

            {/* Code Editor Area */}
            <Panel defaultSize={30} minSize={15} maxSize={70}>
              <div className="h-full w-full bg-background">
                {bottomChildren}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-px bg-border hover:bg-zinc-600 transition-colors" />

        {/* Right Sidebar */}
        <Panel defaultSize={20} minSize={10} maxSize={40}>
          <div className="h-full w-full bg-background border-l border-border">
            {rightChildren}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
