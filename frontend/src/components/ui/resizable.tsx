"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import { cn } from "./utils";

function ResizablePanelGroup({ className, ...props }: any) {
  return <div className={cn("flex h-full w-full", className)} {...props} />;
}

function ResizablePanel({ className, ...props }: any) {
  return <div className={cn("flex-1", className)} {...props} />;
}

function ResizableHandle({ withHandle, className, ...props }: any) {
  return (
    <div className={cn("relative flex w-px bg-border", className)} {...props}>
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVerticalIcon className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
