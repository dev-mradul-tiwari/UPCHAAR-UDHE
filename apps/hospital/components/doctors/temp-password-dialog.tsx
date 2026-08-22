"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@upchaar/ui/dialog";
import { Button } from "@upchaar/ui/button";

interface TempPasswordDialogProps {
  password: string;
  onClose: () => void;
}

export function TempPasswordDialog({ password, onClose }: TempPasswordDialogProps) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Temporary Password Created</DialogTitle>
          <DialogDescription>
            This password will be shown only once. Copy it now and share it with the doctor.
            They must change it on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-warning bg-warning/5 p-4">
            <p className="font-mono text-lg font-semibold tracking-wider">{password}</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy password
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Got it, thanks</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
