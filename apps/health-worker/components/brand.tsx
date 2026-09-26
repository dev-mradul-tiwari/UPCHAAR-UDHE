import * as React from "react";
import { HeartPulse } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HeartPulse className="h-5 w-5" />
      </div>
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-foreground">
          Upchaar<span className="text-primary">Worker</span>
        </span>
      )}
    </div>
  );
}
