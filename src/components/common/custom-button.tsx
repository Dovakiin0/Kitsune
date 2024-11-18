import React from "react";
import {
  Button as ShadButton,
  ButtonProps as IButtonProps,
} from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpinnerIcon } from "@/icons/spinner";

interface ButtonProps extends IButtonProps {
  disabled?: boolean;
  loading?: boolean;
  iconClass?: string;
  iconColor?: string;
  LeftIcon?: React.FC<React.ComponentProps<"svg">> | LucideIcon;
  RightIcon?: React.FC<React.ComponentProps<"svg">> | LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      RightIcon,
      LeftIcon,
      loading,
      iconClass,
      iconColor,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <ShadButton
        ref={ref}
        loading={loading}
        className={cn([
          className,
          // adjust padding based on icon presence
          [!!LeftIcon && ["pl-3.5"]],
          [!!RightIcon && ["pr-3.5"]],
        ])}
        {...props}
      >
        {loading && <SpinnerIcon className="mr-2 h-5 w-5" />}

        {LeftIcon && (
          <LeftIcon
            className={cn("mr-1", iconClass)}
            color={iconColor}
            strokeWidth={1}
          />
        )}

        {children}

        {RightIcon && (
          <RightIcon className={cn("ml-1", iconClass)} color={iconColor} />
        )}
      </ShadButton>
    );
  },
);

Button.displayName = "CustomButton";

export type { ButtonProps };
export default Button;
