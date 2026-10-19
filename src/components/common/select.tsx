import React from "react";
import {
  Select as SelectCN,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ISelectOptions = {
  value: string;
  label: string;
  icon?: React.FC;
};

type Props = {
  placeholder: string;
  placeholderIcon?: React.FC;
  options: ISelectOptions[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

function Select(props: Props) {
  const value = props.options.find((option) => option.value === props.value);

  return (
    <SelectCN value={props.value ?? ""} onValueChange={props.onChange}>
      <SelectTrigger className={cn("w-[180px]", props.className)}>
        {value?.icon ? (
          <value.icon />
        ) : props.placeholderIcon ? (
          <props.placeholderIcon />
        ) : (
          <></>
        )}
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent className={cn("z-[101] text-sm", props.className)}>
        <SelectGroup>
          {props.options.map((option, i) => (
            <SelectItem key={option.value || i} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon && <option.icon />}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectCN>
  );
}

export default Select;
