"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:opacity-90",
            outline: "border bg-card hover:bg-secondary",
            ghost: "hover:bg-secondary",
            destructive: "bg-destructive text-white hover:opacity-90",
        },
        size: { default: "h-9 px-4", sm: "h-8 px-3 text-xs", icon: "h-8 w-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
});
export const Button = React.forwardRef(({ className, variant, size, type = "button", ...p }, ref) => (<button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...p}/>));
Button.displayName = "Button";
export const linkButton = (variant = "outline", size = "default") => buttonVariants({ variant, size });
const field = "w-full rounded-md border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
export const Input = React.forwardRef(({ className, ...p }, ref) => (<input ref={ref} className={cn(field, "h-9", className)} {...p}/>));
Input.displayName = "Input";
export const Textarea = React.forwardRef(({ className, ...p }, ref) => (<textarea ref={ref} className={cn(field, "py-2 min-h-[70px]", className)} {...p}/>));
Textarea.displayName = "Textarea";
export const Select = React.forwardRef(({ className, ...p }, ref) => (<select ref={ref} className={cn(field, "h-9", className)} {...p}/>));
Select.displayName = "Select";
export function Field({ label, error, children, className }) {
    return (<label className={cn("block space-y-1", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
    </label>);
}
export function Card({ className, ...p }) {
    return <div className={cn("rounded-lg border bg-card shadow-sm", className)} {...p}/>;
}
export const CardHeader = ({ className, ...p }) => <div className={cn("flex items-center justify-between gap-2 border-b px-4 py-3", className)} {...p}/>;
export const CardTitle = ({ className, ...p }) => <h3 className={cn("text-sm font-semibold", className)} {...p}/>;
export const CardBody = ({ className, ...p }) => <div className={cn("p-4", className)} {...p}/>;
const badgeColors = {
    DRAFT: "bg-gray-100 text-gray-700", ISSUED: "bg-blue-100 text-blue-800", PARTIALLY_PAID: "bg-amber-100 text-amber-800",
    PAID: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-100 text-red-700", NOT_BILLED: "bg-gray-100 text-gray-500",
    ACTIVE: "bg-emerald-100 text-emerald-800", INACTIVE: "bg-gray-100 text-gray-500",
};
export function StatusBadge({ status }) {
    return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", badgeColors[status] ?? badgeColors.DRAFT)}>{status.replace("_", " ")}</span>;
}
export function Dialog({ open, onOpenChange, title, children, wide }) {
    return (<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40"/>
        <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-card p-5 shadow-xl", wide ? "max-w-3xl" : "max-w-xl")}>
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded p-1 hover:bg-secondary" aria-label="Close"><X className="h-4 w-4"/></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>);
}
export function ErrorText({ children }) {
    return children ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p> : null;
}
