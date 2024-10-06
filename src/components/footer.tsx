import React from "react";
import Container from "./container";
import {
  DiscordLogoIcon,
  InstagramLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";

const Footer = () => {
  return (
    <footer className="border-t py-10">
      <Container className="flex items-center justify-between">
        <div className="flex flex-col md:flex-row gap-10">
          <span>Kitsunee.me</span>
          <span>Terms &amp; Privacy</span>
          <span>Contacts</span>
        </div>
        <div className="flex flex-col md:flex-row gap-10">
          <InstagramLogoIcon className="h-6 w-6" />
          <DiscordLogoIcon className="h-6 w-6" />
          <TwitterLogoIcon className="h-6 w-6" />
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

