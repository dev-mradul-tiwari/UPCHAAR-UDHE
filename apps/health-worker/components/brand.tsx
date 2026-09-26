import * as React from "react";
import { HeartPulse } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <HeartPulse className="size-5" />
      </div>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Upchaar
          </span>
          <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
            Health Worker
          </span>
        </span>
      )}
    </div>
  );
}
