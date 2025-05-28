import React from "react";
import Avatar from "./common/avatar";
import { IAuthStore } from "@/store/auth-store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { pb } from "@/lib/pocketbase";

type Props = {
  auth: IAuthStore;
};

function NavbarAvatar({ auth }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    auth.auth && (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Avatar
            username={auth.auth.username}
            url={auth.auth.avatar}
            id={auth.auth.id}
            collectionID={auth.auth.collectionId}
          />
        </PopoverTrigger>
        <PopoverContent className="bg-black bg-opacity-50 backdrop-blur-sm w-[200px] mt-4 mr-4 text-sm flex flex-col space-y-2">
          <div className="mb-2">
            <p>
              Hello, <span className="text-red-500">@{auth.auth.username}</span>
            </p>
          </div>
          <div className="border-b border-gray-600 pb-2">
            <Link
              href={`/profile/${auth.auth.username}`}
              className="flex flex-row space-x-2 items-center"
              onClick={() => setOpen(false)}
            >
              <User size="20" />
              <p>Profile</p>
            </Link>
          </div>

          <div
            className="flex flex-row space-x-2 items-center cursor-pointer "
            onClick={() => {
              pb.authStore.clear();
              auth.clearAuth();
            }}
          >
            <LogOut size="20" />
            <p>Logout</p>
          </div>
        </PopoverContent>
      </Popover>
    )
  );
}

export default NavbarAvatar;
