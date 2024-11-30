"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import Container from "./container";
import { Separator } from "./ui/separator";

import { nightTokyo } from "@/utils/fonts";
import { ROUTES } from "@/constants/routes";
import React, { ReactNode, useState } from "react";

import SearchBar from "./search-bar";
import { MenuIcon, X } from "lucide-react";
import useScrollPosition from "@/hooks/use-scroll-position";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";

const menuItems: Array<{ title: string; href?: string }> = [
  // {
  //   title: "Home",
  //   href: ROUTES.HOME,
  // },
  // {
  //   title: "Catalog",
  // },
  // {
  //   title: "News",
  // },
  // {
  //   title: "Collection",
  // },
];

const NavBar = () => {
  const { y } = useScrollPosition();
  const isHeaderFixed = true;
  const isHeaderSticky = y > 0;

  return (
    <div
      className={cn([
        "h-fit w-full",
        "sticky top-0 z-[100] duration-300",
        isHeaderFixed ? "fixed bg-gradient-to-b from-slate-700" : "",
        isHeaderSticky
          ? "bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-10 bg-slate-900"
          : "",
      ])}
    >
      <Container className="flex items-center justify-between py-2 gap-20 ">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-1 cursor-pointer"
        >
          <Image src="/icon.png" alt="logo" width={70} height={70} />
          <h1
            className={cn([
              nightTokyo.className,
              "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest",
            ])}
          >
            Kitsunee
          </h1>
        </Link>
        <div className="hidden lg:flex items-center gap-10 ml-20">
          {menuItems.map((menu, idx) => (
            <Link href={menu.href || "#"} key={idx}>
              {menu.title}
            </Link>
          ))}
        </div>
        <SearchBar className="hidden w-1/3 lg:flex" />

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
      <SheetContent
        className="flex flex-col w-[80vw] z-[150]"
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="w-full h-full relative">
          <SheetClose className="absolute top-0 right-0">
            <X />
          </SheetClose>
          <div className="flex flex-col gap-5 mt-10">
            {menuItems.map((menu, idx) => (
              <Link
                href={menu.href || "#"}
                key={idx}
                onClick={() => setOpen(false)}
              >
                {menu.title}
              </Link>
            ))}
            <Separator />
            <SearchBar onAnimeClick={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavBar;
