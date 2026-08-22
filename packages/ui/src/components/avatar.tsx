"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn, initials } from "../lib/utils";

export type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root>;

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border",
        className,
      )}
      {...props}
    />
  );
}

export type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>;

export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

export type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback>;

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary-subtle-foreground",
        className,
      )}
      {...props}
    />
  );
}

export interface UserAvatarProps extends AvatarProps {
  /** Full name — drives both the alt text and the initials fallback. */
  name: string;
  src?: string | null;
}

/** Convenience wrapper: image with an automatic initials fallback. */
export function UserAvatar({ name, src, className, ...props }: UserAvatarProps) {
  return (
    <Avatar className={className} {...props}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback delayMs={src ? 300 : 0}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
