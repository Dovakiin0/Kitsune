import {
  Tooltip as TooltipCN,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
};

export default function Tooltip(props: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipCN>
        <TooltipTrigger asChild className={props.className}>
          {props.children}
        </TooltipTrigger>
        <TooltipContent side={props.side} className="m-2 z-[9999]">
          {props.content}
        </TooltipContent>
      </TooltipCN>
    </TooltipProvider>
  );
}
