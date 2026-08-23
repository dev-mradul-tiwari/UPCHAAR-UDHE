"use client";

import { Languages } from "lucide-react";

import { Button, type ButtonProps } from "./button";
import { useLanguage } from "./language-provider";

export interface LanguageToggleProps extends Omit<ButtonProps, "onClick" | "children"> {}

export function LanguageToggle({
  variant = "ghost",
  size = "sm",
  className,
  ...props
}: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={toggleLanguage}
      aria-label="Toggle Language"
      title={language === "en" ? "Switch to Hindi (हिंदी)" : "Switch to English"}
      {...props}
    >
      <Languages className="size-4 mr-1.5" aria-hidden />
      <span className="font-semibold text-xs">{language === "en" ? "EN | हिंदी" : "हिंदी | EN"}</span>
    </Button>
  );
}
