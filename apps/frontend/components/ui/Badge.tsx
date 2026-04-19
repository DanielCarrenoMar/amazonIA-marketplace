import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "outline" | "nature";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "primary",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-semibold rounded-full whitespace-nowrap";

  const variants = {
    primary: "bg-brand-primary/15 text-brand-primary",
    secondary: "bg-brand-secondary/15 text-brand-secondary",
    accent: "bg-brand-accent/20 text-amber-700 dark:text-brand-accent",
    danger: "bg-brand-urgency/15 text-brand-urgency",
    outline: "border border-border text-muted",
    nature: "bg-brand-nature-bg text-brand-nature-content border border-brand-primary-light",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
