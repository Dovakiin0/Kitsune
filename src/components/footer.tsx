import React from "react";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-base-300 shadow-xl p-5 flex flex-col items-center space-y-5">
      <Image src="/icon.png" alt="logo" width="100" height="100" suppressHydrationWarning />
      <div className="flex space-x-5 items-center">
        <a href="https://github.com/Dovakiin0/Kitsune" target="_blank">
            <GitHubLogoIcon suppressHydrationWarning width="25" height="25" />
        </a>
        <a href="https://discord.gg/6yAJ3XDHTt" target="_blank">
            <DiscordLogoIcon suppressHydrationWarning width="25" height="25" />
        </a>
      </div>
      <p className="text-sm text-gray-300">
        Kitsune does not store any files on the server, we only link to the
        media which is hosted on 3rd party services.
      </p>
      <p className="text-sm text-gray-300">&copy; Kitsune</p>
    </footer>
  );
};

export default Footer;
