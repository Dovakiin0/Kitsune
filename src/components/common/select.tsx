import React from "react";
import {
  Select as SelectCN,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart } from "lucide-react";

export type ISelectOptions = {
  value: string;
  label: string;
  icon?: React.FC;
};

type Props = {
  placeholder: string;
  options: ISelectOptions[];
  value?: string;
  onChange?: (value: string) => void;
};

function Select(props: Props) {
  const value = props.options.find((option) => option.value === props.value);

  return (
    <SelectCN defaultValue={props.value} onValueChange={props.onChange}>
      <SelectTrigger className="w-[180px]">
        {value?.icon ? <value.icon /> : <Heart />}
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[101]">
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
