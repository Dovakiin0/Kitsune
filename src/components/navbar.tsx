"use client";

import Link from "next/link";
import { Input } from "./ui/input";
import Container from "./container";
import { Separator } from "./ui/separator";
import React, { ReactNode, useState } from "react";
import { MenuIcon, Search, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { nightTokyo } from "@/utils/fonts";
import Image from "next/image";

const menuItems: Array<{ title: string }> = [
  {
    title: "Home",
  },
  {
    title: "Catalog",
  },
  {
    title: "News",
  },
  {
    title: "Collection",
  },
];

const NavBar = () => {
  return (
    <div className="h-fit w-full bg-gray-400 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 fixed top-0 z-50">
      <Container className="flex items-center justify-between py-2 gap-20">
        <div className="flex items-center gap-1 cursor-pointer">
          <Image src="/icon.png" alt="logo" width="80" height="80" />
          <h1
            className={cn([
              nightTokyo.className,
              "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest",
            ])}
          >
            Kitsunee
          </h1>
        </div>
        <div className="hidden lg:flex items-center gap-10 ml-20">
          {menuItems.map((menu, idx) => (
            <Link href={"#"} key={idx}>
              {menu.title}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex relative w-full min-h-fit">
          <Search className="absolute inset-y-0 left-2 m-auto h-4 w-4" />
          <Input
            className="w-full h-10 pl-8 text-black border-white"
            placeholder="Enter your keywords to search..."
          />
        </div>

        <div className="lg:hidden">
          <MobileMenuSheet trigger={<MenuIcon />} />
        </div>
      </Container>
    </div>
  );
};

const MobileMenuSheet = ({ trigger }: { trigger: ReactNode }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col w-[80vw]" hideCloseButton>
        <div className="w-full h-full relative">
          <SheetClose className="absolute top-3 -left-16">
            <X />
          </SheetClose>
          <div className="flex flex-col gap-5">
            {menuItems.map((menu, idx) => (
              <Link href={"#"} key={idx}>
                {menu.title}
              </Link>
            ))}
            <Separator />
            <div className="relative w-full min-h-fit">
              <Search className="absolute inset-y-0 left-2 m-auto h-4 w-4" />
              <Input
                className="w-full h-10 pl-8"
                placeholder="Enter your keywords to search..."
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavBar;

