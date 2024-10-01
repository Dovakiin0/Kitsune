import Link from "next/link";
import { FaDiscord, FaGithub } from "react-icons/fa";
import React from "react";

export const Footer = (props: {}) => {
  return (
    <footer className="w-full bg-base-300 shadow-xl p-5 flex flex-col items-center space-y-5">
      <img src="/icon.png" alt="logo" width="100" height="100" />
      <div className="flex space-x-5 items-center">
        <a href="https://github.com/Dovakiin0/Kitsune" target="_blank">
          <FaGithub size={25} />
        </a>
        <a href="https://discord.gg/6yAJ3XDHTt" target="_blank">
          <FaDiscord size={25} />
        </a>
      </div>
      <p className="text-sm text-gray-300">
        Kitsune does not store any files on our server, we only linked to the
        media which is hosted on 3rd party services.
      </p>
      <p className="text-sm text-gray-300">&copy; Kitsune</p>
    </footer>
  );
};
