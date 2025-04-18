import React from "react";
import {
  Avatar as AvatarCN,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { env } from "next-runtime-env";

type Props = {
  url?: string;
  username?: string;
  collectionID?: string;
  id?: string;
  className?: string;
  onClick?: () => void;
};

function Avatar({
  url,
  username,
  id,
  className,
  collectionID,
  onClick,
}: Props) {
  const src = `${env("NEXT_PUBLIC_POCKETBASE_URL")}/api/files/${collectionID}/${id}/${url}`;

  return (
    <AvatarCN className={className} onClick={onClick}>
      <AvatarImage src={src} alt={username} />
      <AvatarFallback>
        {username?.charAt(0).toUpperCase()}
        {username?.charAt(1).toLowerCase()}
      </AvatarFallback>
    </AvatarCN>
  );
}

export default Avatar;
