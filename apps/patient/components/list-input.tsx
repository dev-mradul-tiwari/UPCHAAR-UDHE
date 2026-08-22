"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@upchaar/ui/button";
import { Input } from "@upchaar/ui/input";

export interface ListInputProps {
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: true | undefined;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Copy shown in place of the chips when the list is empty. */
  emptyHint?: string;
  /** Accessible name for the list of chips. */
  listLabel: string;
}

/**
 * A free-text list: type, press Enter (or Add), and the entry becomes a
 * removable chip. Used for allergies, medications, surgeries and the like.
 */
export function ListInput({
  id,
  value,
  onChange,
  placeholder,
  emptyHint = "Nothing added yet.",
  listLabel,
  ...field
}: ListInputProps) {
  const [draft, setDraft] = React.useState("");

  function add() {
    const entry = draft.trim();
    if (entry.length === 0) return;
    const exists = value.some((item) => item.toLowerCase() === entry.toLowerCase());
    if (!exists) onChange([...value, entry]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, position) => position !== index));
  }

  return (
    <div className="grid gap-2.5">
      <div className="flex gap-2">
        <Input
          {...field}
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={draft.trim().length === 0}
        >
          <Plus aria-hidden />
          Add
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul aria-label={listLabel} className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <li key={item}>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 text-sm text-secondary-foreground">
                {item}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${item}`}
                  className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:outline-none"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
