import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

import Link, { LinkProps } from "next/link";
import { buttonVariants } from "../ui/button";
import { VariantProps } from "class-variance-authority";

interface ButtonLinkProps
  extends LinkProps,
    VariantProps<typeof buttonVariants>,
    Omit<React.ComponentProps<"a">, "href" | "ref"> {
  children?: React.ReactNode;
  LeftIcon?: React.FC<React.ComponentProps<"svg">>;
  RightIcon?: React.FC<React.ComponentProps<"svg">> | LucideIcon;
  className?: string;
  classNames?: {
    leftIcon?: string;
    rightcon?: string;
  };
}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      children,
      LeftIcon,
      RightIcon,
      classNames,
      variant,
      size,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Link
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {LeftIcon && (
          <LeftIcon
            className={cn("mr-1", classNames?.leftIcon)}
            strokeWidth={1}
          />
        )}

        {children}

        {RightIcon && (
          <RightIcon className={cn("ml-1", classNames?.rightcon)} />
        )}
      </Link>
    );
  },
);

ButtonLink.displayName = "ButtonLink";

export type { ButtonLinkProps };
export { ButtonLink };
