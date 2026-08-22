import * as React from "react";

import { cn } from "../lib/utils";
import { fieldBaseClass } from "./input";

export type TextareaProps = React.ComponentProps<"textarea">;

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        fieldBaseClass,
        "min-h-20 resize-y px-3 py-2 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
