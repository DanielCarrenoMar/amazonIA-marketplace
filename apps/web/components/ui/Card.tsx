"use client";

import React from "react";

/*Card (contenedor raíz)*/
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated" | "nature" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "md" | "lg" | "xl" | "2xl" | "3xl";
  hoverable?: boolean;
  overflowVisible?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      variant = "default",
      padding = "md",
      rounded = "2xl",
      hoverable = false,
      overflowVisible = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `relative transition-all duration-300 ${!overflowVisible ? "overflow-hidden" : ""}`;

    const variants = {
      default: "bg-white border border-border shadow-sm",
      bordered: "bg-white border-2 border-brand-primary/20",
      elevated:
        "bg-white border border-border shadow-lg shadow-brand-primary/5",
      nature:
        "bg-brand-nature-bg border border-brand-primary-light text-brand-nature-content",
      glass:
        "bg-white/60 backdrop-blur-md border border-white/30 shadow-lg",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const roundedMap = {
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
    };

    const hoverStyles = hoverable
      ? "hover:shadow-xl hover:-translate-y-1 "
      : "";

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${roundedMap[rounded]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/*CardHeader*/
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/*CardTitle*/
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h2" | "h3" | "h4";
}

export function CardTitle({
  className = "",
  as: Tag = "h3",
  children,
  ...props
}: CardTitleProps) {
  return (
    <Tag
      className={`font-outfit font-semibold text-lg text-foreground ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

/*CardDescription*/
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({
  className = "",
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p className={`text-sm text-muted leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

/*CardBody*/
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className = "", children, ...props }: CardBodyProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

/*CardFooter*/
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div
      className={`mt-6 pt-4 border-t border-border flex items-center gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/*CardImage*/
interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  overlay?: boolean;
}

export function CardImage({
  className = "",
  overlay = false,
  alt = "",
  ...props
}: CardImageProps) {
  return (
    <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden">
      <img
        className={`w-full h-48 object-cover ${className}`}
        alt={alt}
        {...props}
      />
      {overlay && (
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
      )}
    </div>
  );
}
