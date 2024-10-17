import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  className?: string;
};

const Container = (props: Props) => {
  return (
    <div
      className={cn([
        "mx-auto w-full",
        "px-4",
        "md:px-6 lg:px-8",
        "max-w-[1400px] 2xl:max-w-[1600px]",
        props.className,
      ])}
    >
      {props.children}
    </div>
  );
};

export default Container;

