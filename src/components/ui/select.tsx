"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };
type SharedProps = Pick<
  ComponentProps<"button">,
  | "id"
  | "className"
  | "disabled"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-invalid"
  | "onBlur"
  | "onFocus"
  | "ref"
> & { options: SelectOption[]; name?: string; placeholder?: string };

export function Select({
  value,
  onValueChange,
  name,
  ...props
}: SharedProps & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <SelectPrimitive.Root<string>
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
      items={props.options}
      name={name}
      disabled={props.disabled}
    >
      <SelectBody {...props} />
    </SelectPrimitive.Root>
  );
}

export function MultiSelect({
  value,
  onValueChange,
  name,
  ...props
}: SharedProps & {
  value: string[];
  onValueChange: (value: string[]) => void;
}) {
  return (
    <SelectPrimitive.Root<string, true>
      multiple
      value={value}
      onValueChange={onValueChange}
      items={props.options}
      name={name}
      disabled={props.disabled}
    >
      <SelectBody {...props} />
    </SelectPrimitive.Root>
  );
}

function SelectBody({
  options,
  className,
  placeholder = "Choose an option",
  ...props
}: SharedProps) {
  return (
    <>
      <SelectPrimitive.Trigger
        {...props}
        data-slot="select"
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors outline-none hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
          className,
        )}
      >
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate text-left"
        />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
          <ChevronDown className="size-3.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-[120] outline-none"
        >
          <SelectPrimitive.Popup className="max-h-[min(20rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg transition-opacity outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex min-h-9 cursor-pointer items-center gap-2 rounded-lg py-2 pr-3 pl-8 text-[13px] outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:font-medium data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 text-primary">
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
              {!options.length && (
                <p className="px-3 py-4 text-xs text-muted-foreground">
                  No options available
                </p>
              )}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </>
  );
}
