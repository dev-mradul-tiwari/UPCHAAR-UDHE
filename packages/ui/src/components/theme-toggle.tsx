"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useTheme, type Theme } from "./theme-provider";

export interface ThemeToggleProps extends Omit<ButtonProps, "onClick" | "children"> {
  /** `"button"` flips light/dark directly; `"menu"` offers Light/Dark/System. */
  mode?: "button" | "menu";
}

const OPTIONS: ReadonlyArray<{ value: Theme; label: string; icon: React.ReactNode }> = [
  { value: "light", label: "Light", icon: <Sun aria-hidden /> },
  { value: "dark", label: "Dark", icon: <Moon aria-hidden /> },
  { value: "system", label: "System", icon: <Monitor aria-hidden /> },
];

export function ThemeToggle({
  mode = "button",
  variant = "ghost",
  size = "icon",
  className,
  ...props
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (mode === "button") {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={toggleTheme}
        aria-label={
          resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"
        }
        {...props}
      >
        {resolvedTheme === "dark" ? <Moon aria-hidden /> : <Sun aria-hidden />}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          aria-label="Change theme"
          {...props}
        >
          {resolvedTheme === "dark" ? <Moon aria-hidden /> : <Sun aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => setTheme(option.value)}
            className={cn(theme === option.value && "bg-accent text-accent-foreground")}
          >
            {option.icon}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
