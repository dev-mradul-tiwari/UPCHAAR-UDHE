/**
 * @upchaar/ui — shared design system.
 *
 * Prefer the per-component subpath so bundlers keep client boundaries tight:
 *   import { Button } from "@upchaar/ui/button";
 * This barrel exists for convenience and for `import type` usage.
 */

/* ------------------------------------------------------------------- utils */
export { cn, clamp, initials } from "./lib/utils";
export type { ClassValue } from "./lib/utils";

/* ------------------------------------------------------------------- forms */
export { Button, buttonVariants } from "./components/button";
export type { ButtonProps } from "./components/button";

export { Input, fieldBaseClass } from "./components/input";
export type { InputProps } from "./components/input";

export { Label } from "./components/label";
export type { LabelProps } from "./components/label";

export { Textarea } from "./components/textarea";
export type { TextareaProps } from "./components/textarea";

export { Checkbox } from "./components/checkbox";
export type { CheckboxProps } from "./components/checkbox";

export { Switch } from "./components/switch";
export type { SwitchProps } from "./components/switch";

export { RadioGroup, RadioGroupItem, RadioCard } from "./components/radio-group";
export type {
  RadioGroupProps,
  RadioGroupItemProps,
  RadioCardProps,
} from "./components/radio-group";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/select";
export type {
  SelectContentProps,
  SelectItemProps,
  SelectLabelProps,
  SelectSeparatorProps,
  SelectTriggerProps,
} from "./components/select";

export {
  DateInput,
  TimeInput,
  toDateInputValue,
  todayInputValue,
} from "./components/date-input";
export type { DateInputProps, TimeInputProps } from "./components/date-input";

export { FormField, FormRow } from "./components/form-field";
export type { FormFieldProps, FormControlProps } from "./components/form-field";

/* ---------------------------------------------------------------- surfaces */
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";

export { Badge, badgeVariants } from "./components/badge";
export type { BadgeProps } from "./components/badge";

export { Avatar, AvatarFallback, AvatarImage, UserAvatar } from "./components/avatar";
export type {
  AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
  UserAvatarProps,
} from "./components/avatar";

export { Separator } from "./components/separator";
export type { SeparatorProps } from "./components/separator";

export { Skeleton, SkeletonText } from "./components/skeleton";
export type { SkeletonProps, SkeletonTextProps } from "./components/skeleton";

export { Alert, AlertDescription, AlertTitle, alertVariants } from "./components/alert";
export type { AlertProps } from "./components/alert";

export { Progress } from "./components/progress";
export type { ProgressProps } from "./components/progress";

/* ------------------------------------------------------------------- table */
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/table";

export { DataTable } from "./components/data-table";
export type {
  DataTableColumn,
  DataTableProps,
  ColumnAlign,
} from "./components/data-table";

export { Pagination, paginationRange } from "./components/pagination";
export type { PaginationProps } from "./components/pagination";

/* ---------------------------------------------------------------- overlays */
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from "./components/tabs";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog";
export type {
  DialogContentProps,
  DialogDescriptionProps,
  DialogOverlayProps,
  DialogTitleProps,
} from "./components/dialog";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "./components/sheet";
export type { SheetContentProps, SheetSide } from "./components/sheet";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./components/dropdown-menu";
export type {
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSubTriggerProps,
} from "./components/dropdown-menu";

export {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "./components/popover";
export type { PopoverContentProps } from "./components/popover";

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "./components/tooltip";
export type {
  TooltipProps,
  TooltipContentProps,
  TooltipProviderProps,
} from "./components/tooltip";

export { Toaster, toast } from "./components/sonner";
export type { ToasterProps } from "./components/sonner";

/* -------------------------------------------------------------- app pieces */
export { PageHeader } from "./components/page-header";
export type { PageHeaderProps } from "./components/page-header";

export { EmptyState } from "./components/empty-state";
export type { EmptyStateProps } from "./components/empty-state";

export { StatCard, StatCardGrid } from "./components/stat-card";
export type {
  StatCardProps,
  StatDelta,
  StatTone,
  DeltaDirection,
} from "./components/stat-card";

export { StatusBadge, APPOINTMENT_STATUS_META } from "./components/status-badge";
export type { StatusBadgeProps } from "./components/status-badge";

export { SeverityBadge, INTERACTION_SEVERITY_META } from "./components/severity-badge";
export type { SeverityBadgeProps } from "./components/severity-badge";

export { QueuePosition } from "./components/queue-position";
export type { QueuePositionProps } from "./components/queue-position";

/* ------------------------------------------------------------------ theme */
export {
  ThemeProvider,
  ThemeScript,
  useOptionalTheme,
  useTheme,
  DEFAULT_THEME_STORAGE_KEY,
} from "./components/theme-provider";
export type {
  Theme,
  ResolvedTheme,
  ThemeContextValue,
  ThemeProviderProps,
  ThemeScriptProps,
} from "./components/theme-provider";

export { ThemeToggle } from "./components/theme-toggle";
export type { ThemeToggleProps } from "./components/theme-toggle";
