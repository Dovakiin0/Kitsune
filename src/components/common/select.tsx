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
    <SelectCN defaultValue={props.value} onValueChange={props.onChange}>
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
            <div key={i} className="flex items-center">
              {option.icon && <option.icon />}
              <SelectItem value={option.value}>{option.label}</SelectItem>
            </div>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectCN>
  );
}

export default Select;
